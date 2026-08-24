# PharmaPanda

Interactive patient-consultation simulations for pharmacy students.

The repository holds two independently-run applications:

| Path       | Stack                                  | Dev port |
| ---------- | -------------------------------------- | -------- |
| `src/`     | React 18 · TypeScript · Vite · Tailwind | `5173`   |
| `backend/` | FastAPI · SQLAlchemy 2 · PostgreSQL 16  | `8000`   |

Authentication, the scenario catalogue, consultations and their reports all run
against the backend and PostgreSQL. The deterministic patient and evaluation
engines run server-side, so a student's progress follows their account rather
than the browser.

---

## Development setup

### 1. Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker Desktop (for PostgreSQL)

### 2. Frontend install

```bash
npm install
```

### 3. Python virtual environment

```bash
cd backend
python -m venv .venv
```

Activate it:

```bash
.venv\Scripts\activate       # Windows (PowerShell / cmd)
source .venv/bin/activate    # macOS / Linux
```

### 4. Backend dependencies

```bash
pip install -r requirements.txt
```

### 5. Environment files

Copy both templates. Neither `.env` is tracked by Git.

```bash
cp .env.example .env                 # repository root — frontend
cp backend/.env.example backend/.env # backend
```

The defaults work as-is for local development.

### 6. Start PostgreSQL

From the repository root:

```bash
docker compose up -d --wait db
```

`--wait` blocks until the container reports healthy. The database listens on
`127.0.0.1:5432` and its data persists in the `pharmapanda_pgdata` volume.

```bash
docker compose ps        # check status
docker compose stop db   # stop, keep data
docker compose down -v   # stop and delete data
```

### 7. Run migrations

```bash
cd backend
alembic upgrade head
```

This creates the `users`, `scenarios`, `patients`, `patient_facts`, `attempts`
and `evaluations` tables. To add further tables later:

```bash
alembic revision --autogenerate -m "add users table"
alembic upgrade head
```

Autogenerate only sees a model after its module is imported in
`backend/app/db/base_all.py`.

Generate a real JWT signing key for `backend/.env` (the template ships a
placeholder, and staging/production refuse to start with it):

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 7b. Load the scenario catalogue (required)

```bash
cd backend
python -m scripts.seed_catalogue
```

Loads the ten scenarios, their patients and 97 disclosable facts. Idempotent —
existing rows are updated in place, so it is safe to re-run after content
changes. **The app has no cases until this is run.**

### 7c. Seed the development demo account (optional)

```bash
cd backend
python -m scripts.seed_demo_user
```

Creates `demo@pharmapanda.app` as a real PostgreSQL row using the same hashing
path as normal registration. The password is development-only and printed by the
script; the login screen offers a button to fill it in. The script refuses to
run outside `APP_ENV=development`/`test`.

### 8. Start the backend

```bash
cd backend
uvicorn app.main:app --reload
```

API docs: <http://localhost:8000/docs>

### 9. Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev
```

App: <http://localhost:5173>

### 10. Health endpoints

| Endpoint                                | Purpose                            | Healthy |
| --------------------------------------- | ---------------------------------- | ------- |
| <http://localhost:8000/api/health>       | Liveness — process is up           | `200`   |
| <http://localhost:8000/api/health/db>    | Readiness — runs `SELECT 1`        | `200`   |

`/api/health` stays `200` even when PostgreSQL is down; `/api/health/db`
returns `503` with a generic message. Connection strings, credentials and
tracebacks are never returned to the client.

---

## Tests

Backend:

```bash
cd backend
pytest
```

Tests marked `integration` need PostgreSQL running and skip automatically when
it is not.

Frontend:

```bash
npm run typecheck
npm run build
```

---

## Authentication

Email/password authentication is backend-backed and real:

- Users are rows in the PostgreSQL `users` table.
- Passwords are hashed with **Argon2id** (`pwdlib`). Plaintext is never stored
  or logged, and the digest is never returned by the API.
- Sessions use **JWT bearer access tokens**, signed with `JWT_SECRET_KEY` from
  the environment.

| Endpoint | Auth | Purpose |
| --- | --- | --- |
| `POST /api/auth/register` | — | Create an account, returns a token |
| `POST /api/auth/login` | — | Sign in, returns a token |
| `GET /api/auth/me` | Bearer | Current user (used to restore a session) |
| `POST /api/auth/onboarding` | Bearer | Save goals + experience |
| `PATCH /api/auth/profile` | Bearer | Update allow-listed profile fields |
| `POST /api/auth/logout` | Bearer | Audit point; the client discards its token |

**Logout is client-side.** Access tokens are stateless, so there is no server
session to destroy — the client deletes its token and the existing one expires
on its own. The endpoint exists so revocation (a denylist or token-version
column) can be added later without changing the client.

**Token storage is temporary.** The access token currently lives in
`localStorage` under `pharmapanda.access_token`, which is readable by any script
on the page. The intended end state is an httpOnly `SameSite` refresh cookie
plus a short-lived in-memory access token; that change is contained to
`src/services/http.ts`.

No progress is seeded. Competency scores, achievements, attempt history and
scenario completion all start empty and are only written by real consultations.

## Simulations

Consultations are backend-owned. Every attempt is a row in `attempts` with a
`user_id`, and every report a row in `evaluations`.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/scenarios` | Catalogue, with this user's progress on each case |
| `POST /api/attempts` | Start a consultation |
| `GET /api/attempts/{id}/patient` | Patient, **only the facts discovered so far** |
| `POST /api/attempts/{id}/messages` | Ask the patient a question |
| `POST /api/attempts/{id}/{recommendation,counseling,referral}` | Record a decision |
| `POST /api/attempts/{id}/finish` | Submit for evaluation |
| `POST /api/attempts/{id}/evaluate` | Score it (idempotent) |
| `GET /api/attempts/{id}/evaluation` | The report |
| `GET /api/attempts` | Consultation history |

**Hidden information is enforced server-side.** Undiscovered patient facts are
filtered out before serialisation, so they never reach the browser and cannot be
read out of a network response.

**Every attempt route is scoped by owner.** Another user's consultation returns
404, not 403 — an id that is not yours is indistinguishable from one that does
not exist.

**The engines are a behaviour-preserving port.** `tests/test_engine_parity.py`
replays real consultations captured from the original TypeScript engine and
asserts the Python port still returns byte-identical reports, down to the
wording of each piece of feedback. A scoring drift would be invisible in the UI
but would silently change every student's grade.

Calculations, drugs and settings still run on the frontend's local layer.

## Notes

**CORS over a dev proxy.** The backend allows the Vite origin explicitly
(`FRONTEND_URL`), so the frontend calls `http://localhost:8000/api` directly. No
Vite proxy is configured — direct backend access stays unambiguous, and the CORS
path is the one that must work in deployment anyway. To use a proxy instead, add
one in `vite.config.ts` and set `VITE_API_BASE_URL=/api`.

**Configuration** is typed via `pydantic-settings` in
`backend/app/core/config.py`. Every value can be overridden by the environment.
