# Digital Portfolio Builder for Students

A whitelist-only portfolio platform: an administrator issues and approves student
accounts, each student fills in structured records (profile, education, skills,
projects, experience), picks one of three portfolio templates and publishes a
public, shareable page.

- `backend/` — Flask REST API (SQLAlchemy, Flask-Migrate, JWT auth, PostgreSQL)
- `frontend/` — React app (React Router), also the source of the production bundle
  that Flask serves in the single-deployment setup

There is **no self-registration**. Every access rule is enforced server-side; the
UI gating is convenience only.

## Design system

Utilitarian / industrial: grid layouts, dense information, rectangular uppercase
controls, bordered panels with header label plates, spec-sheet data rows,
monospace values and labelled status tags. Tokens live at the top of
`frontend/src/index.css`; the accent colour (`--color-accent`) is reserved for
actions and alerts.

## Local setup

### 1. PostgreSQL

```bash
createdb portfolio
createuser portfolio --pwprompt   # or use an existing role
# or, with Docker:
docker run -d --name folio-pg -p 5432:5432 \
  -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio \
  postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env            # then fill in SECRET_KEY, JWT_SECRET_KEY, DATABASE_URL
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

export FLASK_APP=wsgi.py
flask db upgrade                # apply migrations
flask seed-templates            # register the three bundled templates
flask create-admin              # bootstrap admin from ADMIN_EMAIL / ADMIN_PASSWORD
flask run --port 5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env            # REACT_APP_API_BASE_URL=http://localhost:5000
npm install
npm start                       # dev server on http://localhost:3000
```

For development the API must allow the dev server origin — set
`FRONTEND_ORIGIN=http://localhost:3000` in `backend/.env`.

### 4. First admin and first student

`flask create-admin` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the environment
(or `--email` / `--password` options) and creates or updates the ADMIN account.
Log in at `/login`, open the admin dashboard and add a student with
`POST /api/admin/students`; the response returns a generated initial password when
none was supplied. Bulk pre-approval from a registrar CSV
(`student_id,email,name`) is available via:

```bash
flask import-approved-students students.csv --password TemporaryPass1
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `FLASK_ENV` | `development` or `production`; production enforces HTTPS and requires secrets |
| `SECRET_KEY` | Flask session/signing secret |
| `JWT_SECRET_KEY` | Signing key for access tokens |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | Token lifetime (default 12) |
| `DATABASE_URL` | PostgreSQL URL; `postgres://` is normalised to `postgresql://` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for `/api/*` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Consumed by `flask create-admin` |
| `UPLOAD_FOLDER`, `MAX_CONTENT_LENGTH_MB` | Local upload directory (relative paths resolve against `backend/`) and size cap |
| `S3_BUCKET_NAME`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`, `S3_ENDPOINT_URL` | Optional S3-compatible storage; when set, uploads go to S3 instead of disk |

### Frontend (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `REACT_APP_API_BASE_URL` | API origin **without** the `/api` prefix (the client appends it); also used to resolve uploaded photo/resume URLs. Leave empty for the single-deployment setup |

Secrets are never hardcoded and real `.env` files are gitignored.

## API surface

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | public (approved + active accounts only) |
| POST | `/api/auth/logout` | authenticated (revokes the token id) |
| GET | `/api/auth/me` | authenticated |
| GET/PUT | `/api/profile` | owner |
| POST | `/api/profile/photo`, `/api/profile/resume` | owner |
| POST | `/api/profile/publish` | owner |
| GET/POST | `/api/education`, `/api/skills`, `/api/projects`, `/api/experience` | owner |
| PUT/DELETE | `/api/<section>/:id` | owner or admin (skills: delete only) |
| GET | `/api/portfolio/:student_id` | public, published profiles only (404 otherwise) |
| GET | `/api/templates` | public (enabled templates) |
| GET/POST | `/api/admin/students` | admin |
| PATCH/DELETE | `/api/admin/students/:id` | admin (approve / disable / remove) |
| GET | `/api/admin/profiles`, `/api/admin/profiles/:id` | admin |
| GET/POST | `/api/admin/templates`, PATCH `/api/admin/templates/:id` | admin |

Every protected handler runs through `backend/app/security.py`, which re-loads the
user from the database (so revoked or disabled accounts lose access immediately)
and verifies that the addressed row belongs to the caller, or that the caller is
an ADMIN — otherwise `403`.

## Templates

| Key | Label | Layout |
| --- | --- | --- |
| `template-01` | SPEC SHEET | Side rail of hard facts plus a records column |
| `template-02` | DOSSIER | Single column with numbered section plates |
| `template-03` | TERMINAL | Inverted monospace ledger with tabular rows |

All three render the same portfolio payload, are responsive, and expose the
GitHub / LinkedIn links and the resume download. Administrators can enable or
disable templates in the catalogue; students only see enabled ones.

Public URL shape: `https://<host>/<student_id>` (an optional
`/<college_slug>/<student_id>` form resolves to the same page).

## Deployment (Heroku, single dyno)

Flask serves the compiled React bundle from `frontend/build`, so one app hosts
both the API and the UI.

```bash
heroku create my-portfolio-app
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python
heroku addons:create heroku-postgresql:essential-0

heroku config:set \
  FLASK_ENV=production \
  SECRET_KEY="$(openssl rand -hex 32)" \
  JWT_SECRET_KEY="$(openssl rand -hex 32)" \
  FRONTEND_ORIGIN="https://my-portfolio-app.herokuapp.com" \
  ADMIN_EMAIL="admin@example.edu" ADMIN_PASSWORD="<strong-password>"

git push heroku main
heroku run "cd backend && flask seed-templates && flask create-admin"
```

- `Procfile` runs `gunicorn --chdir backend wsgi:app` for web and
  `flask db upgrade` in the `release` phase, so migrations apply on every deploy.
- The root `package.json` `heroku-postbuild` script makes the Node buildpack build
  `frontend/`, producing `frontend/build`; the root `requirements.txt` re-exports
  `backend/requirements.txt` for the Python buildpack.
- With `FLASK_ENV=production` the app redirects plain HTTP to HTTPS and sends
  HSTS plus `nosniff` / `SAMEORIGIN` headers. Heroku terminates TLS, so no
  certificate handling is required.
- Local disk is ephemeral on Heroku: set the `S3_*` variables so uploaded photos
  and resumes survive restarts.

## Checks

```bash
cd backend && .venv/bin/ruff check .        # backend lint
cd frontend && CI=true npm run build        # frontend lint + production build
```
