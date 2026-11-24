from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List


class AgentToolConfig(BaseModel):
    tool_name: str
    config: Optional[dict] = None


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model_provider: str = "openai"
    model_name: str = "gpt-4o-mini"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    tools: List[AgentToolConfig] = []


class AgentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0)
    tools: Optional[List[AgentToolConfig]] = None


class AgentToolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tool_name: str
    config: Optional[dict]


class AgentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    created_by: Optional[str]
    name: str
    description: Optional[str]
    system_prompt: Optional[str]
    model_provider: str
    model_name: str
    temperature: float
    max_tokens: Optional[int]
    is_active: bool
    version: int
    tools: List[AgentToolResponse]
    created_at: datetime
    updated_at: datetime


class AgentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    description: Optional[str]
    model_provider: str
    model_name: str
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime
