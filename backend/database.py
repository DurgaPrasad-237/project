import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

# Load .env only for local development (Render ignores this)
load_dotenv()

# Require environment variables (fail fast if missing)
DB_CONFIG = {
    "host": os.environ["DB_HOST"],
    "port": int(os.environ.get("DB_PORT", 3306)),
    "user": os.environ["DB_USER"],
    "password": os.environ["DB_PASSWORD"],
    "database": os.environ["DB_NAME"],
}


def get_db():
    """
    Return a new MySQL connection.
    Each request should create its own connection.
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print("Database connection failed:", e)
        raise


def init_db():
    """
    Create tables if they don't exist.
    NOTE:
    - DOES NOT create database (cloud providers forbid it)
    - Assumes DB already exists.
    """
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # USERS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(150) NOT NULL,
                email       VARCHAR(255) UNIQUE NOT NULL,
                password    VARCHAR(255) NOT NULL,
                role        ENUM('employer','employee') NOT NULL DEFAULT 'employee',
                employer_id INT DEFAULT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE SET NULL
            )
        """)

        # TASKS TABLE
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                title       VARCHAR(255) NOT NULL,
                description TEXT,
                status      ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
                assigned_to INT DEFAULT NULL,
                created_by  INT NOT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            )
        """)

        conn.commit()
        cursor.close()
        conn.close()

        print("Tables verified/created successfully.")

    except Error as e:
        print("DB initialization error:", e)
        raise