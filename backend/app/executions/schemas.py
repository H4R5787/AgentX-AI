from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List, Any


class ExecutionCreate(BaseModel):
    input_data: dict = Field(..., description="Input message/data for the agent")


class ExecutionTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    task_type: str
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    error: Optional[str]
    tokens_used: int
    created_at: datetime
    completed_at: Optional[datetime]


class ExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    agent_id: Optional[str]
    initiated_by: Optional[str]
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    error: Optional[str]
    tokens_used: int
    cost_usd: float
    iteration_count: int
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    tasks: List[ExecutionTaskResponse] = []


class ExecutionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    agent_id: Optional[str]
    status: str
    tokens_used: int
    cost_usd: float
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


class StreamEvent(BaseModel):
    event: str  # "token", "tool_call", "tool_result", "status", "error", "done"
    data: Any
