"""The agent loop: one WorkflowAgent per conversation, driven by the SDK tool runner."""

from __future__ import annotations

from typing import Any, Callable

import anthropic

from .approvals import ApprovalPolicy
from .config import Config
from .prompts import BRIEFING_REQUEST, build_system_prompt
from .store import Store
from .tools import build_tools

EventHandler = Callable[[dict[str, Any]], None]

FALLBACK_BETA = "server-side-fallback-2026-07-01"


class WorkflowAgent:
    """Stateful conversation with the business assistant.

    ``ask`` sends one owner message, lets the model call tools until it has an
    answer, and returns the reply text. The full transcript (including tool
    calls and results) is kept in ``messages`` so follow-ups have context.
    """

    def __init__(
        self,
        store: Store,
        approvals: ApprovalPolicy,
        config: Config | None = None,
        client: anthropic.Anthropic | None = None,
        on_event: EventHandler | None = None,
    ) -> None:
        self.config = config or Config.from_env()
        self.store = store
        self.client = client or anthropic.Anthropic()
        self.tools = build_tools(store, approvals, self.config)
        self.system = build_system_prompt(self.config)
        self.messages: list[dict[str, Any]] = []
        self.on_event: EventHandler = on_event or (lambda event: None)
        self.usage: dict[str, int] = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_input_tokens": 0,
            "cache_creation_input_tokens": 0,
        }
        self.last_stop_reason: str | None = None

    # ----------------------------------------------------------------- public
    def ask(self, text: str) -> str:
        """Send one owner message and return the assistant's final reply."""
        self.store.refresh_overdue(self.config.today().isoformat())
        self.messages.append({"role": "user", "content": self._stamp(text)})

        runner = self.client.beta.messages.tool_runner(**self._request_params())
        last = None
        for message in runner:
            last = message
            self._track_usage(message)
            self.messages.append({"role": "assistant", "content": message.content})
            for block in message.content:
                if block.type == "tool_use":
                    self.on_event({"type": "tool_call", "name": block.name, "input": block.input})
            if message.stop_reason != "tool_use":
                continue
            # Runs the tools now (cached, so the runner does not run them again)
            # and mirrors the results into our own transcript.
            response = runner.generate_tool_call_response()
            if response is None:
                continue
            self.messages.append(response)
            for result in response["content"]:
                self.on_event(
                    {
                        "type": "tool_result",
                        "tool_use_id": result["tool_use_id"],
                        "is_error": bool(result.get("is_error")),
                        "content": result["content"],
                    }
                )

        if last is None:
            return "No response received."
        self.last_stop_reason = last.stop_reason
        return self._render(last)

    def briefing(self) -> str:
        """The morning briefing: what needs attention today and this week."""
        return self.ask(BRIEFING_REQUEST)

    def reset(self) -> None:
        self.messages.clear()

    # ---------------------------------------------------------------- private
    def _request_params(self) -> dict[str, Any]:
        params: dict[str, Any] = {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "system": [{"type": "text", "text": self.system, "cache_control": {"type": "ephemeral"}}],
            "tools": self.tools,
            "messages": self.messages,
            "output_config": {"effort": self.config.effort},
            "max_iterations": self.config.max_tool_rounds,
            "cache_control": {"type": "ephemeral"},
        }
        if self.config.fallbacks:
            # If a safety classifier declines a turn, the API re-runs it on a
            # fallback model inside the same call instead of returning a refusal.
            params["betas"] = [FALLBACK_BETA]
            params["fallbacks"] = "default"
        return params

    def _stamp(self, text: str) -> str:
        now = self.config.now()
        return f"[Today is {now:%A %Y-%m-%d}, {now:%H:%M} {self.config.timezone}]\n{text}"

    def _track_usage(self, message: Any) -> None:
        usage = getattr(message, "usage", None)
        if usage is None:
            return
        for key in self.usage:
            self.usage[key] += int(getattr(usage, key, 0) or 0)

    @staticmethod
    def _text_of(message: Any) -> str:
        return "\n".join(block.text for block in message.content if block.type == "text").strip()

    def _render(self, message: Any) -> str:
        text = self._text_of(message)
        reason = message.stop_reason
        if reason == "refusal":
            details = getattr(message, "stop_details", None)
            explanation = getattr(details, "explanation", None) if details else None
            return text or f"I can't help with that request.{' ' + explanation if explanation else ''}"
        if reason == "max_tokens":
            return (text + "\n\n" if text else "") + "(The reply was cut off at the token limit.)"
        if reason == "tool_use":
            return (text + "\n\n" if text else "") + (
                f"(Stopped after {self.config.max_tool_rounds} tool rounds without finishing. "
                "Ask me to continue, or narrow the request.)"
            )
        return text or "(Done, nothing further to report.)"
