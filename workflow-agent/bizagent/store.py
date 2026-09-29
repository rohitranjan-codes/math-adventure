"""SQLite-backed store for the records the agent manages.

Plain ``sqlite3`` from the standard library: one file, no ORM, inspectable with
any SQLite browser. All timestamps are timezone-naive ISO-8601 strings in the
business's local time (``YYYY-MM-DD`` for dates, ``YYYY-MM-DDTHH:MM`` for
times), which keeps string comparison in SQL correct.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Callable, Iterable

SCHEMA = """
CREATE TABLE IF NOT EXISTS customers (
    id          INTEGER PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    notes       TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY,
    title        TEXT NOT NULL,
    details      TEXT NOT NULL DEFAULT '',
    due_date     TEXT,
    priority     TEXT NOT NULL DEFAULT 'normal',
    status       TEXT NOT NULL DEFAULT 'open',
    customer_id  INTEGER REFERENCES customers(id),
    created_at   TEXT NOT NULL,
    completed_at TEXT
);
CREATE TABLE IF NOT EXISTS invoices (
    id           INTEGER PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES customers(id),
    amount_cents INTEGER NOT NULL,
    currency     TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    issue_date   TEXT NOT NULL,
    due_date     TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'draft',
    sent_at      TEXT,
    paid_at      TEXT
);
CREATE TABLE IF NOT EXISTS appointments (
    id           INTEGER PRIMARY KEY,
    customer_id  INTEGER REFERENCES customers(id),
    title        TEXT NOT NULL,
    starts_at    TEXT NOT NULL,
    ends_at      TEXT NOT NULL,
    location     TEXT NOT NULL DEFAULT '',
    notes        TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'scheduled'
);
CREATE TABLE IF NOT EXISTS outbox (
    id                 INTEGER PRIMARY KEY,
    customer_id        INTEGER REFERENCES customers(id),
    channel            TEXT NOT NULL,
    recipient          TEXT NOT NULL,
    subject            TEXT,
    body               TEXT NOT NULL,
    status             TEXT NOT NULL DEFAULT 'queued',
    related_invoice_id INTEGER REFERENCES invoices(id),
    created_at         TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activity_log (
    id        INTEGER PRIMARY KEY,
    ts        TEXT NOT NULL,
    action    TEXT NOT NULL,
    entity    TEXT,
    entity_id INTEGER,
    details   TEXT
);
"""

TASK_STATUSES = ("open", "done")
TASK_PRIORITIES = ("low", "normal", "high")
INVOICE_STATUSES = ("draft", "sent", "overdue", "paid")
APPOINTMENT_STATUSES = ("scheduled", "completed", "cancelled")

_PRIORITY_ORDER = "CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END"


class NotFound(LookupError):
    pass


class Ambiguous(LookupError):
    pass


def fmt_money(cents: int, currency: str) -> str:
    return f"{cents / 100:,.2f} {currency}"


class Store:
    def __init__(self, path: str | Path = ":memory:", *, clock: Callable[[], datetime] | None = None):
        self.path = str(path)
        self._conn = sqlite3.connect(self.path)
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("PRAGMA foreign_keys = ON")
        self._conn.executescript(SCHEMA)
        self._clock = clock or datetime.now

    def close(self) -> None:
        self._conn.close()

    # ------------------------------------------------------------------ helpers
    def _now(self) -> str:
        return self._clock().replace(tzinfo=None).isoformat(timespec="minutes")

    def _today(self) -> str:
        return self._clock().date().isoformat()

    def _one(self, sql: str, params: Iterable[Any] = ()) -> dict | None:
        row = self._conn.execute(sql, tuple(params)).fetchone()
        return dict(row) if row else None

    def _all(self, sql: str, params: Iterable[Any] = ()) -> list[dict]:
        return [dict(r) for r in self._conn.execute(sql, tuple(params)).fetchall()]

    def _write(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
        cur = self._conn.execute(sql, tuple(params))
        self._conn.commit()
        return cur

    # ---------------------------------------------------------------- customers
    def add_customer(self, name: str, email: str | None = None, phone: str | None = None, notes: str = "") -> dict:
        name = name.strip()
        if not name:
            raise ValueError("customer name is required")
        cur = self._write(
            "INSERT INTO customers (name, email, phone, notes, created_at) VALUES (?, ?, ?, ?, ?)",
            (name, email or None, phone or None, notes or "", self._now()),
        )
        return self.get_customer(cur.lastrowid)

    def get_customer(self, customer_id: int) -> dict:
        row = self._one("SELECT * FROM customers WHERE id = ?", (customer_id,))
        if row is None:
            raise NotFound(f"no customer with id {customer_id}")
        return row

    def update_customer(self, customer_id: int, **fields: Any) -> dict:
        allowed = {"name", "email", "phone", "notes"}
        changes = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if changes:
            sets = ", ".join(f"{k} = ?" for k in changes)
            self.get_customer(customer_id)
            self._write(f"UPDATE customers SET {sets} WHERE id = ?", (*changes.values(), customer_id))
        return self.get_customer(customer_id)

    def append_customer_note(self, customer_id: int, note: str) -> dict:
        current = self.get_customer(customer_id)["notes"]
        stamped = f"[{self._today()}] {note.strip()}"
        notes = f"{current}\n{stamped}".strip() if current else stamped
        return self.update_customer(customer_id, notes=notes)

    def find_customers(self, query: str = "") -> list[dict]:
        q = f"%{query.strip()}%"
        return self._all(
            "SELECT * FROM customers WHERE name LIKE ? OR IFNULL(email,'') LIKE ? OR IFNULL(phone,'') LIKE ? "
            "ORDER BY name",
            (q, q, q),
        )

    def resolve_customer(self, ref: int | str) -> dict:
        """Accept an id or a name; raise NotFound / Ambiguous instead of guessing."""
        if isinstance(ref, int) or (isinstance(ref, str) and ref.strip().isdigit()):
            return self.get_customer(int(ref))
        matches = self.find_customers(str(ref))
        exact = [m for m in matches if m["name"].lower() == str(ref).strip().lower()]
        if len(exact) == 1:
            return exact[0]
        if len(matches) == 1:
            return matches[0]
        if not matches:
            raise NotFound(f"no customer matching {ref!r}")
        names = ", ".join(f"{m['name']} (id {m['id']})" for m in matches)
        raise Ambiguous(f"{ref!r} matches several customers: {names}")

    # -------------------------------------------------------------------- tasks
    _TASK_SELECT = (
        "SELECT t.*, c.name AS customer_name FROM tasks t LEFT JOIN customers c ON c.id = t.customer_id"
    )

    def add_task(
        self,
        title: str,
        details: str = "",
        due_date: str | None = None,
        priority: str = "normal",
        customer_id: int | None = None,
    ) -> dict:
        if not title.strip():
            raise ValueError("task title is required")
        if priority not in TASK_PRIORITIES:
            raise ValueError(f"priority must be one of {TASK_PRIORITIES}")
        if customer_id is not None:
            self.get_customer(customer_id)
        cur = self._write(
            "INSERT INTO tasks (title, details, due_date, priority, customer_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (title.strip(), details or "", due_date, priority, customer_id, self._now()),
        )
        return self.get_task(cur.lastrowid)

    def get_task(self, task_id: int) -> dict:
        row = self._one(f"{self._TASK_SELECT} WHERE t.id = ?", (task_id,))
        if row is None:
            raise NotFound(f"no task with id {task_id}")
        return row

    def update_task(self, task_id: int, **fields: Any) -> dict:
        allowed = {"title", "details", "due_date", "priority", "status", "customer_id"}
        changes = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if "priority" in changes and changes["priority"] not in TASK_PRIORITIES:
            raise ValueError(f"priority must be one of {TASK_PRIORITIES}")
        if "status" in changes:
            if changes["status"] not in TASK_STATUSES:
                raise ValueError(f"status must be one of {TASK_STATUSES}")
            changes["completed_at"] = self._now() if changes["status"] == "done" else None
        self.get_task(task_id)
        if changes:
            sets = ", ".join(f"{k} = ?" for k in changes)
            self._write(f"UPDATE tasks SET {sets} WHERE id = ?", (*changes.values(), task_id))
        return self.get_task(task_id)

    def complete_task(self, task_id: int) -> dict:
        return self.update_task(task_id, status="done")

    def list_tasks(
        self,
        status: str | None = "open",
        due_before: str | None = None,
        customer_id: int | None = None,
        limit: int = 100,
    ) -> list[dict]:
        where, params = [], []
        if status and status != "all":
            where.append("t.status = ?")
            params.append(status)
        if due_before:
            where.append("t.due_date IS NOT NULL AND t.due_date <= ?")
            params.append(due_before)
        if customer_id is not None:
            where.append("t.customer_id = ?")
            params.append(customer_id)
        clause = f" WHERE {' AND '.join(where)}" if where else ""
        return self._all(
            f"{self._TASK_SELECT}{clause} ORDER BY t.due_date IS NULL, t.due_date, {_PRIORITY_ORDER}, t.id LIMIT ?",
            (*params, limit),
        )

    # ----------------------------------------------------------------- invoices
    _INVOICE_SELECT = (
        "SELECT i.*, c.name AS customer_name, c.email AS customer_email "
        "FROM invoices i JOIN customers c ON c.id = i.customer_id"
    )

    @staticmethod
    def _decorate_invoice(row: dict) -> dict:
        row["amount"] = fmt_money(row["amount_cents"], row["currency"])
        return row

    def create_invoice(
        self,
        customer_id: int,
        amount_cents: int,
        currency: str,
        description: str,
        issue_date: str,
        due_date: str,
    ) -> dict:
        if amount_cents <= 0:
            raise ValueError("invoice amount must be positive")
        if due_date < issue_date:
            raise ValueError("due_date cannot be before issue_date")
        self.get_customer(customer_id)
        cur = self._write(
            "INSERT INTO invoices (customer_id, amount_cents, currency, description, issue_date, due_date) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (customer_id, int(amount_cents), currency.upper(), description or "", issue_date, due_date),
        )
        return self.get_invoice(cur.lastrowid)

    def get_invoice(self, invoice_id: int) -> dict:
        row = self._one(f"{self._INVOICE_SELECT} WHERE i.id = ?", (invoice_id,))
        if row is None:
            raise NotFound(f"no invoice with id {invoice_id}")
        return self._decorate_invoice(row)

    def list_invoices(self, status: str | None = None, customer_id: int | None = None, limit: int = 100) -> list[dict]:
        where, params = [], []
        if status and status != "all":
            if status == "unpaid":
                where.append("i.status IN ('sent', 'overdue')")
            else:
                where.append("i.status = ?")
                params.append(status)
        if customer_id is not None:
            where.append("i.customer_id = ?")
            params.append(customer_id)
        clause = f" WHERE {' AND '.join(where)}" if where else ""
        rows = self._all(f"{self._INVOICE_SELECT}{clause} ORDER BY i.due_date, i.id LIMIT ?", (*params, limit))
        return [self._decorate_invoice(r) for r in rows]

    def mark_invoice_sent(self, invoice_id: int) -> dict:
        inv = self.get_invoice(invoice_id)
        if inv["status"] == "paid":
            raise ValueError(f"invoice {invoice_id} is already paid")
        status = "overdue" if inv["due_date"] < self._today() else "sent"
        self._write("UPDATE invoices SET status = ?, sent_at = ? WHERE id = ?", (status, self._now(), invoice_id))
        return self.get_invoice(invoice_id)

    def mark_invoice_paid(self, invoice_id: int, paid_on: str | None = None) -> dict:
        inv = self.get_invoice(invoice_id)
        if inv["status"] == "paid":
            raise ValueError(f"invoice {invoice_id} is already paid")
        self._write(
            "UPDATE invoices SET status = 'paid', paid_at = ? WHERE id = ?",
            (paid_on or self._today(), invoice_id),
        )
        return self.get_invoice(invoice_id)

    def refresh_overdue(self, today: str | None = None) -> int:
        """Flip 'sent' invoices past their due date to 'overdue'. Returns how many changed."""
        today = today or self._today()
        cur = self._write("UPDATE invoices SET status = 'overdue' WHERE status = 'sent' AND due_date < ?", (today,))
        return cur.rowcount

    # ------------------------------------------------------------- appointments
    _APPT_SELECT = (
        "SELECT a.*, c.name AS customer_name FROM appointments a LEFT JOIN customers c ON c.id = a.customer_id"
    )

    def add_appointment(
        self,
        title: str,
        starts_at: str,
        ends_at: str,
        customer_id: int | None = None,
        location: str = "",
        notes: str = "",
    ) -> dict:
        if not title.strip():
            raise ValueError("appointment title is required")
        if ends_at <= starts_at:
            raise ValueError("ends_at must be after starts_at")
        if customer_id is not None:
            self.get_customer(customer_id)
        cur = self._write(
            "INSERT INTO appointments (customer_id, title, starts_at, ends_at, location, notes) VALUES (?, ?, ?, ?, ?, ?)",
            (customer_id, title.strip(), starts_at, ends_at, location or "", notes or ""),
        )
        return self.get_appointment(cur.lastrowid)

    def get_appointment(self, appointment_id: int) -> dict:
        row = self._one(f"{self._APPT_SELECT} WHERE a.id = ?", (appointment_id,))
        if row is None:
            raise NotFound(f"no appointment with id {appointment_id}")
        return row

    def find_conflicts(self, starts_at: str, ends_at: str, exclude_id: int | None = None) -> list[dict]:
        params: list[Any] = [ends_at, starts_at]
        extra = ""
        if exclude_id is not None:
            extra = " AND a.id != ?"
            params.append(exclude_id)
        return self._all(
            f"{self._APPT_SELECT} WHERE a.status = 'scheduled' AND a.starts_at < ? AND a.ends_at > ?{extra} "
            "ORDER BY a.starts_at",
            params,
        )

    def list_appointments(
        self,
        start: str | None = None,
        end: str | None = None,
        customer_id: int | None = None,
        status: str | None = "scheduled",
        limit: int = 100,
    ) -> list[dict]:
        where, params = [], []
        if status and status != "all":
            where.append("a.status = ?")
            params.append(status)
        if start:
            where.append("a.ends_at >= ?")
            params.append(start)
        if end:
            where.append("a.starts_at <= ?")
            params.append(end)
        if customer_id is not None:
            where.append("a.customer_id = ?")
            params.append(customer_id)
        clause = f" WHERE {' AND '.join(where)}" if where else ""
        return self._all(f"{self._APPT_SELECT}{clause} ORDER BY a.starts_at LIMIT ?", (*params, limit))

    def set_appointment_status(self, appointment_id: int, status: str) -> dict:
        if status not in APPOINTMENT_STATUSES:
            raise ValueError(f"status must be one of {APPOINTMENT_STATUSES}")
        self.get_appointment(appointment_id)
        self._write("UPDATE appointments SET status = ? WHERE id = ?", (status, appointment_id))
        return self.get_appointment(appointment_id)

    def cancel_appointment(self, appointment_id: int) -> dict:
        return self.set_appointment_status(appointment_id, "cancelled")

    # ------------------------------------------------------------------- outbox
    def queue_message(
        self,
        channel: str,
        recipient: str,
        body: str,
        subject: str | None = None,
        customer_id: int | None = None,
        related_invoice_id: int | None = None,
    ) -> dict:
        if channel not in ("email", "sms"):
            raise ValueError("channel must be 'email' or 'sms'")
        if not recipient.strip() or not body.strip():
            raise ValueError("recipient and body are required")
        cur = self._write(
            "INSERT INTO outbox (customer_id, channel, recipient, subject, body, related_invoice_id, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (customer_id, channel, recipient.strip(), subject, body.strip(), related_invoice_id, self._now()),
        )
        row = self._one("SELECT * FROM outbox WHERE id = ?", (cur.lastrowid,))
        assert row is not None
        return row

    def list_outbox(self, status: str | None = None, limit: int = 100) -> list[dict]:
        if status:
            return self._all("SELECT * FROM outbox WHERE status = ? ORDER BY id DESC LIMIT ?", (status, limit))
        return self._all("SELECT * FROM outbox ORDER BY id DESC LIMIT ?", (limit,))

    def mark_outbox_status(self, message_id: int, status: str) -> None:
        self._write("UPDATE outbox SET status = ? WHERE id = ?", (status, message_id))

    # ----------------------------------------------------------------- activity
    def log_activity(self, action: str, entity: str | None = None, entity_id: int | None = None, details: Any = None) -> None:
        payload = None if details is None else (details if isinstance(details, str) else json.dumps(details, default=str))
        self._write(
            "INSERT INTO activity_log (ts, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)",
            (self._now(), action, entity, entity_id, payload),
        )

    def recent_activity(self, limit: int = 20) -> list[dict]:
        return self._all("SELECT * FROM activity_log ORDER BY id DESC LIMIT ?", (limit,))

    # ------------------------------------------------------------------ summary
    def summary(self, today: date | None = None, horizon_days: int = 7) -> dict:
        """Everything a morning briefing needs, in one query batch."""
        today_s = (today or self._clock().date()).isoformat()
        horizon = ((today or self._clock().date()) + timedelta(days=horizon_days)).isoformat()
        self.refresh_overdue(today_s)
        day_start, day_end = f"{today_s}T00:00", f"{today_s}T23:59"
        return {
            "today": today_s,
            "overdue_invoices": self.list_invoices(status="overdue"),
            "invoices_due_soon": [
                i for i in self.list_invoices(status="sent") if today_s <= i["due_date"] <= horizon
            ],
            "draft_invoices": self.list_invoices(status="draft"),
            "overdue_tasks": [t for t in self.list_tasks(status="open", due_before=today_s) if t["due_date"] < today_s],
            "tasks_due_today": [t for t in self.list_tasks(status="open", due_before=today_s) if t["due_date"] == today_s],
            "tasks_due_this_week": [
                t for t in self.list_tasks(status="open", due_before=horizon) if today_s < t["due_date"] <= horizon
            ],
            "appointments_today": self.list_appointments(start=day_start, end=day_end),
            "appointments_upcoming": [
                a for a in self.list_appointments(start=f"{today_s}T23:59", end=f"{horizon}T23:59")
                if a["starts_at"] > day_end
            ],
            "queued_messages": len(self.list_outbox(status="queued")),
        }
