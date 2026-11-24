from __future__ import annotations
"""
AgentX AI — Agent State (LangGraph Phase 2)

Defines the typed state dict used in LangGraph agent graphs.
Messages follow the LangChain BaseMessage convention so they
can be passed directly to LLM providers.
"""
from typing import TypedDict, List, Any, Optional, Annotated
import operator


class AgentState(TypedDict):
    """State passed through every node of the LangGraph agent graph."""
    # Core conversation
    messages: Annotated[list, operator.add]  # Append-only list of messages

    # Execution metadata
    execution_id: str
    agent_id: str
    org_id: str
    iteration: int
    max_iterations: int

    # Tool usage
    pending_tool_calls: List[dict]
    tool_results: List[dict]

    # Control flow
    should_continue: bool
    requires_approval: bool
    approval_reason: Optional[str]

    # Output
    final_output: Optional[str]
    tokens_used: int
    cost_usd: float
    error: Optional[str]
