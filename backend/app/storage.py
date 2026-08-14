"""File storage: local disk by default, S3-compatible when configured."""
import os
import uuid

from flask import current_app, url_for
from werkzeug.utils import secure_filename

from .errors import ApiError

IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
DOC_EXTENSIONS = {"pdf", "doc", "docx"}


def _extension(filename):
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _s3_enabled():
    cfg = current_app.config
    return bool(cfg.get("S3_BUCKET_NAME") and cfg.get("S3_ACCESS_KEY") and cfg.get("S3_SECRET_KEY"))


def _s3_client():
    import boto3

    cfg = current_app.config
    return boto3.client(
        "s3",
        aws_access_key_id=cfg["S3_ACCESS_KEY"],
        aws_secret_access_key=cfg["S3_SECRET_KEY"],
        region_name=cfg.get("S3_REGION"),
        endpoint_url=cfg.get("S3_ENDPOINT_URL"),
    )


def save_upload(file_storage, allowed_extensions, prefix):
    if file_storage is None or not file_storage.filename:
        raise ApiError("No file provided", 400)

    extension = _extension(file_storage.filename)
    if extension not in allowed_extensions:
        raise ApiError(
            f"Unsupported file type '.{extension}'",
            400,
            {"allowed": sorted(allowed_extensions)},
        )

    key = f"{prefix}/{uuid.uuid4().hex}.{extension}"

    if _s3_enabled():
        client = _s3_client()
        bucket = current_app.config["S3_BUCKET_NAME"]
        client.upload_fileobj(
            file_storage,
            bucket,
            key,
            ExtraArgs={"ContentType": file_storage.mimetype or "application/octet-stream"},
        )
        endpoint = current_app.config.get("S3_ENDPOINT_URL")
        if endpoint:
            return f"{endpoint.rstrip('/')}/{bucket}/{key}"
        region = current_app.config.get("S3_REGION")
        host = f"s3.{region}.amazonaws.com" if region else "s3.amazonaws.com"
        return f"https://{bucket}.{host}/{key}"

    upload_root = current_app.config["UPLOAD_FOLDER"]
    destination = os.path.join(upload_root, secure_filename(prefix), os.path.basename(key))
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    file_storage.save(destination)
    return url_for("uploads.serve_upload", subpath=f"{prefix}/{os.path.basename(key)}")
