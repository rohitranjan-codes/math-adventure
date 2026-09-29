from __future__ import annotations

from datetime import date

import pytest

from bizagent.store import Ambiguous, NotFound, Store


def test_customers_roundtrip(store: Store):
    c = store.add_customer("Dana Whitfield", "dana@example.com", "0770 000")
    assert c["id"] == 1 and c["created_at"] == "2026-09-29T09:15"
    assert store.find_customers("whit")[0]["name"] == "Dana Whitfield"
    assert store.find_customers("dana@")[0]["id"] == 1
    store.append_customer_note(1, "Prefers mornings")
    store.append_customer_note(1, "Has a dog")
    assert store.get_customer(1)["notes"] == "[2026-09-29] Prefers mornings\n[2026-09-29] Has a dog"
    with pytest.raises(NotFound):
        store.get_customer(99)


def test_resolve_customer_by_id_name_and_ambiguity(store: Store):
    store.add_customer("Sam Lee")
    store.add_customer("Sam Lee-Jones")
    assert store.resolve_customer("1")["name"] == "Sam Lee"
    assert store.resolve_customer("sam lee")["name"] == "Sam Lee"  # exact wins over prefix
    assert store.resolve_customer("Lee-Jones")["id"] == 2
    with pytest.raises(Ambiguous):
        store.resolve_customer("Sam")
    with pytest.raises(NotFound):
        store.resolve_customer("Nobody")


def test_tasks_ordering_and_completion(store: Store):
    c = store.add_customer("Marco")
    store.add_task("later", due_date="2026-10-05")
    store.add_task("no date", priority="high")
    store.add_task("soon high", due_date="2026-09-30", priority="high", customer_id=c["id"])
    store.add_task("soon low", due_date="2026-09-30", priority="low")
    titles = [t["title"] for t in store.list_tasks()]
    assert titles == ["soon high", "soon low", "later", "no date"]
    assert store.list_tasks(customer_id=c["id"])[0]["customer_name"] == "Marco"
    assert [t["title"] for t in store.list_tasks(due_before="2026-09-30")] == ["soon high", "soon low"]

    done = store.complete_task(1)
    assert done["status"] == "done" and done["completed_at"] == "2026-09-29T09:15"
    assert len(store.list_tasks()) == 3 and len(store.list_tasks(status="all")) == 4
    with pytest.raises(ValueError):
        store.add_task("bad", priority="urgent")


def test_invoice_lifecycle_and_overdue(store: Store):
    c = store.add_customer("Oakline Cafe", "accounts@oakline.example")
    inv = store.create_invoice(c["id"], 48000, "gbp", "Drain repair", "2026-08-30", "2026-09-13")
    assert inv["status"] == "draft" and inv["amount"] == "480.00 GBP" and inv["currency"] == "GBP"
    assert store.list_invoices(status="unpaid") == []

    sent = store.mark_invoice_sent(inv["id"])
    assert sent["status"] == "overdue"  # due date already passed
    future = store.create_invoice(c["id"], 1000, "GBP", "x", "2026-09-29", "2026-10-13")
    assert store.mark_invoice_sent(future["id"])["status"] == "sent"
    assert [i["id"] for i in store.list_invoices(status="unpaid")] == [1, 2]

    assert store.refresh_overdue("2026-10-14") == 1
    assert store.get_invoice(2)["status"] == "overdue"

    paid = store.mark_invoice_paid(1, "2026-09-28")
    assert paid["status"] == "paid" and paid["paid_at"] == "2026-09-28"
    with pytest.raises(ValueError):
        store.mark_invoice_paid(1)
    with pytest.raises(ValueError):
        store.create_invoice(c["id"], 0, "GBP", "free", "2026-09-29", "2026-09-29")
    with pytest.raises(ValueError):
        store.create_invoice(c["id"], 100, "GBP", "x", "2026-09-29", "2026-09-01")


def test_appointments_conflicts_and_ranges(store: Store):
    a = store.add_appointment("Boiler", "2026-09-29T09:00", "2026-09-29T10:30")
    assert store.find_conflicts("2026-09-29T10:00", "2026-09-29T11:00") == [store.get_appointment(a["id"])]
    assert store.find_conflicts("2026-09-29T10:30", "2026-09-29T11:00") == []  # back-to-back is fine
    assert store.find_conflicts("2026-09-29T08:00", "2026-09-29T09:00") == []
    store.cancel_appointment(a["id"])
    assert store.find_conflicts("2026-09-29T09:00", "2026-09-29T10:00") == []  # cancelled slots free up

    store.add_appointment("Tomorrow", "2026-09-30T08:30", "2026-09-30T10:00")
    store.add_appointment("Next month", "2026-10-20T08:30", "2026-10-20T10:00")
    week = store.list_appointments(start="2026-09-29T00:00", end="2026-10-06T23:59")
    assert [x["title"] for x in week] == ["Tomorrow"]
    with pytest.raises(ValueError):
        store.add_appointment("bad", "2026-09-29T10:00", "2026-09-29T09:00")


def test_outbox_and_activity(store: Store):
    m = store.queue_message("email", "a@b.c", "Hello", subject="Hi")
    assert m["status"] == "queued"
    store.mark_outbox_status(m["id"], "sent")
    assert store.list_outbox(status="queued") == []
    with pytest.raises(ValueError):
        store.queue_message("fax", "x", "y")
    store.log_activity("task.added", "task", 1, {"title": "t"})
    entry = store.recent_activity(1)[0]
    assert entry["action"] == "task.added" and '"title": "t"' in entry["details"]


def test_summary_buckets(store: Store):
    c = store.add_customer("Dana", "d@example.com")
    today = date(2026, 9, 29)
    overdue = store.create_invoice(c["id"], 100, "GBP", "old", "2026-09-01", "2026-09-15")
    store.mark_invoice_sent(overdue["id"])
    soon = store.create_invoice(c["id"], 100, "GBP", "soon", "2026-09-20", "2026-10-03")
    store.mark_invoice_sent(soon["id"])
    store.create_invoice(c["id"], 100, "GBP", "draft", "2026-09-29", "2026-10-13")
    store.add_task("overdue task", due_date="2026-09-28")
    store.add_task("today task", due_date="2026-09-29")
    store.add_task("week task", due_date="2026-10-02")
    store.add_task("far task", due_date="2026-11-02")
    store.add_appointment("today appt", "2026-09-29T14:00", "2026-09-29T15:00")
    store.add_appointment("week appt", "2026-10-01T14:00", "2026-10-01T15:00")
    store.add_appointment("far appt", "2026-10-21T14:00", "2026-10-21T15:00")
    store.queue_message("email", "d@example.com", "hi")

    s = store.summary(today)
    assert [i["description"] for i in s["overdue_invoices"]] == ["old"]
    assert [i["description"] for i in s["invoices_due_soon"]] == ["soon"]
    assert [i["description"] for i in s["draft_invoices"]] == ["draft"]
    assert [t["title"] for t in s["overdue_tasks"]] == ["overdue task"]
    assert [t["title"] for t in s["tasks_due_today"]] == ["today task"]
    assert [t["title"] for t in s["tasks_due_this_week"]] == ["week task"]
    assert [a["title"] for a in s["appointments_today"]] == ["today appt"]
    assert [a["title"] for a in s["appointments_upcoming"]] == ["week appt"]
    assert s["queued_messages"] == 1
