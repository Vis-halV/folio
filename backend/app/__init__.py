"""Application factory for the Digital Portfolio Builder API."""
import os
from datetime import timedelta

from flask import Flask, jsonify, send_from_directory

from .config import Config
from .errors import register_error_handlers
from .extensions import cors, db, jwt, migrate

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend", "build")


def create_app(config_object=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_object)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
        hours=app.config["JWT_ACCESS_TOKEN_EXPIRES_HOURS"]
    )

    if not app.config["SECRET_KEY"]:
        if app.config["ENV"] == "production":
            raise RuntimeError("SECRET_KEY must be set in production")
        app.config["SECRET_KEY"] = "dev-only-secret"
    if not app.config["JWT_SECRET_KEY"]:
        if app.config["ENV"] == "production":
            raise RuntimeError("JWT_SECRET_KEY must be set in production")
        app.config["JWT_SECRET_KEY"] = app.config["SECRET_KEY"]

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db, directory=os.path.join(BASE_DIR, "migrations"))
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": [app.config["FRONTEND_ORIGIN"]]}},
        supports_credentials=True,
    )

    from . import models  # noqa: F401  (ensure models are registered with SQLAlchemy)
    from .cli import register_cli
    from .routes import register_blueprints

    register_blueprints(app)
    register_error_handlers(app)
    register_cli(app)
    _register_jwt_handlers()
    _register_frontend(app)

    if app.config["ENV"] == "production":
        _register_https_enforcement(app)

    return app


def _register_jwt_handlers():
    from .routes.auth import REVOKED_TOKENS

    @jwt.token_in_blocklist_loader
    def _is_revoked(header, payload):
        return payload["jti"] in REVOKED_TOKENS

    @jwt.revoked_token_loader
    def _revoked_token(header, payload):
        return jsonify({"error": "Token has been revoked"}), 401

    @jwt.unauthorized_loader
    def _missing_token(reason):
        return jsonify({"error": "Authorization token required"}), 401

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({"error": "Invalid authorization token"}), 401

    @jwt.expired_token_loader
    def _expired_token(header, payload):
        return jsonify({"error": "Token has expired"}), 401


def _register_https_enforcement(app):
    @app.before_request
    def _require_https():
        from flask import redirect, request

        forwarded_proto = request.headers.get("X-Forwarded-Proto", "https")
        if forwarded_proto != "https":
            return redirect(request.url.replace("http://", "https://", 1), code=301)
        return None

    @app.after_request
    def _security_headers(response):
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        return response


def _register_frontend(app):
    """Serve the compiled React bundle (deployment option A: single dyno)."""

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": "Not found"}), 404
        if path and os.path.isfile(os.path.join(FRONTEND_BUILD_DIR, path)):
            return send_from_directory(FRONTEND_BUILD_DIR, path)
        index_path = os.path.join(FRONTEND_BUILD_DIR, "index.html")
        if os.path.isfile(index_path):
            return send_from_directory(FRONTEND_BUILD_DIR, "index.html")
        return (
            jsonify(
                {
                    "error": "Frontend bundle not built",
                    "hint": "Run `npm --prefix frontend run build`",
                }
            ),
            404,
        )
