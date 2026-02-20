import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from database import init_db
from routes.auth import auth_bp
from routes.users import users_bp
from routes.tasks import tasks_bp

load_dotenv()

app = Flask(__name__)

APP_ENV = os.getenv("APP_ENV", "development")
IS_PROD = APP_ENV == "production"

# JWT Config
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900        # 15 minutes
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 604800    # 7 days

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

app.config["JWT_COOKIE_SECURE"] = IS_PROD
app.config["JWT_COOKIE_SAMESITE"] = "None" if IS_PROD else "Lax"

jwt = JWTManager(app)

# CORS (must allow credentials + both localhost styles)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

CORS(app,
     supports_credentials=True,
     origins=[FRONTEND_URL])

# Routes
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(users_bp, url_prefix="/api/users")
app.register_blueprint(tasks_bp, url_prefix="/api/tasks")

init_db()
if __name__ == "__main__":
   
    app.run(debug=True, port=5000)
