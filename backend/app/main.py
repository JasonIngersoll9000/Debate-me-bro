from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, topics, debates, research, votes

app = FastAPI(
    title="DebateMeBro API",
    description="AI-Powered Structured Debates That Steelman Both Sides",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
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
