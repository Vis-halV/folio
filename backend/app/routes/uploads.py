"""Serving of locally stored uploads (used when S3 is not configured)."""
from flask import Blueprint, current_app, send_from_directory

uploads_bp = Blueprint("uploads", __name__, url_prefix="/uploads")


@uploads_bp.get("/<path:subpath>")
def serve_upload(subpath):
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], subpath)
