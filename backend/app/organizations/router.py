from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.organizations.schemas import OrgCreate, OrgUpdate, OrgResponse, MembershipResponse
from app.organizations import service

router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post("/", response_model=OrgResponse, status_code=201)
async def create_organization(
    org_in: OrgCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.create_organization(db, org_in, current_user.id)


@router.get("/", response_model=List[OrgResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_user_orgs(db, current_user.id)


@router.get("/{org_id}", response_model=OrgResponse)
async def get_organization(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.get_org(db, org_id, current_user.id)


@router.patch("/{org_id}", response_model=OrgResponse)
async def update_organization(
    org_id: str,
    update_data: OrgUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await service.update_org(db, org_id, update_data, current_user.id)


@router.get("/{org_id}/members", response_model=List[MembershipResponse])
async def list_members(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.get_org(db, org_id, current_user.id)  # permission check
    return await service.get_org_members(db, org_id)


@router.delete("/{org_id}/members/{user_id}", status_code=204)
async def remove_member(
    org_id: str,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await service.remove_member(db, org_id, user_id, current_user.id)
