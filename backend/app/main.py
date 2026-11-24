from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import logging
from app.config import settings
from app.database import engine
from app.auth.router import router as auth_router
from app.organizations.router import router as org_router
from app.agents.router import router as agent_router
from app.monitoring.router import router as monitoring_router
from app.executions.router import router as execution_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AgentX AI starting up...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection OK")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
    yield
    logger.info("AgentX AI shutting down...")
    await engine.dispose()


app = FastAPI(
    title="AgentX AI",
    description="AI Agent Creation, Deployment, Orchestration and Management Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(org_router, prefix=API_PREFIX)
app.include_router(agent_router, prefix=API_PREFIX)
app.include_router(monitoring_router, prefix=API_PREFIX)
app.include_router(execution_router, prefix=API_PREFIX)


@app.get("/health", include_in_schema=False)
@app.get(f"{API_PREFIX}/health", include_in_schema=False)
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Don't mask HTTP exceptions
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        raise exc
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
