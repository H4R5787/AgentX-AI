from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from app.audit.models import AuditLog
from typing import Optional


async def log_event(
    db: AsyncSession,
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    org_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    log = AuditLog(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        org_id=org_id,
        details=details,
        ip_address=ip_address,
    )
    db.add(log)
    await db.commit()
    return log
