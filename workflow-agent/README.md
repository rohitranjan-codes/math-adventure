# bizagent

An AI agent that runs the day-to-day workflow of a small business. You talk to it
in plain language; it keeps the records straight and does the chasing.

```
you> Dana paid the tap invoice yesterday, and book her in for the bathroom
     site visit Thursday at 2. Then remind me to order the valve for Marco.

  -> find_customers({"query": "Dana"})
  -> list_invoices({"customer_id": 1, "status": "unpaid"})
  -> record_payment({"invoice_id": 3, "paid_on": "2026-09-28"})
  -> list_appointments({"start": "2026-10-01", "end": "2026-10-01"})
  -> schedule_appointment({"title": "Bathroom refit site visit", "starts_at": "2026-10-01T14:00", "customer_id": 1})
  -> find_customers({"query": "Marco"})
  -> add_task({"title": "Order replacement valve for Marco Ferreira", "priority": "high", "customer_id": 2})

Invoice #3 (95.00 GBP, tap replacement) marked paid on 2026-09-28.
Booked Dana's site visit for Thursday 2026-10-01, 14:00-15:00 (#5).
Added task #6 "Order replacement valve for Marco Ferreira", high priority, no due date. Want one?
```

It is built on the Claude API with the Anthropic Python SDK's tool runner, stores
everything in one SQLite file, and asks you before anything leaves the building.

## What it manages

| Area | Tools the model can call |
|---|---|
| Customers | `find_customers`, `add_customer`, `update_customer`, `add_customer_note` |
| Tasks and follow-ups | `list_tasks`, `add_task`, `update_task`, `complete_task` |
| Invoices and payments | `list_invoices`, `create_invoice`, `send_invoice`*, `record_payment` |
| Appointments | `list_appointments`, `schedule_appointment`, `cancel_appointment`*, `complete_appointment` |
| Customer messages | `send_message`* (email or SMS) |
| Overview | `get_business_overview`, `recent_activity` |

`*` Gated: the owner is asked to approve on the terminal before the action runs.
A declined action comes back to the model as an error, so it reports "not done"
instead of retrying.

Other guarantees enforced in code, not just in the prompt:

- No double booking. `schedule_appointment` refuses overlapping slots unless the
  owner explicitly allows the overlap.
- No invented money. Invoices are created as drafts and only marked sent by
  `send_invoice`; overdue status is computed from due dates, not asserted.
- No guessing customers. Ambiguous names come back as an error listing the
  matches, so the model has to ask.
- Everything the agent changes is written to an activity log (`bizagent log`).

## Quick start

Requires Python 3.10+ and an Anthropic API key.

```bash
cd workflow-agent
python -m venv .venv && source .venv/bin/activate     # or: uv venv && source .venv/bin/activate
pip install -e ".[dev]"                                # or: uv pip install -e ".[dev]"

cp .env.example .env        # put your ANTHROPIC_API_KEY and business details in here
bizagent init --demo        # creates bizagent.db with a sample week of data
bizagent status             # overview, no model call
bizagent brief              # the agent's daily briefing
bizagent chat               # interactive
bizagent ask "what's overdue and who should I chase first?"
```

Useful flags: `--db path.db`, `--model claude-opus-5-5`, `--effort low|medium|high|xhigh|max`,
`-y` to auto-approve gated actions (for unattended runs you have opted into).

Inside `chat`: `brief` runs the daily briefing, `reset` clears the conversation,
`quit` exits.

## How it works

```
 owner ──text──▶ WorkflowAgent.ask()
                    │  system prompt (cached) + full transcript
                    ▼
              Claude (claude-opus-5-5, adaptive thinking, effort=medium)
                    │  tool_use blocks
                    ▼
       SDK tool runner ──▶ bizagent.tools (validated, logged)
                                │            │
                          ApprovalPolicy   Store (SQLite)
                          (y/n on outbound)  customers · tasks · invoices
                                             appointments · outbox · activity_log
```

- `bizagent/agent.py` owns the loop. It uses `client.beta.messages.tool_runner`
  so the SDK handles the call/execute/feed-back cycle, and mirrors every turn
  (including tool results) into `agent.messages` so multi-turn context works.
  Thinking is left on (the model default) with `effort` as the cost dial; the
  system prompt carries a cache breakpoint and today's date is injected into the
  user turn, so the cached prefix never changes within a session.
- `bizagent/tools.py` defines each tool with `@beta_tool`; schemas come from the
  type hints and docstrings. Descriptions say *when* to call the tool, which is
  what the model actually uses to decide.
- `bizagent/store.py` is plain `sqlite3`. Swap it for Postgres by keeping the
  method signatures.
- `bizagent/approvals.py` is the human-in-the-loop gate: `ConsoleApproval` for
  the terminal, `AutoApprove` / `DenyAll` for automation and tests.
- Refusal fallbacks are on by default (`fallbacks: "default"` with the
  `server-side-fallback-2026-07-01` beta): if a safety classifier declines a
  turn, the API re-runs it on a fallback model inside the same call. Set
  `BIZAGENT_FALLBACKS=0` to turn that off.

### Sending: the outbox

`send_invoice` and `send_message` do not talk to an email or SMS provider yet.
They queue the exact message in the `outbox` table (see `bizagent outbox`) and
mark the invoice as sent. That keeps the agent honest and testable today; wiring
a provider is one function:

```python
# e.g. in a small worker or cron job
for msg in store.list_outbox(status="queued"):
    smtp_or_twilio.send(msg)              # your provider here
    store.mark_outbox_status(msg["id"], "sent")
```

## Extending it

**Add a tool.** Write a function in `build_tools` with typed arguments and a
docstring whose first line says when to call it, decorate it with `@beta_tool`,
raise `ToolError` for anything the model should fix or ask about, call
`store.log_activity` on writes, and add it to the returned list. If it touches a
customer or is hard to undo, call `gate(...)` first.

**Connect real systems.** The natural next integrations, each a tool or two:

- Calendar (Google/Outlook) instead of, or synced with, the `appointments` table.
- Accounting (Xero, QuickBooks, Stripe) for invoices and payment status.
- Email/SMS provider for the outbox, plus an inbound webhook so customer replies
  become tasks.
- A scheduled run (`bizagent brief` from cron each morning, `-y` off) that posts
  the briefing to Slack or email.

**Change the model or effort.** `BIZAGENT_MODEL` and `BIZAGENT_EFFORT`. Lower
effort means fewer, more consolidated tool calls and terser replies; raise it for
multi-step planning requests.

## Configuration

All via environment variables or a `.env` file in the working directory
(see `.env.example`):

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | | Required. |
| `BIZAGENT_DB` | `bizagent.db` | SQLite file. |
| `BIZAGENT_BUSINESS_NAME` | `the business` | Used in the prompt and in outgoing messages. |
| `BIZAGENT_BUSINESS_PROFILE` | | Free text about the business, shown to the model. |
| `BIZAGENT_TZ` | `UTC` | IANA timezone for "today" and appointment times. |
| `BIZAGENT_CURRENCY` | `EUR` | Default invoice currency. |
| `BIZAGENT_MODEL` | `claude-opus-5-5` | Model id. |
| `BIZAGENT_EFFORT` | `medium` | `low`, `medium`, `high`, `xhigh`, `max`. |
| `BIZAGENT_MAX_TOOL_ROUNDS` | `20` | Cap on tool calls per request. |
| `BIZAGENT_AUTO_APPROVE` | `0` | `1` skips the approval prompt. |
| `BIZAGENT_FALLBACKS` | `1` | `0` disables refusal fallbacks. |

## Tests

```bash
pytest
```

The suite covers the store, every tool (including approval denial, conflicts and
validation), and the agent loop itself, which is exercised through the real SDK
tool runner against a scripted fake of the API. No network or API key needed.

## Layout

```
workflow-agent/
├── bizagent/
│   ├── agent.py        # WorkflowAgent: the conversation and tool loop
│   ├── tools.py        # @beta_tool functions the model can call
│   ├── store.py        # SQLite schema and queries
│   ├── approvals.py    # human-in-the-loop gate
│   ├── prompts.py      # system prompt and briefing request
│   ├── config.py       # env-driven settings
│   ├── demo.py         # sample data for `init --demo`
│   └── cli.py          # `bizagent` command
├── tests/
├── pyproject.toml
└── .env.example
```
