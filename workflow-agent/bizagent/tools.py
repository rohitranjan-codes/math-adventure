"""Tools the agent can call. Each one is a thin, validated wrapper over the Store.

Design rules:
* Read tools are free to call. Write tools log to the activity table.
* Anything outbound or hard to undo (sending to a customer, cancelling an
  appointment) asks the ApprovalPolicy first and fails loudly if declined.
* Tools never guess: unknown customers, ambiguous names, bad dates and
  calendar conflicts come back as tool errors the model has to resolve with
  the owner.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from typing import Any, Literal

from anthropic import beta_tool
from anthropic.lib.tools import ToolError

from .approvals import ApprovalPolicy
from .config import Config
from .store import Ambiguous, NotFound, Store, fmt_money


def _json(data: Any) -> str:
    return json.dumps(data, indent=1, default=str, ensure_ascii=False)


def _parse_date(value: str, field: str) -> str:
    try:
        return date.fromisoformat(value.strip()).isoformat()
    except (ValueError, AttributeError):
        raise ToolError(f"{field} must be an ISO date like 2026-03-14, got {value!r}") from None


def _parse_datetime(value: str, field: str) -> str:
    try:
        return datetime.fromisoformat(value.strip()).replace(second=0, microsecond=0).isoformat(timespec="minutes")
    except (ValueError, AttributeError):
        raise ToolError(f"{field} must be an ISO date-time like 2026-03-14T09:30, got {value!r}") from None


def build_tools(store: Store, approvals: ApprovalPolicy, config: Config) -> list:
    """Return the tool list for one agent, bound to one store and one approval policy."""

    def customer(ref: int | str) -> dict:
        try:
            return store.resolve_customer(ref)
        except (NotFound, Ambiguous) as exc:
            raise ToolError(str(exc)) from None

    def gate(action: str, summary: str) -> None:
        if not approvals.approve(action, summary):
            raise ToolError(
                f"The owner declined: {summary}. Do not retry this action; tell them it was not done "
                "and ask whether they want something different."
            )

    # ---------------------------------------------------------------- customers
    @beta_tool
    def find_customers(query: str = "") -> str:
        """Search customers by name, email or phone. Call this first whenever the user names a customer, before creating one (to avoid duplicates) and before any tool that needs a customer_id.

        Args:
            query: Part of a name, email or phone number. Empty string lists everyone.
        """
        return _json(store.find_customers(query))

    @beta_tool
    def add_customer(name: str, email: str | None = None, phone: str | None = None, notes: str = "") -> str:
        """Create a customer record. Only call after find_customers shows no existing match.

        Args:
            name: Full name or business name.
            email: Email address, if known.
            phone: Phone number, if known.
            notes: Anything worth remembering (preferences, access instructions, how they found us).
        """
        try:
            row = store.add_customer(name, email, phone, notes)
        except ValueError as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("customer.added", "customer", row["id"], {"name": row["name"]})
        return _json(row)

    @beta_tool
    def update_customer(
        customer_id: int, name: str | None = None, email: str | None = None, phone: str | None = None
    ) -> str:
        """Change a customer's contact details. Use add_customer_note for free-text history instead.

        Args:
            customer_id: The customer's id from find_customers.
            name: New name.
            email: New email address.
            phone: New phone number.
        """
        customer(customer_id)
        row = store.update_customer(customer_id, name=name, email=email, phone=phone)
        store.log_activity("customer.updated", "customer", customer_id, {"name": name, "email": email, "phone": phone})
        return _json(row)

    @beta_tool
    def add_customer_note(customer_id: int, note: str) -> str:
        """Append a dated note to a customer's record. Use it when the user shares something about a customer worth keeping (a complaint, a preference, a promise made).

        Args:
            customer_id: The customer's id.
            note: The note text, one or two sentences.
        """
        customer(customer_id)
        row = store.append_customer_note(customer_id, note)
        store.log_activity("customer.note", "customer", customer_id, note)
        return _json(row)

    # -------------------------------------------------------------------- tasks
    @beta_tool
    def list_tasks(
        status: Literal["open", "done", "all"] = "open",
        due_before: str | None = None,
        customer_id: int | None = None,
    ) -> str:
        """List to-do items. Call it when the user asks what needs doing, what is overdue, or what is pending for a customer.

        Args:
            status: Filter by status. Default is open items only.
            due_before: ISO date; only tasks due on or before this date.
            customer_id: Only tasks linked to this customer.
        """
        due = _parse_date(due_before, "due_before") if due_before else None
        return _json(store.list_tasks(status=status, due_before=due, customer_id=customer_id))

    @beta_tool
    def add_task(
        title: str,
        due_date: str | None = None,
        priority: Literal["low", "normal", "high"] = "normal",
        details: str = "",
        customer_id: int | None = None,
    ) -> str:
        """Create a to-do item, reminder or follow-up. Use it whenever the user says they need to do, chase, check or remember something.

        Args:
            title: Short imperative title, e.g. "Chase Dana about the deposit".
            due_date: ISO date the task is due. Work it out from today's date when the user says "Friday" or "next week".
            priority: high for anything with money or a deadline attached.
            details: Extra context.
            customer_id: Link the task to a customer when one is involved.
        """
        if customer_id is not None:
            customer(customer_id)
        due = _parse_date(due_date, "due_date") if due_date else None
        try:
            row = store.add_task(title, details=details, due_date=due, priority=priority, customer_id=customer_id)
        except ValueError as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("task.added", "task", row["id"], {"title": row["title"], "due_date": due})
        return _json(row)

    @beta_tool
    def update_task(
        task_id: int,
        title: str | None = None,
        due_date: str | None = None,
        priority: Literal["low", "normal", "high"] | None = None,
        details: str | None = None,
    ) -> str:
        """Edit an open task: reschedule it, reprioritise it or reword it.

        Args:
            task_id: The task id from list_tasks.
            title: New title.
            due_date: New ISO due date.
            priority: New priority.
            details: New details text (replaces the old one).
        """
        due = _parse_date(due_date, "due_date") if due_date else None
        try:
            row = store.update_task(task_id, title=title, due_date=due, priority=priority, details=details)
        except (NotFound, ValueError) as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("task.updated", "task", task_id, {"title": title, "due_date": due, "priority": priority})
        return _json(row)

    @beta_tool
    def complete_task(task_id: int) -> str:
        """Mark a task as done. Call it when the user says something is finished, handled or no longer needed.

        Args:
            task_id: The task id from list_tasks.
        """
        try:
            row = store.complete_task(task_id)
        except NotFound as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("task.completed", "task", task_id, {"title": row["title"]})
        return _json(row)

    # ----------------------------------------------------------------- invoices
    @beta_tool
    def list_invoices(
        status: Literal["draft", "sent", "overdue", "paid", "unpaid", "all"] = "unpaid",
        customer_id: int | None = None,
    ) -> str:
        """List invoices. Call it for questions about money owed, what has been billed, or before sending or recording a payment.

        Args:
            status: 'unpaid' covers sent and overdue. 'draft' means created but not yet sent.
            customer_id: Only invoices for this customer.
        """
        store.refresh_overdue(config.today().isoformat())
        return _json(store.list_invoices(status=status, customer_id=customer_id))

    @beta_tool
    def create_invoice(
        customer_id: int,
        amount: float,
        description: str,
        due_date: str | None = None,
        issue_date: str | None = None,
        currency: str | None = None,
    ) -> str:
        """Create a draft invoice. It is NOT sent until send_invoice is called. Ask the user for the amount if they did not give one; never invent it.

        Args:
            customer_id: Who is being billed.
            amount: Total amount in major units, e.g. 240.50.
            description: What the invoice is for, as it should appear to the customer.
            due_date: ISO date payment is due. Defaults to 14 days after the issue date.
            issue_date: ISO date of issue. Defaults to today.
            currency: 3-letter code. Defaults to the business currency.
        """
        customer(customer_id)
        issued = _parse_date(issue_date, "issue_date") if issue_date else config.today().isoformat()
        due = (
            _parse_date(due_date, "due_date")
            if due_date
            else (date.fromisoformat(issued) + timedelta(days=14)).isoformat()
        )
        try:
            row = store.create_invoice(
                customer_id,
                amount_cents=round(amount * 100),
                currency=currency or config.currency,
                description=description,
                issue_date=issued,
                due_date=due,
            )
        except ValueError as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("invoice.created", "invoice", row["id"], {"amount": row["amount"], "customer": row["customer_name"]})
        return _json(row)

    @beta_tool
    def send_invoice(invoice_id: int, message: str | None = None) -> str:
        """Send an invoice to the customer by email and mark it as sent. This contacts the customer, so the owner will be asked to approve it. Use it for reminders on overdue invoices too.

        Args:
            invoice_id: The invoice id from list_invoices or create_invoice.
            message: Optional covering note. A polite default is used if omitted.
        """
        try:
            inv = store.get_invoice(invoice_id)
        except NotFound as exc:
            raise ToolError(str(exc)) from None
        if inv["status"] == "paid":
            raise ToolError(f"Invoice {invoice_id} is already paid; nothing to send.")
        if not inv["customer_email"]:
            raise ToolError(
                f"{inv['customer_name']} has no email address on file. Ask the owner for one and use update_customer first."
            )
        reminder = inv["status"] in ("sent", "overdue")
        subject = f"{'Reminder: ' if reminder else ''}Invoice #{inv['id']} from {config.business_name}"
        body = message or (
            f"Hello {inv['customer_name']},\n\n"
            f"{'This is a friendly reminder that invoice' if reminder else 'Please find attached invoice'} "
            f"#{inv['id']} for {inv['amount']} ({inv['description']}) "
            f"{'was due on' if reminder else 'is due on'} {inv['due_date']}.\n\n"
            f"Thank you,\n{config.business_name}"
        )
        gate("send_invoice", f"Email {subject!r} to {inv['customer_name']} <{inv['customer_email']}> for {inv['amount']}")
        msg = store.queue_message(
            "email", inv["customer_email"], body, subject=subject, customer_id=inv["customer_id"], related_invoice_id=inv["id"]
        )
        row = store.mark_invoice_sent(invoice_id)
        store.log_activity("invoice.sent", "invoice", invoice_id, {"outbox_id": msg["id"], "reminder": reminder})
        return _json({"invoice": row, "queued_message_id": msg["id"]})

    @beta_tool
    def record_payment(invoice_id: int, paid_on: str | None = None) -> str:
        """Mark an invoice as paid. Call it when the user says a customer has paid.

        Args:
            invoice_id: The invoice id.
            paid_on: ISO date the payment arrived. Defaults to today.
        """
        paid = _parse_date(paid_on, "paid_on") if paid_on else None
        try:
            row = store.mark_invoice_paid(invoice_id, paid)
        except (NotFound, ValueError) as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("invoice.paid", "invoice", invoice_id, {"amount": row["amount"]})
        return _json(row)

    # ------------------------------------------------------------- appointments
    @beta_tool
    def list_appointments(
        start: str | None = None,
        end: str | None = None,
        customer_id: int | None = None,
        status: Literal["scheduled", "completed", "cancelled", "all"] = "scheduled",
    ) -> str:
        """List appointments in a date range. Call it for "what's on today/this week", before booking (to check free slots), and for a customer's visit history.

        Args:
            start: ISO date or date-time; defaults to the start of today.
            end: ISO date or date-time; defaults to 7 days after start.
            customer_id: Only this customer's appointments.
            status: Defaults to scheduled ones.
        """
        s = _parse_datetime(start, "start") if start and "T" in start else (
            f"{_parse_date(start, 'start')}T00:00" if start else f"{config.today().isoformat()}T00:00"
        )
        if end:
            e = _parse_datetime(end, "end") if "T" in end else f"{_parse_date(end, 'end')}T23:59"
        else:
            e = (datetime.fromisoformat(s) + timedelta(days=7)).isoformat(timespec="minutes")
        return _json(store.list_appointments(start=s, end=e, customer_id=customer_id, status=status))

    @beta_tool
    def schedule_appointment(
        title: str,
        starts_at: str,
        ends_at: str | None = None,
        customer_id: int | None = None,
        location: str = "",
        notes: str = "",
        allow_conflict: bool = False,
    ) -> str:
        """Book an appointment, job or meeting. Refuses to double-book unless allow_conflict is true; if it reports a conflict, tell the owner and ask how to proceed.

        Args:
            title: What the appointment is, e.g. "Boiler service".
            starts_at: ISO date-time like 2026-03-14T09:30 in the business's local time.
            ends_at: ISO date-time. Defaults to one hour after the start.
            customer_id: The customer it is for, if any.
            location: Address or "phone" / "video".
            notes: Anything the person doing the job should know.
            allow_conflict: Set true only after the owner explicitly accepts an overlap.
        """
        if customer_id is not None:
            customer(customer_id)
        s = _parse_datetime(starts_at, "starts_at")
        e = _parse_datetime(ends_at, "ends_at") if ends_at else (
            datetime.fromisoformat(s) + timedelta(hours=1)
        ).isoformat(timespec="minutes")
        conflicts = store.find_conflicts(s, e)
        if conflicts and not allow_conflict:
            clash = "; ".join(f"#{c['id']} {c['title']} {c['starts_at']}-{c['ends_at'][-5:]}" for c in conflicts)
            raise ToolError(f"That slot overlaps existing appointments: {clash}. Offer another time or ask before overriding.")
        try:
            row = store.add_appointment(title, s, e, customer_id=customer_id, location=location, notes=notes)
        except ValueError as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("appointment.scheduled", "appointment", row["id"], {"title": title, "starts_at": s})
        return _json(row)

    @beta_tool
    def cancel_appointment(appointment_id: int, reason: str = "") -> str:
        """Cancel a scheduled appointment. The owner will be asked to approve. Does not notify the customer; use send_message for that if wanted.

        Args:
            appointment_id: The appointment id from list_appointments.
            reason: Why it is being cancelled, for the activity log.
        """
        try:
            appt = store.get_appointment(appointment_id)
        except NotFound as exc:
            raise ToolError(str(exc)) from None
        if appt["status"] != "scheduled":
            raise ToolError(f"Appointment {appointment_id} is already {appt['status']}.")
        gate("cancel_appointment", f"Cancel #{appt['id']} {appt['title']} at {appt['starts_at']}" + (f" ({reason})" if reason else ""))
        row = store.cancel_appointment(appointment_id)
        store.log_activity("appointment.cancelled", "appointment", appointment_id, {"reason": reason})
        return _json(row)

    @beta_tool
    def complete_appointment(appointment_id: int) -> str:
        """Mark an appointment as completed, e.g. when the user says a job is done. Often followed by create_invoice.

        Args:
            appointment_id: The appointment id.
        """
        try:
            row = store.set_appointment_status(appointment_id, "completed")
        except NotFound as exc:
            raise ToolError(str(exc)) from None
        store.log_activity("appointment.completed", "appointment", appointment_id)
        return _json(row)

    # ---------------------------------------------------------------- messaging
    @beta_tool
    def send_message(
        customer_id: int,
        body: str,
        channel: Literal["email", "sms"] = "email",
        subject: str | None = None,
    ) -> str:
        """Send an email or SMS to a customer (confirmations, reminders, follow-ups). The owner will be asked to approve the exact text, so write the full message in the customer's voice-appropriate tone and include it in body.

        Args:
            customer_id: The recipient.
            body: The complete message text.
            channel: email or sms. SMS needs a phone number on file and should be under 300 characters.
            subject: Email subject line. Ignored for SMS.
        """
        cust = customer(customer_id)
        recipient = cust["email"] if channel == "email" else cust["phone"]
        if not recipient:
            raise ToolError(f"{cust['name']} has no {'email address' if channel == 'email' else 'phone number'} on file.")
        if channel == "sms" and len(body) > 300:
            raise ToolError("SMS body is too long; keep it under 300 characters.")
        preview = body if len(body) <= 400 else body[:400] + "..."
        gate("send_message", f"{channel.upper()} to {cust['name']} <{recipient}>" + (f" subject {subject!r}" if subject else "") + f":\n{preview}")
        msg = store.queue_message(channel, recipient, body, subject=subject, customer_id=customer_id)
        store.log_activity("message.sent", "customer", customer_id, {"channel": channel, "outbox_id": msg["id"]})
        return _json(msg)

    # ----------------------------------------------------------------- overview
    @beta_tool
    def get_business_overview() -> str:
        """One-call snapshot: overdue and upcoming invoices, overdue and due tasks, today's and this week's appointments. Call it first for daily briefings, "how are things looking" and "what should I focus on" questions.
        """
        return _json(store.summary(config.today()))

    @beta_tool
    def recent_activity(limit: int = 20) -> str:
        """Show what has been changed recently (by the agent or the owner). Use it when the user asks what you did, or to double-check a previous action.

        Args:
            limit: How many entries, newest first.
        """
        return _json(store.recent_activity(limit=max(1, min(limit, 100))))

    return [
        find_customers,
        add_customer,
        update_customer,
        add_customer_note,
        list_tasks,
        add_task,
        update_task,
        complete_task,
        list_invoices,
        create_invoice,
        send_invoice,
        record_payment,
        list_appointments,
        schedule_appointment,
        cancel_appointment,
        complete_appointment,
        send_message,
        get_business_overview,
        recent_activity,
    ]


__all__ = ["build_tools", "fmt_money"]
