"""Student profile routes. Auth + ownership enforced on every handler."""
from flask import Blueprint, jsonify, request

from ..errors import ApiError
from ..extensions import db
from ..models import TemplateOption
from ..security import auth_required, owned_profile
from ..storage import DOC_EXTENSIONS, IMAGE_EXTENSIONS, save_upload

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

EDITABLE_FIELDS = (
    "name",
    "bio",
    "college",
    "degree",
    "github_url",
    "linkedin_url",
)


def _allowed_template_keys():
    keys = [
        option.key
        for option in TemplateOption.query.filter_by(is_enabled=True).all()
    ]
    return keys or None


@profile_bp.get("")
@auth_required
def get_profile():
    profile = owned_profile(create=True)
    db.session.commit()
    return jsonify(profile.to_portfolio_dict())


@profile_bp.put("")
@auth_required
def update_profile():
    profile = owned_profile(create=True)
    payload = request.get_json(silent=True) or {}

    for field in EDITABLE_FIELDS:
        if field in payload:
            value = payload[field]
            setattr(profile, field, value.strip() if isinstance(value, str) else value)

    if "graduation_year" in payload:
        profile.graduation_year = _parse_year(payload["graduation_year"])

    if payload.get("template"):
        allowed = _allowed_template_keys()
        if allowed is not None and payload["template"] not in allowed:
            raise ApiError("Unknown template", 400, {"allowed": allowed})
        profile.template = payload["template"]

    db.session.commit()
    return jsonify(profile.to_portfolio_dict())


@profile_bp.post("/publish")
@auth_required
def set_publish_state():
    profile = owned_profile(create=True)
    payload = request.get_json(silent=True) or {}
    if "is_published" in payload:
        profile.is_published = bool(payload["is_published"])
    else:
        profile.is_published = not profile.is_published
    db.session.commit()
    return jsonify({"is_published": profile.is_published})


@profile_bp.post("/photo")
@auth_required
def upload_photo():
    profile = owned_profile(create=True)
    profile.profile_photo = save_upload(
        request.files.get("file"), IMAGE_EXTENSIONS, "photos"
    )
    db.session.commit()
    return jsonify({"profile_photo": profile.profile_photo})


@profile_bp.post("/resume")
@auth_required
def upload_resume():
    profile = owned_profile(create=True)
    profile.resume_url = save_upload(request.files.get("file"), DOC_EXTENSIONS, "resumes")
    db.session.commit()
    return jsonify({"resume_url": profile.resume_url})


def _parse_year(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError("graduation_year must be a number", 400) from None
