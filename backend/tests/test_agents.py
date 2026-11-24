from __future__ import annotations
import pytest
from httpx import AsyncClient


AGENT_PAYLOAD = {
    "name": "Test Agent",
    "description": "A test agent",
    "system_prompt": "You are a helpful assistant.",
    "model_provider": "openai",
    "model_name": "gpt-4o-mini",
    "temperature": 0.7,
    "tools": []
}


@pytest.mark.asyncio
async def test_create_agent(client: AsyncClient, org_with_headers: dict):
    headers = org_with_headers["headers"]
    response = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Agent"
    assert data["model_provider"] == "openai"
    assert data["version"] == 1
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_agents_empty(client: AsyncClient, auth_headers: dict):
    # Register fresh user with their own org
    r = await client.post("/api/v1/auth/register", json={
        "email": "agent_list@agentx.ai", "password": "securepass123"
    })
    login = await client.post("/api/v1/auth/login", json={
        "email": "agent_list@agentx.ai", "password": "securepass123"
    })
    h = {"Authorization": f"Bearer {login.json()['access_token']}"}
    await client.post("/api/v1/organizations/", json={"name": "Fresh Org"}, headers=h)
    response = await client.get("/api/v1/agents/", headers=h)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


@pytest.mark.asyncio
async def test_get_agent(client: AsyncClient, org_with_headers: dict):
    headers = org_with_headers["headers"]
    create = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    agent_id = create.json()["id"]
    response = await client.get(f"/api/v1/agents/{agent_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == agent_id


@pytest.mark.asyncio
async def test_update_agent(client: AsyncClient, org_with_headers: dict):
    headers = org_with_headers["headers"]
    create = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    agent_id = create.json()["id"]
    response = await client.patch(f"/api/v1/agents/{agent_id}",
                                   json={"name": "Updated Agent", "temperature": 0.5},
                                   headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Agent"
    assert data["temperature"] == 0.5
    assert data["version"] == 2  # version bumped


@pytest.mark.asyncio
async def test_toggle_agent(client: AsyncClient, org_with_headers: dict):
    headers = org_with_headers["headers"]
    create = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    agent_id = create.json()["id"]
    # Disable
    r = await client.post(f"/api/v1/agents/{agent_id}/toggle", headers=headers)
    assert r.json()["is_active"] is False
    # Re-enable
    r2 = await client.post(f"/api/v1/agents/{agent_id}/toggle", headers=headers)
    assert r2.json()["is_active"] is True


@pytest.mark.asyncio
async def test_duplicate_agent(client: AsyncClient, org_with_headers: dict):
    headers = org_with_headers["headers"]
    create = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    agent_id = create.json()["id"]
    response = await client.post(f"/api/v1/agents/{agent_id}/duplicate", headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert "(Copy)" in data["name"]
    assert data["id"] != agent_id


@pytest.mark.asyncio
async def test_delete_agent(client: AsyncClient, org_with_headers: dict):
    headers = org_with_headers["headers"]
    create = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    agent_id = create.json()["id"]
    delete = await client.delete(f"/api/v1/agents/{agent_id}", headers=headers)
    assert delete.status_code == 204
    get = await client.get(f"/api/v1/agents/{agent_id}", headers=headers)
    assert get.status_code == 404


@pytest.mark.asyncio
async def test_tenant_isolation(client: AsyncClient):
    """Agent from org A should not be visible to org B user."""
    # User A
    await client.post("/api/v1/auth/register", json={"email": "usera@agentx.ai", "password": "securepass123"})
    login_a = await client.post("/api/v1/auth/login", json={"email": "usera@agentx.ai", "password": "securepass123"})
    headers_a = {"Authorization": f"Bearer {login_a.json()['access_token']}"}
    await client.post("/api/v1/organizations/", json={"name": "Org A"}, headers=headers_a)

    # User B
    await client.post("/api/v1/auth/register", json={"email": "userb@agentx.ai", "password": "securepass123"})
    login_b = await client.post("/api/v1/auth/login", json={"email": "userb@agentx.ai", "password": "securepass123"})
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}
    await client.post("/api/v1/organizations/", json={"name": "Org B"}, headers=headers_b)

    # Create agent as User A
    create = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers_a)
    agent_id = create.json()["id"]

    # User B tries to access User A's agent — must fail
    response = await client.get(f"/api/v1/agents/{agent_id}", headers=headers_b)
    assert response.status_code == 404  # Not visible to other tenant


@pytest.mark.asyncio
async def test_agent_requires_org(client: AsyncClient):
    """Creating an agent without an org should fail."""
    await client.post("/api/v1/auth/register", json={"email": "noorg@agentx.ai", "password": "securepass123"})
    login = await client.post("/api/v1/auth/login", json={"email": "noorg@agentx.ai", "password": "securepass123"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    response = await client.post("/api/v1/agents/", json=AGENT_PAYLOAD, headers=headers)
    assert response.status_code == 403
