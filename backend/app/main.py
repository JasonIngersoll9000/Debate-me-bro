import json
import logging
import os
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text, select, func
from app.routes import auth, topics, debates, research, votes
from app.db.database import _get_engine, _get_session_factory, Base
from app.db.models import CachedDebate
from app.config import settings

logger = logging.getLogger(__name__)

# Path to local JSON debate files for seeding
_SEED_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "data", "debates",
)


async def _seed_debates_from_files():
    """Seed the database with local JSON debate files if they aren't already stored."""
    if not os.path.isdir(_SEED_DIR):
        return

    factory = _get_session_factory()
    async with factory() as session:
        result = await session.execute(
            select(func.count()).select_from(CachedDebate)
        )
        existing_count = result.scalar_one()

    if existing_count > 0:
        logger.info("Database already has %d debates, skipping seed.", existing_count)
        return

    from app.debate.store import save_debate

    seeded = 0
    for filename in os.listdir(_SEED_DIR):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(_SEED_DIR, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            debate_id = data.get("id", filename.replace(".json", ""))
            await save_debate(debate_id, data)
            seeded += 1
            logger.info("Seeded debate '%s' from %s", debate_id, filename)
        except Exception as e:
            logger.warning("Failed to seed %s: %s", filename, e)

    logger.info("Seeded %d debates from local files.", seeded)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup and seed preset debates if needed."""
    try:
        engine = _get_engine()
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified.")
        await _seed_debates_from_files()
    except Exception as e:
        logger.warning("Could not initialize database (auth/votes will be unavailable): %s", e)
    yield


app = FastAPI(
    title="DebateMeBro API",
    description="AI-Powered Structured Debates That Steelman Both Sides",
    version="0.1.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all so unhandled errors return JSON (with CORS headers) instead of bare 500."""
    logger.error("Unhandled exception on %s %s: %s\n%s", request.method, request.url.path, exc, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3005",
        "http://localhost:3030",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3005",
        "http://127.0.0.1:3030",
        "https://debate-me-bro.vercel.app",
        "https://debate-me-bro-jasoningersoll9000s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(topics.router)
app.include_router(debates.router)
app.include_router(research.router)
app.include_router(votes.router)
