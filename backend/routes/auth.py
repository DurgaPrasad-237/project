from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, set_access_cookies,
    set_refresh_cookies, unset_jwt_cookies
)
import bcrypt
from database import get_db

auth_bp = Blueprint("auth", __name__)


def fetchone(cursor):
    """Return a single MySQL row as a dict, or None."""
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data     = request.get_json()
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role     = data.get("role", "employee")

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if role not in ("employer", "employee"):
        return jsonify({"error": "Role must be 'employer' or 'employee'"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn   = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed, role)
        )
        conn.commit()
    except Exception:
        conn.rollback()
        return jsonify({"error": "Email already registered"}), 409
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Account created successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = fetchone(cursor)
    cursor.close()
    conn.close()

    if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
        return jsonify({"error": "Invalid email or password"}), 401

    identity          = str(user["id"])
    additional_claims = {
        "role":  user["role"],
        "name":  user["name"],
        "email": user["email"],
    }

    access_token  = create_access_token(identity=identity, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=identity, additional_claims=additional_claims)

    resp = make_response(jsonify({
        "message": "Login successful",
        "user": {
            "id":    user["id"],
            "name":  user["name"],
            "email": user["email"],
            "role":  user["role"],
        }
    }))
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp, 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (identity,))
    user = fetchone(cursor)
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    additional_claims = {
        "role":  user["role"],
        "name":  user["name"],
        "email": user["email"],
    }
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)

    resp = make_response(jsonify({"message": "Token refreshed"}))
    set_access_cookies(resp, access_token)
    return resp, 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"message": "Logged out"}))
    unset_jwt_cookies(resp)
    return resp, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, role, employer_id FROM users WHERE id = %s", (identity,)
    )
    user = fetchone(cursor)
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user), 200
