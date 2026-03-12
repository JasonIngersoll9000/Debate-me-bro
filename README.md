# DebateMeBro

AI-Powered Structured Debates That Steelman Both Sides.

## Local Development Setup

This project uses Docker Compose to manage local development dependencies including PostgreSQL (with pgvector), Redis, Next.js Frontend, and FastAPI Backend.

### Prerequisites
- Docker & Docker Compose
- Node.js (if running frontend outside of Docker)
- Python 3.12+ (if running backend outside of Docker)

### Quick Start

1. **Environment Variables**:
   Copy the example environment file and fill in your API keys (like `ANTHROPIC_API_KEY`):
   ```bash
   cp .env.example .env
   ```

2. **Start Services**:
   Run the following command to build and start all containers:
   ```bash
   docker compose up -d --build
   ```

3. **Accessing the Apps**:
   - Frontend is available at: [http://localhost:3030](http://localhost:3030)
   - Backend API is available at: [http://localhost:8000](http://localhost:8000)
   - Backend API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

### Stopping Services
To stop the services and remove containers (preserving volume data):
```bash
docker compose down
```