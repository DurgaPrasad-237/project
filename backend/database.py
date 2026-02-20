import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ["DB_PORT"]),
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
}


def create_connection():
    """
    Railway-compatible MySQL connection.
    Required settings:
    - TLS enabled
    - pure python driver
    - timeout to avoid hanging forever
    """
    return mysql.connector.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],

        # 🔴 REQUIRED for Railway proxy
        ssl_disabled=False,
        use_pure=True,

        # 🔴 prevents infinite loading
        connection_timeout=5,

        autocommit=True
    )


def get_db():
    try:
        return create_connection()
    except Error as e:
        print("Database connection failed:", e)
        raise


def init_db():
    """
    Create tables if they don't exist.
    (Database already exists in Railway.)
    """
    try:
        conn = create_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('employer','employee') NOT NULL DEFAULT 'employee',
                employer_id INT DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE SET NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
                assigned_to INT DEFAULT NULL,
                created_by INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        cursor.close()
        conn.close()

        print("Tables verified/created successfully.")

    except Error as e:
        print("DB initialization error:", e)
        raise