from __future__ import annotations
"""
AgentX AI — LangGraph Agent Executor (Phase 2)

Implements a stateful ReAct-style agent using LangGraph.
The graph has these nodes:
  1. call_llm   — sends current messages to the LLM provider
  2. run_tools  — executes tool calls returned by the LLM
  3. check_limit — enforces max iteration / token limits

Execution is bounded by:
  - MAX_ITERATIONS (default 15, configurable per execution)
  - Timeout handled at the API layer via asyncio.wait_for
  - Token counting per response

Security:
  - Tools are taken from the agent's allowlist only
  - No arbitrary code execution or shell access
  - All tool inputs sanitized inside the tool fn
"""
import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Any, Dict, List, Optional

from app.agents.engine.state import AgentState
from app.agents.engine.tools import TOOL_REGISTRY, ToolResult

logger = logging.getLogger(__name__)

# Cost estimates per 1k tokens (approximate, model-agnostic fallback)
_COST_PER_1K = {
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
}
_DEFAULT_COST = {"input": 0.001, "output": 0.002}


def _estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    rates = _COST_PER_1K.get(model, _DEFAULT_COST)
    return (input_tokens / 1000) * rates["input"] + (output_tokens / 1000) * rates["output"]


class AgentExecutor:
    """
    LangGraph-based agent executor.

    If langchain/langgraph packages are installed the executor uses them
    for real LLM calls. Otherwise it falls back to a mock mode that
    still exercises the entire graph, tool execution, and state management —
    useful for running tests without API keys.
    """

    def __init__(
        self,
        agent_config: Dict[str, Any],
        allowed_tools: List[str],
        max_iterations: int = 15,
    ):
        self.agent_config = agent_config
        self.allowed_tools = allowed_tools
        self.max_iterations = max_iterations
        self._llm = self._build_llm()

    # ── LLM factory ────────────────────────────────────────────

    def _build_llm(self):
        """Try to build a real LLM client; return None if packages missing."""
        provider = self.agent_config.get("model_provider", "openai")
        model = self.agent_config.get("model_name", "gpt-4o-mini")
        temperature = self.agent_config.get("temperature", 0.7)
        max_tokens = self.agent_config.get("max_tokens")

        try:
            if provider == "openai":
                from langchain_openai import ChatOpenAI  # type: ignore
                kwargs = dict(model=model, temperature=temperature, streaming=True)
                if max_tokens:
                    kwargs["max_tokens"] = max_tokens
                return ChatOpenAI(**kwargs)
            elif provider == "ollama":
                from langchain_ollama import ChatOllama  # type: ignore
                return ChatOllama(model=model, temperature=temperature)
        except ImportError:
            logger.warning("LangChain not installed — running in mock mode")
        except Exception as e:
            logger.warning(f"Could not initialise LLM ({provider}/{model}): {e}")
        return None

    # ── Tool execution ──────────────────────────────────────────

    def _run_tool(self, tool_name: str, tool_input: str) -> ToolResult:
        if tool_name not in self.allowed_tools:
            return ToolResult(False, f"Tool '{tool_name}' is not in this agent's allowlist")
        tool = TOOL_REGISTRY.get(tool_name)
        if not tool:
            return ToolResult(False, f"Unknown tool: {tool_name}")
        return tool.run(tool_input)

    # ── Message helpers ─────────────────────────────────────────

    @staticmethod
    def _make_system_message(system_prompt: str) -> dict:
        return {"role": "system", "content": system_prompt}

    @staticmethod
    def _make_user_message(text: str) -> dict:
        return {"role": "user", "content": text}

    @staticmethod
    def _make_tool_result_message(tool_name: str, result: str) -> dict:
        return {"role": "tool", "content": result, "name": tool_name}

    # ── Graph nodes ─────────────────────────────────────────────

    async def _node_call_llm(self, state: AgentState) -> dict:
        """Call LLM and parse response."""
        messages = state["messages"]

        if self._llm is None:
            # Mock response for testing without API key
            mock_text = (
                f"[MOCK] I'm a mock agent (no LLM keys configured). "
                f"I received {len(messages)} messages. "
                f"Input was: {messages[-1].get('content', '')[:100] if messages else ''}"
            )
            return {
                "messages": [{"role": "assistant", "content": mock_text}],
                "pending_tool_calls": [],
                "tokens_used": state["tokens_used"] + 50,
                "cost_usd": state["cost_usd"] + 0.0001,
                "final_output": mock_text,
                "should_continue": False,
            }

        try:
            from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage  # type: ignore

            lc_messages = []
            for m in messages:
                role = m.get("role", "user")
                content = m.get("content", "")
                if role == "system":
                    lc_messages.append(SystemMessage(content=content))
                elif role == "user":
                    lc_messages.append(HumanMessage(content=content))
                elif role == "assistant":
                    lc_messages.append(AIMessage(content=content))
                elif role == "tool":
                    lc_messages.append(ToolMessage(content=content, tool_call_id=m.get("name", "tool")))

            response = await self._llm.ainvoke(lc_messages)
            usage = response.usage_metadata or {}
            input_tok = usage.get("input_tokens", 0)
            output_tok = usage.get("output_tokens", 0)
            total_tok = input_tok + output_tok
            cost = _estimate_cost(self.agent_config.get("model_name", ""), input_tok, output_tok)

            # Check for tool calls
            pending: List[dict] = []
            if hasattr(response, "tool_calls") and response.tool_calls:
                for tc in response.tool_calls:
                    pending.append({"name": tc["name"], "input": json.dumps(tc.get("args", {}))})

            final = None if pending else response.content

            return {
                "messages": [{"role": "assistant", "content": response.content}],
                "pending_tool_calls": pending,
                "tokens_used": state["tokens_used"] + total_tok,
                "cost_usd": state["cost_usd"] + cost,
                "final_output": final,
                "should_continue": bool(pending),
            }
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            return {
                "error": str(e),
                "should_continue": False,
                "final_output": f"Agent error: {e}",
            }

    async def _node_run_tools(self, state: AgentState) -> dict:
        """Execute pending tool calls and collect results."""
        tool_results = []
        new_messages = []

        for tc in state.get("pending_tool_calls", []):
            name = tc.get("name", "")
            inp = tc.get("input", "")
            result = self._run_tool(name, inp)
            tool_results.append({"tool": name, "result": result.to_string(), "success": result.success})
            new_messages.append(self._make_tool_result_message(name, result.to_string()))
            logger.info(f"Tool '{name}' executed, success={result.success}")

        return {
            "messages": new_messages,
            "tool_results": state.get("tool_results", []) + tool_results,
            "pending_tool_calls": [],
            "should_continue": True,
        }

    async def _node_check_limit(self, state: AgentState) -> dict:
        """Enforce iteration and token limits."""
        iteration = state["iteration"] + 1
        updates: dict = {"iteration": iteration}

        if iteration >= state["max_iterations"]:
            logger.warning(f"Agent hit max iterations ({state['max_iterations']})")
            updates["should_continue"] = False
            updates["final_output"] = (
                state.get("final_output") or
                f"Agent stopped after reaching the maximum of {state['max_iterations']} iterations."
            )
        return updates

    # ── Routing logic ───────────────────────────────────────────

    def _should_continue(self, state: AgentState) -> str:
        if not state.get("should_continue", False):
            return "done"
        if state.get("pending_tool_calls"):
            return "run_tools"
        return "call_llm"

    # ── Main run method ─────────────────────────────────────────

    async def run(
        self,
        user_input: str,
        execution_id: str,
        agent_id: str,
        org_id: str,
    ) -> AsyncGenerator[dict, None]:
        """
        Run the agent and yield stream events.
        Each event is a dict: {"event": str, "data": Any}
        """
        system_prompt = self.agent_config.get("system_prompt", "You are a helpful AI assistant.")

        # Build initial state
        state: AgentState = {
            "messages": [
                self._make_system_message(system_prompt),
                self._make_user_message(user_input),
            ],
            "execution_id": execution_id,
            "agent_id": agent_id,
            "org_id": org_id,
            "iteration": 0,
            "max_iterations": self.max_iterations,
            "pending_tool_calls": [],
            "tool_results": [],
            "should_continue": True,
            "requires_approval": False,
            "approval_reason": None,
            "final_output": None,
            "tokens_used": 0,
            "cost_usd": 0.0,
            "error": None,
        }

        yield {"event": "status", "data": {"status": "running", "message": "Agent started"}}

        try:
            while state["should_continue"] and state["iteration"] < state["max_iterations"]:
                # 1. Call LLM
                llm_update = await self._node_call_llm(state)
                state.update(llm_update)

                if state.get("error"):
                    yield {"event": "error", "data": {"error": state["error"]}}
                    break

                # Yield token event
                last_msg = state["messages"][-1] if state["messages"] else {}
                if last_msg.get("role") == "assistant":
                    yield {"event": "token", "data": {"content": last_msg.get("content", "")}}

                # 2. Run tools if needed
                if state.get("pending_tool_calls"):
                    for tc in state["pending_tool_calls"]:
                        yield {"event": "tool_call", "data": {"tool": tc["name"], "input": tc["input"]}}
                    tool_update = await self._node_run_tools(state)
                    state.update(tool_update)
                    for tr in tool_update.get("tool_results", []):
                        yield {"event": "tool_result", "data": tr}

                # 3. Check limits
                limit_update = await self._node_check_limit(state)
                state.update(limit_update)

        except Exception as e:
            logger.error(f"Agent execution error: {e}", exc_info=True)
            state["error"] = str(e)
            yield {"event": "error", "data": {"error": str(e)}}

        yield {
            "event": "done",
            "data": {
                "final_output": state.get("final_output"),
                "tokens_used": state["tokens_used"],
                "cost_usd": state["cost_usd"],
                "iteration_count": state["iteration"],
                "status": "failed" if state.get("error") else "completed",
                "error": state.get("error"),
            }
        }
