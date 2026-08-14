"""SQLAlchemy models for the digital portfolio builder."""
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

ROLE_ADMIN = "ADMIN"
ROLE_STUDENT = "STUDENT"

TEMPLATES = ("template-01", "template-02", "template-03")
DEFAULT_TEMPLATE = TEMPLATES[0]


def _utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    student_id = db.Column(db.String(64), unique=True, nullable=True, index=True)
    role = db.Column(db.String(16), nullable=False, default=ROLE_STUDENT)
    is_approved = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    profile = db.relationship(
        "StudentProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def is_admin(self):
        return self.role == ROLE_ADMIN

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "student_id": self.student_id,
            "role": self.role,
            "is_approved": self.is_approved,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    name = db.Column(db.String(255))
    bio = db.Column(db.Text)
    college = db.Column(db.String(255))
    degree = db.Column(db.String(255))
    graduation_year = db.Column(db.Integer)
    profile_photo = db.Column(db.String(512))
    resume_url = db.Column(db.String(512))
    github_url = db.Column(db.String(512))
    linkedin_url = db.Column(db.String(512))
    template = db.Column(db.String(64), nullable=False, default=DEFAULT_TEMPLATE)
    is_published = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow
    )

    user = db.relationship("User", back_populates="profile")
    education = db.relationship(
        "Education", back_populates="profile", cascade="all, delete-orphan",
        order_by="Education.start_year.desc()",
    )
    skills = db.relationship(
        "Skill", back_populates="profile", cascade="all, delete-orphan", order_by="Skill.name"
    )
    projects = db.relationship(
        "Project", back_populates="profile", cascade="all, delete-orphan", order_by="Project.id"
    )
    experience = db.relationship(
        "Experience", back_populates="profile", cascade="all, delete-orphan",
        order_by="Experience.id",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "student_id": self.user.student_id if self.user else None,
            "email": self.user.email if self.user else None,
            "name": self.name,
            "bio": self.bio,
            "college": self.college,
            "degree": self.degree,
            "graduation_year": self.graduation_year,
            "profile_photo": self.profile_photo,
            "resume_url": self.resume_url,
            "github_url": self.github_url,
            "linkedin_url": self.linkedin_url,
            "template": self.template,
            "is_published": self.is_published,
        }

    def to_portfolio_dict(self):
        data = self.to_dict()
        data["education"] = [e.to_dict() for e in self.education]
        data["skills"] = [s.to_dict() for s in self.skills]
        data["projects"] = [p.to_dict() for p in self.projects]
        data["experience"] = [x.to_dict() for x in self.experience]
        return data


class Education(db.Model):
    __tablename__ = "education"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    institution = db.Column(db.String(255), nullable=False)
    degree = db.Column(db.String(255))
    start_year = db.Column(db.Integer)
    end_year = db.Column(db.Integer)

    profile = db.relationship("StudentProfile", back_populates="education")

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "institution": self.institution,
            "degree": self.degree,
            "start_year": self.start_year,
            "end_year": self.end_year,
        }


class Skill(db.Model):
    __tablename__ = "skills"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(120), nullable=False)

    profile = db.relationship("StudentProfile", back_populates="skills")

    def to_dict(self):
        return {"id": self.id, "student_id": self.student_id, "name": self.name}


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    technologies = db.Column(db.String(512))
    github_url = db.Column(db.String(512))
    demo_url = db.Column(db.String(512))

    profile = db.relationship("StudentProfile", back_populates="projects")

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "title": self.title,
            "description": self.description,
            "technologies": self.technologies,
            "github_url": self.github_url,
            "demo_url": self.demo_url,
        }


class Experience(db.Model):
    __tablename__ = "experience"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer,
        db.ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    company = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255))
    description = db.Column(db.Text)
    duration = db.Column(db.String(120))

    profile = db.relationship("StudentProfile", back_populates="experience")

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "company": self.company,
            "role": self.role,
            "description": self.description,
            "duration": self.duration,
        }


class ApprovedStudent(db.Model):
    """Pre-approval whitelist entries, e.g. imported from a registrar CSV."""

    __tablename__ = "approved_students"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "email": self.email,
            "name": self.name,
        }


class TemplateOption(db.Model):
    """Admin-managed catalogue of portfolio templates students may select."""

    __tablename__ = "template_options"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), unique=True, nullable=False)
    label = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(512))
    is_enabled = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "label": self.label,
            "description": self.description,
            "is_enabled": self.is_enabled,
        }
