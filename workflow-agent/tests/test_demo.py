from __future__ import annotations

from datetime import date

from bizagent.demo import seed_demo


def test_demo_data_fills_every_briefing_bucket(store):
    today = date(2026, 9, 29)
    counts = seed_demo(store, today, "GBP")
    assert counts == {"customers": 4, "tasks": 5, "invoices": 4, "appointments": 4}
    s = store.summary(today)
    assert [i["customer_name"] for i in s["overdue_invoices"]] == ["Oakline Cafe"]
    assert len(s["invoices_due_soon"]) == 1 and len(s["draft_invoices"]) == 1
    assert [t["title"] for t in s["overdue_tasks"]] == ["Order replacement valve for Elm Street flat 2"]
    assert [t["title"] for t in s["tasks_due_today"]] == ["Send quote for bathroom refit"]
    assert [t["title"] for t in s["tasks_due_this_week"]] == ["Renew van insurance"]
    assert len(s["appointments_today"]) == 2 and len(s["appointments_upcoming"]) == 2
    assert all(t["priority"] in ("low", "normal", "high") for t in store.list_tasks(status="all"))
