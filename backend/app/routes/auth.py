"""Authentication. Accounts are created by admins only - no self-registration."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt, jwt_required

from ..errors import ApiError
from ..models import User
from ..security import auth_required, current_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# In-process blocklist of revoked JWT ids. A shared store (e.g. Redis) is
# required when running more than one worker.
REVOKED_TOKENS = set()


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    if not email or not password:
        raise ApiError("Email and password are required", 400)

    user = User.query.filter_by(email=email).one_or_none()
    if user is None or not user.check_password(password):
        raise ApiError("Invalid credentials", 401)
    if not user.is_active:
        raise ApiError("Account has been disabled by an administrator", 403)
    if not user.is_approved:
        raise ApiError("Account is pending administrator approval", 403)

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "student_id": user.student_id},
    )
    return jsonify({"access_token": token, "user": user.to_dict()})


@auth_bp.post("/logout")
@jwt_required()
def logout():
    REVOKED_TOKENS.add(get_jwt()["jti"])
    return jsonify({"message": "Logged out"})


@auth_bp.get("/me")
@auth_required
def me():
    user = current_user()
    profile = user.profile
    return jsonify({"user": user.to_dict(), "profile": profile.to_dict() if profile else None})
