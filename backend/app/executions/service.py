from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import List, Tuple, Optional
from app.executions.models import Execution, ExecutionTask, ExecutionStatus, TaskStatus
from app.agents.models import Agent, AgentTool
from app.common.exceptions import NotFoundError, ForbiddenError
import logging

logger = logging.getLogger(__name__)


async def _get_agent_for_execution(db: AsyncSession, agent_id: str, org_id: str) -> Agent:
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.org_id == org_id, Agent.is_active == True)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise NotFoundError("Agent (or agent is inactive)")
    return agent


async def create_execution(
    db: AsyncSession,
    agent_id: str,
    org_id: str,
    user_id: str,
    input_data: dict,
) -> Execution:
    # Validate agent belongs to org
    await _get_agent_for_execution(db, agent_id, org_id)

    execution = Execution(
        org_id=org_id,
        agent_id=agent_id,
        initiated_by=user_id,
        status=ExecutionStatus.PENDING,
        input_data=input_data,
    )
    db.add(execution)
    await db.commit()
    await db.refresh(execution)
    return execution


async def start_execution(db: AsyncSession, execution: Execution) -> Execution:
    execution.status = ExecutionStatus.RUNNING
    execution.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(execution)
    return execution


async def complete_execution(
    db: AsyncSession,
    execution: Execution,
    output_data: dict,
    tokens_used: int,
    cost_usd: float,
    iteration_count: int,
) -> Execution:
    execution.status = ExecutionStatus.COMPLETED
    execution.output_data = output_data
    execution.tokens_used = tokens_used
    execution.cost_usd = cost_usd
    execution.iteration_count = iteration_count
    execution.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(execution)
    return execution


async def fail_execution(db: AsyncSession, execution: Execution, error: str) -> Execution:
    execution.status = ExecutionStatus.FAILED
    execution.error = error
    execution.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(execution)
    return execution


async def cancel_execution(db: AsyncSession, execution_id: str, org_id: str) -> Execution:
    result = await db.execute(
        select(Execution).where(Execution.id == execution_id, Execution.org_id == org_id)
    )
    execution = result.scalar_one_or_none()
    if not execution:
        raise NotFoundError("Execution")
    if execution.status in (ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED):
        raise ForbiddenError(f"Cannot cancel execution in status: {execution.status}")
    execution.status = ExecutionStatus.CANCELLED
    execution.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(execution)
    return execution


async def get_execution(db: AsyncSession, execution_id: str, org_id: str) -> Execution:
    result = await db.execute(
        select(Execution).where(Execution.id == execution_id, Execution.org_id == org_id)
    )
    execution = result.scalar_one_or_none()
    if not execution:
        raise NotFoundError("Execution")
    return execution


async def list_executions(
    db: AsyncSession,
    org_id: str,
    agent_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Execution], int]:
    query = select(Execution).where(Execution.org_id == org_id)
    count_query = select(func.count()).select_from(Execution).where(Execution.org_id == org_id)

    if agent_id:
        query = query.where(Execution.agent_id == agent_id)
        count_query = count_query.where(Execution.agent_id == agent_id)

    total = (await db.execute(count_query)).scalar_one()
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Execution.created_at.desc()).offset(offset).limit(page_size))
    return list(result.scalars().all()), total


async def add_task(
    db: AsyncSession,
    execution_id: str,
    task_type: str,
    input_data: dict,
) -> ExecutionTask:
    task = ExecutionTask(
        execution_id=execution_id,
        task_type=task_type,
        status=TaskStatus.RUNNING,
        input_data=input_data,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def complete_task(
    db: AsyncSession,
    task: ExecutionTask,
    output_data: dict,
    tokens_used: int = 0,
) -> ExecutionTask:
    task.status = TaskStatus.COMPLETED
    task.output_data = output_data
    task.tokens_used = tokens_used
    task.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(task)
    return task
