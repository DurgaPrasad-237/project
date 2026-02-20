from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import bcrypt
from database import get_db

users_bp = Blueprint("users", __name__)


def fetchone(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def fetchall(cursor):
    rows = cursor.fetchall()
    if not rows:
        return []
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


@users_bp.route("/", methods=["GET"])
@jwt_required()
def list_users():
    claims   = get_jwt()
    identity = get_jwt_identity()
    role     = claims.get("role")

    conn   = get_db()
    cursor = conn.cursor()

    if role == "employer":
        cursor.execute(
            "SELECT id, name, email, role, employer_id FROM users WHERE id = %s OR employer_id = %s",
            (identity, identity)
        )
    else:
        cursor.execute("SELECT id, name, email, role, employer_id FROM users")

    users = fetchall(cursor)
    cursor.close()
    conn.close()
    return jsonify(users), 200


@users_bp.route("/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, role, employer_id FROM users WHERE id = %s", (user_id,)
    )
    user = fetchone(cursor)
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user), 200


@users_bp.route("/", methods=["POST"])
@jwt_required()
def create_user():
    claims   = get_jwt()
    identity = get_jwt_identity()
    role     = claims.get("role")

    if role != "employer":
        return jsonify({"error": "Only employers can add employees"}), 403

    data     = request.get_json()
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn   = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (name, email, password, role, employer_id) VALUES (%s, %s, %s, 'employee', %s)",
            (name, email, hashed, int(identity))
        )
        conn.commit()
        new_id = cursor.lastrowid
    except Exception:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Email already in use"}), 409

    cursor.execute(
        "SELECT id, name, email, role, employer_id FROM users WHERE id = %s", (new_id,)
    )
    user = fetchone(cursor)
    cursor.close()
    conn.close()
    return jsonify(user), 201


@users_bp.route("/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    claims   = get_jwt()
    identity = int(get_jwt_identity())
    role     = claims.get("role")

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    target = fetchone(cursor)

    if not target:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if role == "employer":
        if user_id != identity and target["employer_id"] != identity:
            cursor.close()
            conn.close()
            return jsonify({"error": "You can only edit yourself or your employees"}), 403
    else:
        if user_id != identity:
            cursor.close()
            conn.close()
            return jsonify({"error": "You can only edit your own profile"}), 403

    data         = request.get_json()
    name         = data.get("name", target["name"])
    email        = (data.get("email", target["email"]) or "").strip().lower()
    new_password = data.get("password")

    try:
        if new_password:
            hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
            cursor.execute(
                "UPDATE users SET name=%s, email=%s, password=%s WHERE id=%s",
                (name, email, hashed, user_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET name=%s, email=%s WHERE id=%s",
                (name, email, user_id)
            )
        conn.commit()
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Update failed: " + str(e)}), 409

    cursor.execute(
        "SELECT id, name, email, role, employer_id FROM users WHERE id = %s", (user_id,)
    )
    updated = fetchone(cursor)
    cursor.close()
    conn.close()
    return jsonify(updated), 200


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    claims   = get_jwt()
    identity = int(get_jwt_identity())
    role     = claims.get("role")

    if role != "employer":
        return jsonify({"error": "Only employers can delete employees"}), 403

    if user_id == identity:
        return jsonify({"error": "Cannot delete your own account"}), 400

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    target = fetchone(cursor)

    if not target or target["employer_id"] != identity:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found or not your employee"}), 404

    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "User deleted"}), 200
