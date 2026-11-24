from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.agents.schemas import AgentCreate, AgentUpdate, AgentResponse, AgentListItem
from app.agents import service
from app.common.pagination import PaginatedResponse
from app.common.exceptions import ForbiddenError
from app.organizations.service import get_user_orgs

router = APIRouter(prefix="/agents", tags=["agents"])


async def _require_org(current_user: User, db: AsyncSession) -> str:
    orgs = await get_user_orgs(db, current_user.id)
    if not orgs:
        raise ForbiddenError("You must belong to an organization to manage agents")
    return orgs[0].id


@router.get("/", response_model=PaginatedResponse[AgentListItem])
async def list_agents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    agents, total = await service.list_agents(db, org_id, page, page_size)
    return PaginatedResponse(items=agents, total=total, page=page, page_size=page_size)


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_in: AgentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.create_agent(db, agent_in, org_id, current_user.id)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.get_agent(db, agent_id, org_id)


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    update_data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.update_agent(db, agent_id, update_data, org_id)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    await service.delete_agent(db, agent_id, org_id)


@router.post("/{agent_id}/duplicate", response_model=AgentResponse, status_code=201)
async def duplicate_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.duplicate_agent(db, agent_id, org_id, current_user.id)


@router.post("/{agent_id}/toggle", response_model=AgentResponse)
async def toggle_agent(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.toggle_agent(db, agent_id, org_id)
