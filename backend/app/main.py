import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.routes import auth, topics, debates, research, votes
from app.db.database import _get_engine, Base
from app.config import settings

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup if a database is configured."""
    try:
        engine = _get_engine()
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created/verified.")
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
