from __future__ import annotations
"""
AgentX AI — Tool Registry (Phase 2)

All tools available to agents. Each tool is a callable that takes
a string input and returns a string output. Agents see only the
tools that have been explicitly assigned to them.

Security: No unrestricted shell / filesystem access. Tools are
sandboxed and explicitly allowlisted per agent.
"""
from typing import Callable, Dict, Any
import json
import re


class ToolResult:
    def __init__(self, success: bool, output: str, metadata: Dict[str, Any] | None = None):
        self.success = success
        self.output = output
        self.metadata = metadata or {}

    def to_string(self) -> str:
        if self.success:
            return self.output
        return f"Tool error: {self.output}"


class AgentTool:
    def __init__(self, name: str, description: str, fn: Callable[[str], ToolResult], requires_approval: bool = False):
        self.name = name
        self.description = description
        self.fn = fn
        self.requires_approval = requires_approval

    def run(self, input_str: str) -> ToolResult:
        try:
            return self.fn(input_str)
        except Exception as e:
            return ToolResult(success=False, output=str(e))


# ── Built-in Tools ──────────────────────────────────────────────

def _calculator(expression: str) -> ToolResult:
    """Safe arithmetic evaluator (no exec/eval of arbitrary code)."""
    try:
        # Only allow digits, operators, parentheses, dots
        clean = re.sub(r"[^0-9+\-*/().\s]", "", expression)
        if not clean.strip():
            return ToolResult(False, "Empty expression")
        result = eval(clean, {"__builtins__": {}})  # noqa: S307 — restricted namespace
        return ToolResult(True, str(result))
    except Exception as e:
        return ToolResult(False, f"Calculation error: {e}")


def _json_formatter(text: str) -> ToolResult:
    """Parse and pretty-print JSON."""
    try:
        parsed = json.loads(text)
        return ToolResult(True, json.dumps(parsed, indent=2))
    except json.JSONDecodeError as e:
        return ToolResult(False, f"Invalid JSON: {e}")


def _word_counter(text: str) -> ToolResult:
    """Count words, characters and sentences."""
    words = len(text.split())
    chars = len(text)
    sentences = len(re.split(r"[.!?]+", text))
    return ToolResult(True, json.dumps({"words": words, "characters": chars, "sentences": sentences}))


def _text_summarizer_stub(text: str) -> ToolResult:
    """Stub — returns first 200 chars as summary. Real impl uses LLM in Phase 2."""
    summary = text[:200] + ("..." if len(text) > 200 else "")
    return ToolResult(True, summary)


# ── Registry ────────────────────────────────────────────────────

TOOL_REGISTRY: Dict[str, AgentTool] = {
    "calculator": AgentTool(
        name="calculator",
        description="Evaluate safe arithmetic expressions. Input: math expression string.",
        fn=_calculator,
    ),
    "json_formatter": AgentTool(
        name="json_formatter",
        description="Parse and pretty-print JSON text. Input: JSON string.",
        fn=_json_formatter,
    ),
    "word_counter": AgentTool(
        name="word_counter",
        description="Count words, characters, and sentences in text.",
        fn=_word_counter,
    ),
    "text_summarizer": AgentTool(
        name="text_summarizer",
        description="Summarize a block of text to its key points.",
        fn=_text_summarizer_stub,
    ),
}


def get_tool(name: str) -> AgentTool | None:
    return TOOL_REGISTRY.get(name)


def list_tools() -> list[dict]:
    return [
        {
            "name": t.name,
            "description": t.description,
            "requires_approval": t.requires_approval,
        }
        for t in TOOL_REGISTRY.values()
    ]
