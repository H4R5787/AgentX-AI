from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.organizations.models import Organization, OrgMembership
from app.organizations.schemas import OrgCreate, OrgUpdate
from app.common.utils import slugify
from app.common.exceptions import NotFoundError, ForbiddenError, ConflictError
import uuid


async def create_organization(db: AsyncSession, org_in: OrgCreate, owner_user_id: str) -> Organization:
    slug = org_in.slug or slugify(org_in.name)
    # Ensure unique slug
    existing = await db.execute(select(Organization).where(Organization.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
    org = Organization(name=org_in.name, slug=slug)
    db.add(org)
    await db.flush()
    membership = OrgMembership(org_id=org.id, user_id=owner_user_id, role="owner")
    db.add(membership)
    await db.commit()
    await db.refresh(org)
    return org


async def get_org(db: AsyncSession, org_id: str, user_id: str) -> Organization:
    membership = await db.execute(
        select(OrgMembership).where(
            OrgMembership.org_id == org_id,
            OrgMembership.user_id == user_id,
        )
    )
    if not membership.scalar_one_or_none():
        raise ForbiddenError("Not a member of this organization")
    org = await db.get(Organization, org_id)
    if not org:
        raise NotFoundError("Organization")
    return org


async def get_user_orgs(db: AsyncSession, user_id: str) -> List[Organization]:
    result = await db.execute(
        select(Organization)
        .join(OrgMembership, OrgMembership.org_id == Organization.id)
        .where(OrgMembership.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_org_members(db: AsyncSession, org_id: str) -> List[OrgMembership]:
    result = await db.execute(
        select(OrgMembership).where(OrgMembership.org_id == org_id)
    )
    return list(result.scalars().all())


async def add_member(db: AsyncSession, org_id: str, user_id: str, role: str = "member") -> OrgMembership:
    existing = await db.execute(
        select(OrgMembership).where(OrgMembership.org_id == org_id, OrgMembership.user_id == user_id)
    )
    if existing.scalar_one_or_none():
        raise ConflictError("User is already a member")
    membership = OrgMembership(org_id=org_id, user_id=user_id, role=role)
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


async def remove_member(db: AsyncSession, org_id: str, user_id: str, requesting_user_id: str) -> None:
    requester = await db.execute(
        select(OrgMembership).where(
            OrgMembership.org_id == org_id, OrgMembership.user_id == requesting_user_id
        )
    )
    requester_membership = requester.scalar_one_or_none()
    if not requester_membership or requester_membership.role not in ("owner", "admin"):
        raise ForbiddenError("Only owners or admins can remove members")
    target = await db.execute(
        select(OrgMembership).where(OrgMembership.org_id == org_id, OrgMembership.user_id == user_id)
    )
    target_membership = target.scalar_one_or_none()
    if not target_membership:
        raise NotFoundError("Member")
    await db.delete(target_membership)
    await db.commit()


async def update_org(db: AsyncSession, org_id: str, update_data: OrgUpdate, user_id: str) -> Organization:
    org = await get_org(db, org_id, user_id)
    if update_data.name is not None:
        org.name = update_data.name
    if update_data.plan is not None:
        org.plan = update_data.plan
    await db.commit()
    await db.refresh(org)
    return org
