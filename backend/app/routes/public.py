"""Unauthenticated public portfolio endpoints."""
from flask import Blueprint, jsonify

from ..errors import ApiError
from ..models import StudentProfile, TemplateOption, User

public_bp = Blueprint("public", __name__, url_prefix="/api")


@public_bp.get("/portfolio/<student_id>")
def get_portfolio(student_id):
    profile = (
        StudentProfile.query.join(User)
        .filter(User.student_id == student_id, User.is_active.is_(True))
        .one_or_none()
    )
    if profile is None or not profile.is_published:
        raise ApiError("Portfolio not found", 404)
    return jsonify(profile.to_portfolio_dict())


@public_bp.get("/templates")
def list_templates():
    options = TemplateOption.query.filter_by(is_enabled=True).order_by(TemplateOption.key).all()
    return jsonify([option.to_dict() for option in options])
