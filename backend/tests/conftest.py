from __future__ import annotations
import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def registered_user(client: AsyncClient) -> dict:
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@agentx.ai",
        "password": "securepass123",
        "full_name": "Test User"
    })
    assert response.status_code == 201
    return response.json()


@pytest.fixture
async def auth_headers(client: AsyncClient, registered_user: dict) -> dict:
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@agentx.ai",
        "password": "securepass123"
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def org_with_headers(client: AsyncClient, auth_headers: dict) -> dict:
    response = await client.post("/api/v1/organizations/", json={"name": "Test Org"}, headers=auth_headers)
    assert response.status_code == 201
    return {"org": response.json(), "headers": auth_headers}
