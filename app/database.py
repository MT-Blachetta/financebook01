"""
Database helpers for FinanceBook.

This module centralises creation of the SQLModel engine, schema generation and
session management. Keeping these details in one place makes it trivial to swap
out SQLite for PostgreSQL, run migrations, or mock the database in tests.
"""
# This section brings in the tools we need to work with our database.
import os
# This is the main tool we use to work with our database.
from sqlmodel import SQLModel, create_engine, Session

# --------------------------------------------------------------------------- #
# Engine configuration
# --------------------------------------------------------------------------- #
# This is the address of our database. If we don't specify a different address,
# it will create a new database file called "financebook.db" in the same directory as our app.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./financebook.db")

# This is a special setting that we need to use when we're using a SQLite database.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# This creates the "engine" that connects our app to the database.
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


# --------------------------------------------------------------------------- #
# Public helpers
# --------------------------------------------------------------------------- #
# This function creates all the tables in our database.
def create_db_and_tables() -> None:
    """
    This function looks at all the data models we've defined (like PaymentItem, Category, etc.)
    and creates the corresponding tables in our database.
    """
    SQLModel.metadata.create_all(engine)


# This function gives us a "session" that we can use to talk to our database.
def get_session():
    """
    A session is like a temporary conversation with our database. We can use it to
    add, update, or delete data. When we're done, the session is automatically closed.
    """
    with Session(engine) as session:
        yield session
