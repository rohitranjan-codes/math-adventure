"""Drive the real SDK tool runner against a scripted fake of ``beta.messages.parse``."""

from __future__ import annotations

from typing import Any

import anthropic
import pytest
from anthropic.types.beta import BetaMessage

from bizagent.agent import FALLBACK_BETA, WorkflowAgent
from bizagent.approvals import AutoApprove, DenyAll


def message(content: list[dict[str, Any]], stop_reason: str = "end_turn", **extra) -> BetaMessage:
    return BetaMessage.model_validate(
        {
            "id": "msg_test",
            "type": "message",
            "role": "assistant",
            "model": "claude-opus-5-5",
            "content": content,
            "stop_reason": stop_reason,
            "stop_sequence": None,
            "usage": {"input_tokens": 100, "output_tokens": 20, "cache_read_input_tokens": 50},
            **extra,
        }
    )


def tool_use(name: str, input: dict, id: str = "toolu_1") -> dict:
    return {"type": "tool_use", "id": id, "name": name, "input": input}


def text(t: str) -> dict:
    return {"type": "text", "text": t}


class ScriptedClient:
    """A real Anthropic client whose parse() is replaced by a script of canned replies."""

    def __init__(self, replies: list[BetaMessage]):
        self.client = anthropic.Anthropic(api_key="test-key")
        self.replies = list(replies)
        self.requests: list[dict] = []
        self.client.beta.messages.parse = self._parse  # type: ignore[method-assign]

    def _parse(self, **params):
        self.requests.append(params)
        if not self.replies:
            raise AssertionError("script exhausted: model was called more times than expected")
        return self.replies.pop(0)


@pytest.fixture
def make_agent(store, config):
    def _make(replies, approvals=None, events=None):
        scripted = ScriptedClient(replies)
        agent = WorkflowAgent(
            store,
            approvals or AutoApprove(),
            config=config,
            client=scripted.client,
            on_event=events.append if events is not None else None,
        )
        return agent, scripted

    return _make


def test_tool_round_trip_updates_store_and_transcript(make_agent, store):
    events: list[dict] = []
    agent, scripted = make_agent(
        [
            message([text("Adding that now."), tool_use("add_task", {"title": "Chase Dana", "due_date": "2026-10-02"})], "tool_use"),
            message([text("Done: task #1 'Chase Dana' due 2026-10-02.")]),
        ],
        events=events,
    )
    reply = agent.ask("Remind me to chase Dana on Friday")

    assert reply == "Done: task #1 'Chase Dana' due 2026-10-02."
    assert store.list_tasks()[0]["title"] == "Chase Dana"
    assert len(scripted.requests) == 2

    roles = [m["role"] for m in agent.messages]
    assert roles == ["user", "assistant", "user", "assistant"]
    assert agent.messages[0]["content"].startswith("[Today is Tuesday 2026-09-29, 09:15 UTC]\nRemind me")
    result = agent.messages[2]["content"][0]
    assert result["type"] == "tool_result" and result["tool_use_id"] == "toolu_1" and not result.get("is_error")
    assert '"title": "Chase Dana"' in result["content"]

    # The second request carried the tool result back to the model.
    second = scripted.requests[1]["messages"]
    assert second[2]["content"][0]["tool_use_id"] == "toolu_1"

    assert [e["type"] for e in events] == ["tool_call", "tool_result"]
    assert events[0]["name"] == "add_task"
    assert agent.usage["input_tokens"] == 200 and agent.usage["cache_read_input_tokens"] == 100


def test_request_shape(make_agent, config):
    agent, scripted = make_agent([message([text("Hi")])])
    agent.ask("hello")
    req = scripted.requests[0]
    assert req["model"] == "claude-opus-5-5"
    assert req["output_config"] == {"effort": "medium"}
    assert req["system"][0]["cache_control"] == {"type": "ephemeral"}
    assert "Riverside Plumbing" in req["system"][0]["text"]
    # betas travel as a header; fallbacks as a body param
    assert FALLBACK_BETA in req["extra_headers"]["anthropic-beta"]
    assert req["fallbacks"] == "default"
    assert isinstance(req["thinking"], anthropic.Omit)  # always on for this model; nothing to send
    names = [t["name"] for t in req["tools"]]
    assert "get_business_overview" in names and len(names) == len(set(names))


def test_fallbacks_can_be_disabled(store, config, make_agent):
    config.fallbacks = False
    agent, scripted = make_agent([message([text("Hi")])])
    agent.ask("hello")
    req = scripted.requests[0]
    assert FALLBACK_BETA not in req["extra_headers"].get("anthropic-beta", "")
    assert isinstance(req["fallbacks"], anthropic.Omit)


def test_declined_action_is_reported_not_retried(make_agent, store):
    store.add_customer("Dana", "d@example.com")
    inv = store.create_invoice(1, 10000, "GBP", "Work", "2026-09-29", "2026-10-13")
    agent, scripted = make_agent(
        [
            message([tool_use("send_invoice", {"invoice_id": inv["id"]})], "tool_use"),
            message([text("I didn't send it; you declined the approval.")]),
        ],
        approvals=DenyAll(),
    )
    reply = agent.ask("Send Dana her invoice")
    assert "declined" in reply
    assert store.get_invoice(1)["status"] == "draft"
    result = agent.messages[2]["content"][0]
    assert result["is_error"] is True and "owner declined" in result["content"]


def test_refusal_and_truncation_render_clearly(make_agent):
    agent, _ = make_agent(
        [message([], "refusal", stop_details={"type": "refusal", "category": "cyber", "explanation": "Not something I can do."})]
    )
    assert agent.ask("do something bad") == "I can't help with that request. Not something I can do."
    agent2, _ = make_agent([message([text("Here is a long")], "max_tokens")])
    assert agent2.ask("write a lot").endswith("(The reply was cut off at the token limit.)")


def test_tool_round_limit_is_reported(make_agent, config, store):
    config.max_tool_rounds = 1
    agent, scripted = make_agent(
        [
            message([tool_use("find_customers", {"query": "a"})], "tool_use"),
            message([tool_use("find_customers", {"query": "b"})], "tool_use"),  # never requested
        ]
    )
    reply = agent.ask("loop forever")
    assert "Stopped after 1 tool rounds" in reply
    assert len(scripted.requests) == 1


def test_multi_turn_keeps_history(make_agent):
    agent, scripted = make_agent([message([text("One")]), message([text("Two")])])
    agent.ask("first")
    agent.ask("second")
    assert [m["role"] for m in scripted.requests[1]["messages"]] == ["user", "assistant", "user"]
    agent.reset()
    assert agent.messages == []
