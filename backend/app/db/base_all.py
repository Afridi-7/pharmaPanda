"""
Single import surface for Alembic autogenerate.

Alembic can only see a table if the class defining it has been imported. Import
every model module here so `alembic revision --autogenerate` sees the full
metadata.
"""

from app.db.base import Base
from app.models.user import User  # noqa: F401

__all__ = ["Base", "User"]
