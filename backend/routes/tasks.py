from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db

tasks_bp = Blueprint("tasks", __name__)

TASK_JOIN = """
    SELECT t.*,
           u1.name AS assigned_to_name,
           u2.name AS created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by  = u2.id
"""


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


@tasks_bp.route("/", methods=["GET"])
@jwt_required()
def list_tasks():
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute(TASK_JOIN + " ORDER BY t.created_at DESC")
    tasks = fetchall(cursor)
    cursor.close()
    conn.close()
    return jsonify(tasks), 200


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute(TASK_JOIN + " WHERE t.id = %s", (task_id,))
    task = fetchone(cursor)
    cursor.close()
    conn.close()
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task), 200


@tasks_bp.route("/", methods=["POST"])
@jwt_required()
def create_task():
    identity = int(get_jwt_identity())
    data     = request.get_json()

    title       = (data.get("title") or "").strip()
    description = data.get("description") or ""
    status      = data.get("status", "pending")
    assigned_to = data.get("assigned_to") or None

    if not title:
        return jsonify({"error": "Title is required"}), 400

    if status not in ("pending", "in_progress", "completed"):
        return jsonify({"error": "Invalid status"}), 400

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (title, description, status, assigned_to, created_by) VALUES (%s, %s, %s, %s, %s)",
        (title, description, status, assigned_to, identity)
    )
    conn.commit()
    task_id = cursor.lastrowid

    cursor.execute(TASK_JOIN + " WHERE t.id = %s", (task_id,))
    task = fetchone(cursor)
    cursor.close()
    conn.close()
    return jsonify(task), 201


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    data = request.get_json()

    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = %s", (task_id,))
    existing = fetchone(cursor)

    if not existing:
        cursor.close()
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    title       = data.get("title",       existing["title"])
    description = data.get("description", existing["description"])
    status      = data.get("status",      existing["status"])
    assigned_to = data.get("assigned_to", existing["assigned_to"]) or None

    if status not in ("pending", "in_progress", "completed"):
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid status"}), 400

    cursor.execute(
        "UPDATE tasks SET title=%s, description=%s, status=%s, assigned_to=%s WHERE id=%s",
        (title, description, status, assigned_to, task_id)
    )
    conn.commit()

    cursor.execute(TASK_JOIN + " WHERE t.id = %s", (task_id,))
    task = fetchone(cursor)
    cursor.close()
    conn.close()
    return jsonify(task), 200


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    conn   = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tasks WHERE id = %s", (task_id,))
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Task deleted"}), 200
