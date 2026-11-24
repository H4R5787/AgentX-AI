from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from typing import List, Tuple
from app.agents.models import Agent, AgentTool
from app.agents.schemas import AgentCreate, AgentUpdate
from app.common.exceptions import NotFoundError


async def _get_agent_or_404(db: AsyncSession, agent_id: str, org_id: str) -> Agent:
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.org_id == org_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise NotFoundError("Agent")
    return agent


async def create_agent(db: AsyncSession, agent_in: AgentCreate, org_id: str, user_id: str) -> Agent:
    agent = Agent(
        org_id=org_id,
        created_by=user_id,
        name=agent_in.name,
        description=agent_in.description,
        system_prompt=agent_in.system_prompt,
        model_provider=agent_in.model_provider,
        model_name=agent_in.model_name,
        temperature=agent_in.temperature,
        max_tokens=agent_in.max_tokens,
    )
    db.add(agent)
    await db.flush()
    for tool_config in agent_in.tools:
        tool = AgentTool(
            agent_id=agent.id, tool_name=tool_config.tool_name, config=tool_config.config
        )
        db.add(tool)
    await db.commit()
    await db.refresh(agent)
    return agent


async def list_agents(
    db: AsyncSession, org_id: str, page: int = 1, page_size: int = 20
) -> Tuple[List[Agent], int]:
    offset = (page - 1) * page_size
    total_result = await db.execute(
        select(func.count()).select_from(Agent).where(Agent.org_id == org_id)
    )
    total = total_result.scalar_one()
    result = await db.execute(
        select(Agent)
        .where(Agent.org_id == org_id)
        .order_by(Agent.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    agents = list(result.scalars().all())
    return agents, total


async def get_agent(db: AsyncSession, agent_id: str, org_id: str) -> Agent:
    return await _get_agent_or_404(db, agent_id, org_id)


async def update_agent(db: AsyncSession, agent_id: str, update_data: AgentUpdate, org_id: str) -> Agent:
    agent = await _get_agent_or_404(db, agent_id, org_id)
    update_fields = update_data.model_dump(exclude_none=True, exclude={"tools"})
    for field, value in update_fields.items():
        setattr(agent, field, value)
    if update_data.tools is not None:
        await db.execute(delete(AgentTool).where(AgentTool.agent_id == agent_id))
        for tool_config in update_data.tools:
            tool = AgentTool(
                agent_id=agent.id, tool_name=tool_config.tool_name, config=tool_config.config
            )
            db.add(tool)
    agent.version += 1
    await db.commit()
    await db.refresh(agent)
    return agent


async def delete_agent(db: AsyncSession, agent_id: str, org_id: str) -> None:
    agent = await _get_agent_or_404(db, agent_id, org_id)
    await db.delete(agent)
    await db.commit()


async def duplicate_agent(db: AsyncSession, agent_id: str, org_id: str, user_id: str) -> Agent:
    source = await _get_agent_or_404(db, agent_id, org_id)
    new_agent = Agent(
        org_id=org_id,
        created_by=user_id,
        name=f"{source.name} (Copy)",
        description=source.description,
        system_prompt=source.system_prompt,
        model_provider=source.model_provider,
        model_name=source.model_name,
        temperature=source.temperature,
        max_tokens=source.max_tokens,
    )
    db.add(new_agent)
    await db.flush()
    for tool in source.tools:
        new_tool = AgentTool(
            agent_id=new_agent.id, tool_name=tool.tool_name, config=tool.config
        )
        db.add(new_tool)
    await db.commit()
    await db.refresh(new_agent)
    return new_agent


async def toggle_agent(db: AsyncSession, agent_id: str, org_id: str) -> Agent:
    agent = await _get_agent_or_404(db, agent_id, org_id)
    agent.is_active = not agent.is_active
    await db.commit()
    await db.refresh(agent)
    return agent
