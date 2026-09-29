"""Seed a store with a plausible week of data so the agent has something to work with."""

from __future__ import annotations

from datetime import date, timedelta

from .store import Store


def seed_demo(store: Store, today: date, currency: str = "EUR") -> dict[str, int]:
    d = lambda days: (today + timedelta(days=days)).isoformat()  # noqa: E731

    dana = store.add_customer("Dana Whitfield", "dana@example.com", "+44 7700 900101", "Prefers morning slots.")
    marco = store.add_customer("Marco Ferreira", "marco@example.com", "+44 7700 900102", "Landlord, 3 flats on Elm Street.")
    priya = store.add_customer("Priya Nair", None, "+44 7700 900103", "Found us via Google. No email.")
    oakline = store.add_customer("Oakline Cafe", "accounts@oakline.example", "+44 117 496 0100", "Pays by bank transfer, net 30.")

    store.add_task("Order replacement valve for Elm Street flat 2", due_date=d(-1), priority="high", customer_id=marco["id"])
    store.add_task("Send quote for bathroom refit", due_date=d(0), priority="high", customer_id=dana["id"])
    store.add_task("Renew van insurance", due_date=d(3))
    store.add_task("File Q3 VAT return", due_date=d(10), priority="high")
    done = store.add_task("Call supplier about back-ordered parts", due_date=d(-3))
    store.complete_task(done["id"])

    inv1 = store.create_invoice(oakline["id"], 48000, currency, "Kitchen drain repair", d(-30), d(-16))
    store.mark_invoice_sent(inv1["id"])  # will flip to overdue on refresh
    inv2 = store.create_invoice(marco["id"], 22000, currency, "Annual boiler service x2", d(-10), d(4))
    store.mark_invoice_sent(inv2["id"])
    store.create_invoice(dana["id"], 9500, currency, "Tap replacement, utility room", d(-1), d(13))  # draft
    inv4 = store.create_invoice(priya["id"], 15000, currency, "Emergency call-out", d(-20), d(-6))
    store.mark_invoice_sent(inv4["id"])
    store.mark_invoice_paid(inv4["id"], d(-2))

    store.add_appointment("Boiler service", f"{d(0)}T09:00", f"{d(0)}T10:30", marco["id"], "12 Elm Street, flat 1")
    store.add_appointment("Bathroom refit site visit", f"{d(0)}T14:00", f"{d(0)}T15:00", dana["id"], "4 Rosewood Close")
    store.add_appointment("Leak under sink", f"{d(1)}T08:30", f"{d(1)}T10:00", priya["id"], "22 Harbour Road")
    store.add_appointment("Quarterly maintenance", f"{d(4)}T11:00", f"{d(4)}T13:00", oakline["id"], "Oakline Cafe, High Street")

    store.refresh_overdue(today.isoformat())
    store.log_activity("demo.seeded", details={"today": today.isoformat()})
    return {"customers": 4, "tasks": 5, "invoices": 4, "appointments": 4}
