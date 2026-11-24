from __future__ import annotations
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class OrgCreate(BaseModel):
    name: str
    slug: Optional[str] = None


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None


class OrgResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    plan: str
    created_at: datetime


class MembershipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    user_id: str
    role: str
    created_at: datetime
