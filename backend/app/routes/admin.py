"""Admin-only routes: whitelist management, profile oversight, templates."""
import secrets

from flask import Blueprint, jsonify, request

from ..errors import ApiError
from ..extensions import db
from ..models import (
    DEFAULT_TEMPLATE,
    ROLE_STUDENT,
    ApprovedStudent,
    StudentProfile,
    TemplateOption,
    User,
)
from ..security import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.get("/students")
@admin_required
def list_students():
    students = (
        User.query.filter_by(role=ROLE_STUDENT).order_by(User.created_at.desc()).all()
    )
    result = []
    for user in students:
        entry = user.to_dict()
        entry["profile"] = user.profile.to_dict() if user.profile else None
        result.append(entry)
    return jsonify(result)


@admin_bp.post("/students")
@admin_required
def create_student():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    student_id = (payload.get("student_id") or "").strip()
    name = (payload.get("name") or "").strip()
    password = payload.get("password") or secrets.token_urlsafe(9)

    if not email or not student_id:
        raise ApiError("email and student_id are required", 400)
    if User.query.filter_by(email=email).first():
        raise ApiError("A user with that email already exists", 409)
    if User.query.filter_by(student_id=student_id).first():
        raise ApiError("A user with that student id already exists", 409)

    user = User(
        email=email,
        student_id=student_id,
        role=ROLE_STUDENT,
        is_approved=bool(payload.get("is_approved", True)),
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    db.session.add(
        StudentProfile(user_id=user.id, name=name or None, template=DEFAULT_TEMPLATE)
    )

    if not ApprovedStudent.query.filter_by(student_id=student_id).first():
        db.session.add(ApprovedStudent(student_id=student_id, email=email, name=name or None))

    db.session.commit()

    response = user.to_dict()
    # The generated password is returned once so the admin can hand it over.
    if not payload.get("password"):
        response["initial_password"] = password
    return jsonify(response), 201


@admin_bp.patch("/students/<int:user_id>")
@admin_required
def update_student(user_id):
    user = _get_student(user_id)
    payload = request.get_json(silent=True) or {}
    if "is_approved" in payload:
        user.is_approved = bool(payload["is_approved"])
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    if payload.get("password"):
        user.set_password(payload["password"])
    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.delete("/students/<int:user_id>")
@admin_required
def delete_student(user_id):
    user = _get_student(user_id)
    ApprovedStudent.query.filter_by(student_id=user.student_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"deleted": user_id})


@admin_bp.get("/profiles")
@admin_required
def list_profiles():
    profiles = StudentProfile.query.join(User).order_by(User.student_id).all()
    return jsonify([profile.to_portfolio_dict() for profile in profiles])


@admin_bp.get("/profiles/<int:profile_id>")
@admin_required
def get_profile(profile_id):
    profile = StudentProfile.query.get(profile_id)
    if profile is None:
        raise ApiError("Profile not found", 404)
    return jsonify(profile.to_portfolio_dict())


@admin_bp.get("/templates")
@admin_required
def list_templates():
    options = TemplateOption.query.order_by(TemplateOption.key).all()
    return jsonify([option.to_dict() for option in options])


@admin_bp.post("/templates")
@admin_required
def create_template():
    payload = request.get_json(silent=True) or {}
    key = (payload.get("key") or "").strip()
    label = (payload.get("label") or "").strip()
    if not key or not label:
        raise ApiError("key and label are required", 400)
    if TemplateOption.query.filter_by(key=key).first():
        raise ApiError("Template key already exists", 409)
    option = TemplateOption(
        key=key,
        label=label,
        description=(payload.get("description") or "").strip() or None,
        is_enabled=bool(payload.get("is_enabled", True)),
    )
    db.session.add(option)
    db.session.commit()
    return jsonify(option.to_dict()), 201


@admin_bp.patch("/templates/<int:template_id>")
@admin_required
def update_template(template_id):
    option = TemplateOption.query.get(template_id)
    if option is None:
        raise ApiError("Template not found", 404)
    payload = request.get_json(silent=True) or {}
    if "label" in payload:
        option.label = payload["label"]
    if "description" in payload:
        option.description = payload["description"]
    if "is_enabled" in payload:
        option.is_enabled = bool(payload["is_enabled"])
    db.session.commit()
    return jsonify(option.to_dict())


def _get_student(user_id):
    user = User.query.get(user_id)
    if user is None or user.role != ROLE_STUDENT:
        raise ApiError("Student not found", 404)
    return user
