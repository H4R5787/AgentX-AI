from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Any, Dict
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.agents.models import Agent
from app.organizations.models import OrgMembership
from app.organizations.service import get_user_orgs
from app.config import settings

router = APIRouter(tags=["monitoring"])


@router.get("/dashboard/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    orgs = await get_user_orgs(db, current_user.id)
    if not orgs:
        return {
            "total_agents": 0,
            "active_agents": 0,
            "total_executions": 0,
            "active_executions": 0,
            "completed_executions": 0,
            "failed_executions": 0,
            "active_deployments": 0,
            "org_members": 0,
            "total_tokens_used": 0,
            "total_cost_usd": 0.0,
        }
    org_id = orgs[0].id

    total_agents = (
        await db.execute(select(func.count()).select_from(Agent).where(Agent.org_id == org_id))
    ).scalar_one()

    active_agents = (
        await db.execute(
            select(func.count()).select_from(Agent).where(Agent.org_id == org_id, Agent.is_active == True)
        )
    ).scalar_one()

    org_members = (
        await db.execute(
            select(func.count()).select_from(OrgMembership).where(OrgMembership.org_id == org_id)
        )
    ).scalar_one()

    # Execution stats (may not exist yet if executions table is empty)
    exec_stats = {
        "total_executions": 0,
        "active_executions": 0,
        "completed_executions": 0,
        "failed_executions": 0,
        "total_tokens_used": 0,
        "total_cost_usd": 0.0,
    }
    try:
        from app.executions.models import Execution
        total_exec = (
            await db.execute(select(func.count()).select_from(Execution).where(Execution.org_id == org_id))
        ).scalar_one()
        active_exec = (
            await db.execute(
                select(func.count()).select_from(Execution).where(
                    Execution.org_id == org_id, Execution.status.in_(["pending", "running"])
                )
            )
        ).scalar_one()
        completed_exec = (
            await db.execute(
                select(func.count()).select_from(Execution).where(
                    Execution.org_id == org_id, Execution.status == "completed"
                )
            )
        ).scalar_one()
        failed_exec = (
            await db.execute(
                select(func.count()).select_from(Execution).where(
                    Execution.org_id == org_id, Execution.status == "failed"
                )
            )
        ).scalar_one()
        total_tokens = (
            await db.execute(
                select(func.coalesce(func.sum(Execution.tokens_used), 0)).where(Execution.org_id == org_id)
            )
        ).scalar_one()
        total_cost = (
            await db.execute(
                select(func.coalesce(func.sum(Execution.cost_usd), 0.0)).where(Execution.org_id == org_id)
            )
        ).scalar_one()
        exec_stats = {
            "total_executions": total_exec,
            "active_executions": active_exec,
            "completed_executions": completed_exec,
            "failed_executions": failed_exec,
            "total_tokens_used": int(total_tokens or 0),
            "total_cost_usd": float(total_cost or 0.0),
        }
    except Exception:
        pass  # Table not yet migrated

    return {
        "total_agents": total_agents,
        "active_agents": active_agents,
        "active_deployments": 0,  # Phase 4
        "org_members": org_members,
        **exec_stats,
    }


@router.get("/monitoring/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    return {
        "status": "healthy" if db_ok else "degraded",
        "services": {
            "database": "ok" if db_ok else "error",
            "environment": settings.ENVIRONMENT,
        },
    }
