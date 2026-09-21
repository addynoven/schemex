from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def register_models():
    """Ensure all model entities are registered with SQLAlchemy Base metadata."""
    import app.modules.auth.models  # noqa
    import app.modules.schemes.models  # noqa
    import app.modules.vault.models  # noqa
    import app.modules.chat.models  # noqa
    import app.modules.admin.models  # noqa
    import app.modules.eligibility.models  # noqa