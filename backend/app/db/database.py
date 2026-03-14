from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# Lazy engine creation — only connect to DB when actually needed
_engine = None
_session_factory = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(settings.database_url, echo=True)
    return _engine


def _get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=_get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
    return _session_factory


async def get_db():
    factory = _get_session_factory()
    async with factory() as session:
        yield session
