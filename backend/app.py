import os
from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from database import init_db
from routes.auth import auth_bp
from routes.users import users_bp
from routes.tasks import tasks_bp

load_dotenv()

# Path to React build folder (adjust if your folder structure is different)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=FRONTEND_DIST, static_url_path='')

# Detect environment
APP_ENV = os.getenv("APP_ENV", "development")
IS_PROD = APP_ENV == "production"

# JWT Config
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900        # 15 minutes
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 604800    # 7 days

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

app.config["JWT_COOKIE_SECURE"] = IS_PROD
app.config["JWT_COOKIE_SAMESITE"] = "Lax"  # Lax is fine now — same origin

jwt = JWTManager(app)

# CORS only needed for local dev now (same origin in prod)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {
            "origins": [FRONTEND_URL]
        }
    }
)

# API Routes
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(tasks_bp, url_prefix="/api/tasks")

# Serve React for all non-API routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # Serve actual files (js, css, images, etc.)
    full_path = os.path.join(FRONTEND_DIST, path)
    if path and os.path.exists(full_path):
        return send_from_directory(FRONTEND_DIST, path)
    # Everything else → index.html (React Router handles it)
    return send_from_directory(FRONTEND_DIST, 'index.html')

init_db()

if __name__ == "__main__":
    app.run(debug=True, port=8000)