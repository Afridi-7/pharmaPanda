from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Declarative base for every ORM model (SQLAlchemy 2.x style).

    Alembic autogenerate reads `Base.metadata`, so a model is only visible to a
    migration once its module has been imported. `app.db.base_all` exists to do
    that importing in one place — add new model modules there.
    """
