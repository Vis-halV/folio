"""Application configuration loaded exclusively from environment variables."""
import os
from typing import Any, ClassVar

from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Loaded here rather than in the factory: `Config` reads the environment while
# this module is imported, which happens before `create_app` can run.
load_dotenv(os.path.join(BACKEND_DIR, ".env"))


def _normalize_database_url(url):
    """Heroku hands out `postgres://` URLs which SQLAlchemy 2.x rejects."""
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _resolve_upload_folder(value):
    """Relative paths resolve against `backend/`, never the process CWD.

    Flask resolves relative directories passed to `send_from_directory` against
    the app root (`backend/app`), while writes happen relative to the CWD, so a
    relative value would write and read from two different places.
    """
    return os.path.abspath(os.path.join(BACKEND_DIR, value))


class Config:
    ENV = os.environ.get("FLASK_ENV", "production")
    SECRET_KEY = os.environ.get("SECRET_KEY", "")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")

    SQLALCHEMY_DATABASE_URI = _normalize_database_url(
        os.environ.get("DATABASE_URL", "sqlite:///portfolio.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS: ClassVar[dict[str, Any]] = {"pool_pre_ping": True}

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(
        os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "12")
    )

    UPLOAD_FOLDER = _resolve_upload_folder(os.environ.get("UPLOAD_FOLDER", "uploads"))
    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH_MB", "10")) * 1024 * 1024

    S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
    S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY")
    S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY")
    S3_REGION = os.environ.get("S3_REGION")
    S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL")

    PREFERRED_URL_SCHEME = "https"

    @property
    def is_production(self):
        return self.ENV == "production"
