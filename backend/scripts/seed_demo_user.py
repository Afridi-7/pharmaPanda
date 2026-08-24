"""
Create (or reset) the development demo account.

    cd backend
    python -m scripts.seed_demo_user

DEVELOPMENT ONLY. The password below is public, published in this repository,
and exists purely so the local login screen has something to sign in with. It
must never be used for a real account or in any deployed environment — the
script refuses to run outside development.

The password goes through the same hashing service as normal registration; no
digest is hardcoded here.
"""

import sys

from app.core.config import settings
from app.db.session import SessionLocal
from app.schemas.user import RegisterRequest
from app.services import user_service
from app.services.user_service import EmailAlreadyRegisteredError

DEMO_EMAIL = "demo@pharmapanda.app"
DEMO_PASSWORD = "pharmapanda-dev"  # noqa: S105 - development-only, see module docstring


def main() -> int:
    if settings.APP_ENV not in {"development", "test"}:
        print(f"Refusing to seed a demo account in APP_ENV={settings.APP_ENV!r}.", file=sys.stderr)
        return 1

    payload = RegisterRequest(
        first_name="Demo",
        last_name="Student",
        email=DEMO_EMAIL,
        password=DEMO_PASSWORD,
        university="University of Debrecen",
        year="3rd Year",
    )

    with SessionLocal() as db:
        existing = user_service.get_by_email(db, DEMO_EMAIL)
        if existing is not None:
            print(f"Demo account already present: {existing.email} (id={existing.id})")
            return 0

        try:
            user = user_service.register(db, payload)
        except EmailAlreadyRegisteredError:
            print("Demo account already present.")
            return 0

    print(f"Created demo account: {user.email} (id={user.id})")
    print(f"Development password: {DEMO_PASSWORD}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
