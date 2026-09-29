from __future__ import annotations

import json

import pytest
from anthropic.lib.tools import ToolError

from bizagent.approvals import AutoApprove, DenyAll
from bizagent.tools import build_tools


def by_name(tools):
    return {t.name: t for t in tools}


def call(tool, **kwargs):
    return json.loads(tool.call(kwargs))


def test_tool_schemas_are_well_formed(store, config):
    tools = by_name(build_tools(store, AutoApprove(), config))
    assert {"find_customers", "add_task", "create_invoice", "send_invoice", "schedule_appointment",
            "send_message", "get_business_overview"} <= set(tools)
    for name, tool in tools.items():
        d = tool.to_dict()
        assert d["name"] == name and d["description"].strip(), name
        assert d["input_schema"]["type"] == "object", name
    status_schema = tools["list_tasks"].to_dict()["input_schema"]["properties"]["status"]
    assert set(status_schema["enum"]) == {"open", "done", "all"}
    assert tools["add_task"].to_dict()["input_schema"]["required"] == ["title"]


def test_customer_and_task_flow(store, config):
    tools = by_name(build_tools(store, AutoApprove(), config))
    assert call(tools["find_customers"], query="dana") == []
    c = call(tools["add_customer"], name="Dana Whitfield", email="dana@example.com")
    t = call(tools["add_task"], title="Send quote", due_date="2026-10-02", priority="high", customer_id=c["id"])
    assert t["customer_name"] == "Dana Whitfield" and t["due_date"] == "2026-10-02"
    assert [x["id"] for x in call(tools["list_tasks"], status="open")] == [t["id"]]
    call(tools["complete_task"], task_id=t["id"])
    assert call(tools["list_tasks"]) == []
    actions = [e["action"] for e in store.recent_activity()]
    assert actions == ["task.completed", "task.added", "customer.added"]


def test_validation_errors_become_tool_errors(store, config):
    tools = by_name(build_tools(store, AutoApprove(), config))
    with pytest.raises(ToolError, match="ISO date"):
        tools["add_task"].call({"title": "x", "due_date": "next friday"})
    with pytest.raises(ToolError, match="no customer"):
        tools["add_task"].call({"title": "x", "customer_id": 42})
    with pytest.raises(ToolError, match="no task"):
        tools["complete_task"].call({"task_id": 7})
    # Schema validation from the SDK: a wrong type is rejected before the function runs.
    with pytest.raises(Exception):
        tools["complete_task"].call({"task_id": "seven"})


def test_invoice_defaults_and_send_requires_approval(store, config):
    approvals = DenyAll()
    tools = by_name(build_tools(store, approvals, config))
    c = call(tools["add_customer"], name="Oakline Cafe", email="accounts@oakline.example")
    inv = call(tools["create_invoice"], customer_id=c["id"], amount=480.5, description="Drain repair")
    assert inv["amount_cents"] == 48050 and inv["currency"] == "GBP"
    assert inv["issue_date"] == "2026-09-29" and inv["due_date"] == "2026-10-13" and inv["status"] == "draft"

    with pytest.raises(ToolError, match="owner declined"):
        tools["send_invoice"].call({"invoice_id": inv["id"]})
    assert store.get_invoice(inv["id"])["status"] == "draft"
    assert store.list_outbox() == []
    assert approvals.decisions[0][0] == "send_invoice"
    assert "accounts@oakline.example" in approvals.decisions[0][1]


def test_send_invoice_when_approved_queues_email_and_marks_sent(store, config):
    approvals = AutoApprove()
    tools = by_name(build_tools(store, approvals, config))
    c = call(tools["add_customer"], name="Oakline Cafe", email="accounts@oakline.example")
    inv = call(tools["create_invoice"], customer_id=c["id"], amount=480, description="Drain repair")
    out = call(tools["send_invoice"], invoice_id=inv["id"])
    assert out["invoice"]["status"] == "sent"
    msg = store.list_outbox()[0]
    assert msg["recipient"] == "accounts@oakline.example"
    assert msg["subject"] == "Invoice #1 from Riverside Plumbing"
    assert "480.00 GBP" in msg["body"] and "2026-10-13" in msg["body"]
    # Second send is a reminder
    out2 = call(tools["send_invoice"], invoice_id=inv["id"])
    assert store.list_outbox()[0]["subject"].startswith("Reminder:")
    call(tools["record_payment"], invoice_id=inv["id"])
    with pytest.raises(ToolError, match="already paid"):
        tools["send_invoice"].call({"invoice_id": inv["id"]})


def test_send_invoice_without_email_fails_before_asking(store, config):
    approvals = AutoApprove()
    tools = by_name(build_tools(store, approvals, config))
    c = call(tools["add_customer"], name="Priya Nair", phone="0770")
    inv = call(tools["create_invoice"], customer_id=c["id"], amount=150, description="Call-out")
    with pytest.raises(ToolError, match="no email"):
        tools["send_invoice"].call({"invoice_id": inv["id"]})
    assert approvals.decisions == []


def test_schedule_conflict_and_override(store, config):
    tools = by_name(build_tools(store, AutoApprove(), config))
    a = call(tools["schedule_appointment"], title="Boiler", starts_at="2026-09-30T09:00")
    assert a["ends_at"] == "2026-09-30T10:00"
    with pytest.raises(ToolError, match="overlaps"):
        tools["schedule_appointment"].call({"title": "Leak", "starts_at": "2026-09-30T09:30"})
    b = call(tools["schedule_appointment"], title="Leak", starts_at="2026-09-30T09:30", allow_conflict=True)
    assert b["id"] == 2
    today = call(tools["list_appointments"], start="2026-09-30", end="2026-09-30")
    assert [x["title"] for x in today] == ["Boiler", "Leak"]
    with pytest.raises(ToolError, match="ISO date-time"):
        tools["schedule_appointment"].call({"title": "x", "starts_at": "tomorrow 9am"})


def test_cancel_and_send_message_are_gated(store, config):
    approvals = DenyAll()
    tools = by_name(build_tools(store, approvals, config))
    c = call(tools["add_customer"], name="Dana", email="d@example.com")
    a = call(tools["schedule_appointment"], title="Visit", starts_at="2026-09-30T09:00", customer_id=c["id"])
    with pytest.raises(ToolError, match="owner declined"):
        tools["cancel_appointment"].call({"appointment_id": a["id"], "reason": "sick"})
    assert store.get_appointment(a["id"])["status"] == "scheduled"
    with pytest.raises(ToolError, match="owner declined"):
        tools["send_message"].call({"customer_id": c["id"], "body": "See you tomorrow"})
    with pytest.raises(ToolError, match="no phone number"):
        tools["send_message"].call({"customer_id": c["id"], "body": "hi", "channel": "sms"})
    assert [d[0] for d in approvals.decisions] == ["cancel_appointment", "send_message"]


def test_overview_tool_matches_store_summary(store, config):
    tools = by_name(build_tools(store, AutoApprove(), config))
    c = call(tools["add_customer"], name="Dana", email="d@example.com")
    call(tools["add_task"], title="Today", due_date="2026-09-29")
    overview = call(tools["get_business_overview"])
    assert overview["today"] == "2026-09-29"
    assert [t["title"] for t in overview["tasks_due_today"]] == ["Today"]
