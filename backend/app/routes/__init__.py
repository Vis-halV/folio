"""Blueprint registration."""
from .admin import admin_bp
from .auth import auth_bp
from .content import content_bp
from .health import health_bp
from .profile import profile_bp
from .public import public_bp
from .uploads import uploads_bp


def register_blueprints(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(content_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(uploads_bp)
