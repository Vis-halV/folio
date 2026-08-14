"""CRUD for the repeating portfolio sections.

The four sections share an identical ownership model, so they are generated
from one table of field specs instead of four near-identical blueprints.
"""
from flask import Blueprint, jsonify, request

from ..errors import ApiError
from ..extensions import db
from ..models import Education, Experience, Project, Skill
from ..security import auth_required, owned_child, owned_profile

content_bp = Blueprint("content", __name__, url_prefix="/api")

INT_FIELDS = {"start_year", "end_year"}

SECTIONS = {
    "education": {
        "model": Education,
        "fields": ("institution", "degree", "start_year", "end_year"),
        "required": ("institution",),
        "deletable_only": False,
    },
    "skills": {
        "model": Skill,
        "fields": ("name",),
        "required": ("name",),
        "deletable_only": True,
    },
    "projects": {
        "model": Project,
        "fields": ("title", "description", "technologies", "github_url", "demo_url"),
        "required": ("title",),
        "deletable_only": False,
    },
    "experience": {
        "model": Experience,
        "fields": ("company", "role", "description", "duration"),
        "required": ("company",),
        "deletable_only": False,
    },
}


def _coerce(field, value):
    if field in INT_FIELDS:
        if value in (None, ""):
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            raise ApiError(f"{field} must be a number", 400) from None
    return value.strip() if isinstance(value, str) else value


def _apply(item, spec, payload, require=True):
    for field in spec["fields"]:
        if field in payload:
            setattr(item, field, _coerce(field, payload[field]))
    if require:
        for field in spec["required"]:
            if not getattr(item, field, None):
                raise ApiError(f"{field} is required", 400)


def _register_section(name, spec):
    model = spec["model"]

    def list_items():
        profile = owned_profile(create=True)
        db.session.commit()
        items = model.query.filter_by(student_id=profile.id).all()
        return jsonify([item.to_dict() for item in items])

    def create_item():
        profile = owned_profile(create=True)
        item = model(student_id=profile.id)
        _apply(item, spec, request.get_json(silent=True) or {})
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201

    def update_item(item_id):
        item = owned_child(model, item_id)
        _apply(item, spec, request.get_json(silent=True) or {})
        db.session.commit()
        return jsonify(item.to_dict())

    def delete_item(item_id):
        item = owned_child(model, item_id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({"deleted": item_id})

    content_bp.add_url_rule(
        f"/{name}", endpoint=f"list_{name}", view_func=auth_required(list_items), methods=["GET"]
    )
    content_bp.add_url_rule(
        f"/{name}",
        endpoint=f"create_{name}",
        view_func=auth_required(create_item),
        methods=["POST"],
    )
    if not spec["deletable_only"]:
        content_bp.add_url_rule(
            f"/{name}/<int:item_id>",
            endpoint=f"update_{name}",
            view_func=auth_required(update_item),
            methods=["PUT"],
        )
    content_bp.add_url_rule(
        f"/{name}/<int:item_id>",
        endpoint=f"delete_{name}",
        view_func=auth_required(delete_item),
        methods=["DELETE"],
    )


for _name, _spec in SECTIONS.items():
    _register_section(_name, _spec)
