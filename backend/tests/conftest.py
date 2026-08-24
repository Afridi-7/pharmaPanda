import os

# Force a predictable configuration before app modules read settings. This keeps
# the suite independent of whatever backend/.env happens to contain locally.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DEBUG", "false")
os.environ.setdefault("API_PREFIX", "/api")
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-not-used-anywhere-else")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://pharmapanda:pharmapanda@localhost:5432/pharmapanda",
)

from collections.abc import Generator  # noqa: E402

import pytest  # noqa: E402
import sqlalchemy as sa  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.db.base_all import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

# Auth tests create and delete rows, so they run against their own database
# rather than the development one. Name is derived from DATABASE_URL so the
# credentials and host stay in a single place.
_dev_url = sa.engine.make_url(settings.DATABASE_URL)
TEST_DB_NAME = f"{_dev_url.database}_test"
TEST_DATABASE_URL = _dev_url.set(database=TEST_DB_NAME)


def _postgres_available() -> bool:
    try:
        admin = sa.create_engine(_dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
        with admin.connect():
            return True
    except Exception:  # noqa: BLE001 - any failure means "not available here"
        return False
    finally:
        try:
            admin.dispose()
        except Exception:  # noqa: BLE001, S110
            pass


requires_postgres = pytest.mark.skipif(
    not _postgres_available(),
    reason="PostgreSQL is not running — start it with: docker compose up -d db",
)


@pytest.fixture(scope="session")
def api_prefix() -> str:
    return settings.API_PREFIX


@pytest.fixture(scope="session")
def test_engine() -> Generator[sa.Engine, None, None]:
    """
    Create a dedicated `<db>_test` database for the session and drop it after.

    The development database is never touched, so a failed auth test cannot
    delete real local accounts.
    """
    if not _postgres_available():
        pytest.skip("PostgreSQL is not running")

    admin = sa.create_engine(_dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(sa.text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}" WITH (FORCE)'))
        conn.execute(sa.text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    admin.dispose()

    engine = sa.create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    yield engine

    engine.dispose()
    admin = sa.create_engine(_dev_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(sa.text(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}" WITH (FORCE)'))
    admin.dispose()


@pytest.fixture()
def db_session(test_engine: sa.Engine) -> Generator[Session, None, None]:
    """
    Per-test session wrapped in a transaction that is always rolled back.

    Each test therefore starts from an empty `users` table without paying for a
    schema rebuild between tests.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, expire_on_commit=False)()

    # Keep the outer transaction alive across the service layer's commit() calls
    # by restarting the nested savepoint whenever one ends.
    nested = connection.begin_nested()

    @sa.event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(sess, trans):  # noqa: ANN001, ARG001
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        sa.event.remove(session, "after_transaction_end", _restart_savepoint)
        session.close()
        if transaction.is_active:
            transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """API client bound to the rolled-back test session."""

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def anon_client() -> Generator[TestClient, None, None]:
    """Client with no database override — for tests that must not hit PostgreSQL."""
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
