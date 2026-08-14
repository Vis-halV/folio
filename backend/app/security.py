"""Server-side access control helpers.

Every protected route goes through these helpers: the JWT is validated, the
user is re-loaded from the database (so revoked/disabled accounts lose access
immediately) and ownership of the addressed resource is verified.
"""
from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from .errors import ApiError
from .models import ROLE_ADMIN, StudentProfile, User


def load_current_user():
    verify_jwt_in_request()
    user = User.query.get(get_jwt_identity())
    if user is None:
        raise ApiError("Account no longer exists", 401)
    if not user.is_active:
        raise ApiError("Account is disabled", 403)
    if not user.is_approved and not user.is_admin:
        raise ApiError("Account is not approved", 403)
    g.current_user = user
    return user


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        load_current_user()
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = load_current_user()
        if not user.is_admin:
            raise ApiError("Admin privileges required", 403)
        return fn(*args, **kwargs)

    return wrapper


def current_user():
    user = getattr(g, "current_user", None)
    if user is None:
        user = load_current_user()
    return user


def owned_profile(profile_id=None, create=False):
    """Return the profile the caller is allowed to act on.

    Students may only reach their own profile; admins may reach any profile.
    Raises 403 for cross-account access and 404 when the profile is absent.
    """
    user = current_user()
    if profile_id is None:
        profile = StudentProfile.query.filter_by(user_id=user.id).one_or_none()
        if profile is None and create:
            profile = StudentProfile(user_id=user.id)
            from .extensions import db

            db.session.add(profile)
            db.session.flush()
        if profile is None:
            raise ApiError("Profile not found", 404)
        return profile

    profile = StudentProfile.query.get(profile_id)
    if profile is None:
        raise ApiError("Profile not found", 404)
    if profile.user_id != user.id and user.role != ROLE_ADMIN:
        raise ApiError("Forbidden", 403)
    return profile


def owned_child(model, item_id):
    """Fetch a profile-owned row (education/skill/project/experience) safely."""
    item = model.query.get(item_id)
    if item is None:
        raise ApiError("Resource not found", 404)
    owned_profile(item.student_id)
    return item
