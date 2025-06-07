"""
Database helpers for FinanceBook.

This module centralises creation of the SQLModel engine, schema generation and
session management. Keeping these details in one place makes it trivial to swap
out SQLite for PostgreSQL, run migrations, or mock the database in tests.
"""
import os
from sqlmodel import SQLModel, create_engine, Session

# --------------------------------------------------------------------------- #
# Engine configuration
# --------------------------------------------------------------------------- #
# If no DATABASE_URL environment variable is present we fall back to a local
# on-disk SQLite database. Developers can override this to point at
# `postgresql+psycopg2://user:pass@host/dbname` or similar.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./financebook.db")

# SQLite requires an extra flag when used in a multi-threaded environment like
# Uvicorn's default worker model. For all other dialects this dictionary
# remains empty.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# echo=False keeps the SQL log clean in production; flip to True when debugging.
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


# --------------------------------------------------------------------------- #
# Public helpers
# --------------------------------------------------------------------------- #
def create_db_and_tables() -> None:
    """
    Create the relational schema based on imported SQLModel classes.

    This function is executed once at application startup. **Import order
    matters** – make sure all your `SQLModel` subclasses (e.g. in app.models)
    have been imported before calling this, otherwise their tables will not be
    created.
    """
    SQLModel.metadata.create_all(engine)


def get_session():
    """
    FastAPI dependency that provides a short-lived database session.

    Usage
    -----
    from fastapi import Depends
    from sqlmodel import Session

    @app.get("/items")
    def list_items(session: Session = Depends(get_session)):
        ...

    The session is yielded inside a context manager so that it is automatically
    closed (or rolled back in case of unhandled exceptions) at the end of the
    request lifecycle.
    """
    with Session(engine) as session:
        yield session