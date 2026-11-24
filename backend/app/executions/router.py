from __future__ import annotations
"""
AgentX AI — Execution Router (Phase 2)

Endpoints:
  POST /agents/{agent_id}/execute        — Start execution (async, returns execution ID)
  GET  /executions                       — List executions (org-scoped, paginated)
  GET  /executions/{id}                  — Get execution detail
  POST /executions/{id}/cancel           — Cancel running execution
  GET  /executions/{id}/stream           — SSE stream of live execution events
  GET  /tools                            — List available tools
"""
import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.agents.models import Agent, AgentTool
from app.agents.engine.executor import AgentExecutor
from app.agents.engine.tools import list_tools
from app.executions import service
from app.executions.schemas import ExecutionCreate, ExecutionResponse, ExecutionListItem
from app.common.pagination import PaginatedResponse
from app.common.exceptions import NotFoundError, ForbiddenError
from app.organizations.service import get_user_orgs
from sqlalchemy import select

logger = logging.getLogger(__name__)
router = APIRouter(tags=["executions"])

# In-memory store for active execution streams
# Production: use Redis pub/sub
_active_streams: dict[str, asyncio.Queue] = {}


async def _require_org(current_user: User, db: AsyncSession) -> str:
    orgs = await get_user_orgs(db, current_user.id)
    if not orgs:
        raise ForbiddenError("You must belong to an organization")
    return orgs[0].id


async def _run_execution_background(
    execution_id: str,
    agent_config: dict,
    allowed_tools: list[str],
    user_input: str,
    agent_id: str,
    org_id: str,
    database_url: str,
):
    """Background task: run agent, push events to queue, persist results."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession as AS
    from sqlalchemy import text
    import re

    # SQLite check_same_thread fix
    connect_args = {}
    if "sqlite" in database_url:
        connect_args["check_same_thread"] = False

    bg_engine = create_async_engine(database_url, connect_args=connect_args)
    BgSession = async_sessionmaker(bg_engine, class_=AS, expire_on_commit=False, autoflush=False)

    queue = _active_streams.get(execution_id)

    async with BgSession() as db:
        # Mark as running
        from app.executions.models import Execution
        result = await db.execute(select(Execution).where(Execution.id == execution_id))
        execution = result.scalar_one_or_none()
        if not execution:
            return
        execution = await service.start_execution(db, execution)

        try:
            executor = AgentExecutor(
                agent_config=agent_config,
                allowed_tools=allowed_tools,
                max_iterations=15,
            )

            final_data = {}
            async for event in executor.run(user_input, execution_id, agent_id, org_id):
                if queue:
                    await queue.put(event)
                if event["event"] == "done":
                    final_data = event["data"]

            if final_data.get("status") == "completed":
                await service.complete_execution(
                    db, execution,
                    output_data={"output": final_data.get("final_output", "")},
                    tokens_used=final_data.get("tokens_used", 0),
                    cost_usd=final_data.get("cost_usd", 0.0),
                    iteration_count=final_data.get("iteration_count", 0),
                )
            else:
                await service.fail_execution(db, execution, error=final_data.get("error", "Unknown error"))

        except Exception as e:
            logger.error(f"Background execution error: {e}", exc_info=True)
            await service.fail_execution(db, execution, error=str(e))
            if queue:
                await queue.put({"event": "error", "data": {"error": str(e)}})
                await queue.put({"event": "done", "data": {"status": "failed", "error": str(e)}})
        finally:
            if queue:
                await queue.put(None)  # Sentinel = stream end
            await bg_engine.dispose()


@router.post("/agents/{agent_id}/execute", response_model=ExecutionResponse, status_code=202)
async def execute_agent(
    agent_id: str,
    body: ExecutionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kick off an async agent execution. Poll GET /executions/{id} or stream GET /executions/{id}/stream."""
    org_id = await _require_org(current_user, db)

    # Fetch agent
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.org_id == org_id, Agent.is_active == True)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise NotFoundError("Agent")

    # Fetch allowed tools
    tools_result = await db.execute(select(AgentTool).where(AgentTool.agent_id == agent_id))
    tool_names = [t.tool_name for t in tools_result.scalars().all()]

    # Create execution record
    user_input = body.input_data.get("message", str(body.input_data))
    execution = await service.create_execution(db, agent_id, org_id, current_user.id, body.input_data)

    agent_config = {
        "system_prompt": agent.system_prompt or "You are a helpful AI assistant.",
        "model_provider": agent.model_provider,
        "model_name": agent.model_name,
        "temperature": agent.temperature,
        "max_tokens": agent.max_tokens,
    }

    # Create a queue for streaming
    queue: asyncio.Queue = asyncio.Queue()
    _active_streams[execution.id] = queue

    # Run in background
    from app.config import settings
    background_tasks.add_task(
        _run_execution_background,
        execution.id,
        agent_config,
        tool_names,
        user_input,
        agent_id,
        org_id,
        settings.DATABASE_URL,
    )

    return execution


@router.get("/executions", response_model=PaginatedResponse[ExecutionListItem])
async def list_executions(
    agent_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    executions, total = await service.list_executions(db, org_id, agent_id, page, page_size)
    return PaginatedResponse(items=executions, total=total, page=page, page_size=page_size)


@router.get("/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.get_execution(db, execution_id, org_id)


@router.post("/executions/{execution_id}/cancel", response_model=ExecutionResponse)
async def cancel_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    org_id = await _require_org(current_user, db)
    return await service.cancel_execution(db, execution_id, org_id)


@router.get("/executions/{execution_id}/stream")
async def stream_execution(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Server-Sent Events stream for real-time execution output."""
    org_id = await _require_org(current_user, db)
    # Verify access
    await service.get_execution(db, execution_id, org_id)

    async def event_generator():
        queue = _active_streams.get(execution_id)
        if queue is None:
            # Execution already completed — fetch final state
            execution = await service.get_execution(db, execution_id, org_id)
            yield f"data: {json.dumps({'event': 'done', 'data': {'status': execution.status, 'output': execution.output_data}})}\n\n"
            return

        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=120.0)
                if event is None:
                    # Stream finished
                    break
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("event") == "done":
                    break
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'event': 'error', 'data': {'error': 'Stream timeout'}})}\n\n"
        finally:
            _active_streams.pop(execution_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/tools")
async def list_available_tools(current_user: User = Depends(get_current_user)):
    """List all tools available to agents."""
    return {"tools": list_tools()}
