"""Flask CLI commands for bootstrapping the deployment."""
import csv
import os

import click
from flask.cli import with_appcontext

from .extensions import db
from .models import (
    DEFAULT_TEMPLATE,
    ROLE_ADMIN,
    ROLE_STUDENT,
    ApprovedStudent,
    StudentProfile,
    TemplateOption,
    User,
)

SEED_TEMPLATES = [
    ("template-01", "SPEC SHEET", "Dense two-column data sheet with side rail index."),
    ("template-02", "DOSSIER", "Stacked dossier layout with numbered section plates."),
    ("template-03", "TERMINAL", "Monospace terminal-style ledger with tabular rows."),
]


def register_cli(app):
    app.cli.add_command(create_admin)
    app.cli.add_command(seed_templates)
    app.cli.add_command(import_approved_students)


@click.command("create-admin")
@click.option("--email", default=None, help="Overrides ADMIN_EMAIL.")
@click.option("--password", default=None, help="Overrides ADMIN_PASSWORD.")
@with_appcontext
def create_admin(email, password):
    """Create (or update) the bootstrap ADMIN account from the environment."""
    email = email or os.environ.get("ADMIN_EMAIL")
    password = password or os.environ.get("ADMIN_PASSWORD")
    if not email or not password:
        raise click.ClickException(
            "ADMIN_EMAIL and ADMIN_PASSWORD must be set (or passed as options)."
        )

    user = User.query.filter_by(email=email.lower()).one_or_none()
    if user is None:
        user = User(email=email.lower(), role=ROLE_ADMIN)
        db.session.add(user)
    user.role = ROLE_ADMIN
    user.is_approved = True
    user.is_active = True
    user.set_password(password)
    db.session.commit()
    click.echo(f"Admin ready: {user.email}")


@click.command("seed-templates")
@with_appcontext
def seed_templates():
    """Populate the admin-managed template catalogue."""
    for key, label, description in SEED_TEMPLATES:
        option = TemplateOption.query.filter_by(key=key).one_or_none()
        if option is None:
            option = TemplateOption(key=key)
            db.session.add(option)
        option.label = label
        option.description = description
        if option.is_enabled is None:
            option.is_enabled = True
    db.session.commit()
    click.echo(f"Seeded {len(SEED_TEMPLATES)} templates.")


@click.command("import-approved-students")
@click.argument("csv_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--password", default=None, help="Initial password for created accounts.")
@with_appcontext
def import_approved_students(csv_path, password):
    """Whitelist students from a CSV with student_id,email,name columns."""
    created_accounts = 0
    created_entries = 0
    with open(csv_path, newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            student_id = (row.get("student_id") or "").strip()
            email = (row.get("email") or "").strip().lower()
            name = (row.get("name") or "").strip()
            if not student_id or not email:
                continue

            entry = ApprovedStudent.query.filter_by(student_id=student_id).one_or_none()
            if entry is None:
                db.session.add(
                    ApprovedStudent(student_id=student_id, email=email, name=name)
                )
                created_entries += 1

            if password:
                user = User.query.filter_by(email=email).one_or_none()
                if user is None:
                    user = User(
                        email=email,
                        student_id=student_id,
                        role=ROLE_STUDENT,
                        is_approved=True,
                    )
                    user.set_password(password)
                    db.session.add(user)
                    db.session.flush()
                    db.session.add(
                        StudentProfile(
                            user_id=user.id, name=name, template=DEFAULT_TEMPLATE
                        )
                    )
                    created_accounts += 1
    db.session.commit()
    click.echo(
        f"Whitelisted {created_entries} students, created {created_accounts} accounts."
    )
