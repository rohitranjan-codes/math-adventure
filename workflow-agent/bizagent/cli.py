"""Command-line entry point: ``bizagent chat``, ``bizagent brief`` and friends."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import anthropic

from .agent import WorkflowAgent
from .approvals import ApprovalPolicy, AutoApprove, ConsoleApproval
from .config import Config
from .demo import seed_demo
from .store import Store, fmt_money

DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"


def _load_dotenv(path: Path = Path(".env")) -> None:
    """Tiny .env loader so the project has no extra dependency. Does not override real env vars."""
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def _config(args: argparse.Namespace) -> Config:
    cfg = Config.from_env()
    if args.db:
        cfg.db_path = Path(args.db)
    if args.model:
        cfg.model = args.model
    if args.effort:
        cfg = Config(**{**cfg.__dict__, "effort": args.effort})
    if args.yes:
        cfg.auto_approve = True
    return cfg


def _approvals(cfg: Config) -> ApprovalPolicy:
    return AutoApprove() if cfg.auto_approve else ConsoleApproval()


def _print_event(event: dict) -> None:
    if event["type"] == "tool_call":
        args = json.dumps(event["input"], ensure_ascii=False)
        print(f"{DIM}  -> {event['name']}({args[:160]}{'...' if len(args) > 160 else ''}){RESET}", flush=True)
    elif event["type"] == "tool_result" and event["is_error"]:
        content = event["content"] if isinstance(event["content"], str) else json.dumps(event["content"])
        print(f"{DIM}  !! {content[:200]}{RESET}", flush=True)


def _agent(cfg: Config, store: Store) -> WorkflowAgent:
    return WorkflowAgent(store, _approvals(cfg), config=cfg, on_event=_print_event)


NO_CREDENTIALS = (
    "No API credentials found. Put ANTHROPIC_API_KEY in .env or export it in your shell "
    "(or sign in with `ant auth login`)."
)


def _run(call):
    """Run one agent call, turning credential problems into a one-line message."""
    try:
        return call()
    except TypeError as exc:  # the SDK raises TypeError when no credential source resolves
        if "authentication" in str(exc).lower():
            raise SystemExit(f"error: {NO_CREDENTIALS}") from None
        raise
    except anthropic.AuthenticationError:
        raise SystemExit("error: the API rejected the key. Check ANTHROPIC_API_KEY.") from None


# ------------------------------------------------------------------ commands
def cmd_init(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    if args.demo:
        if store.find_customers():
            print(f"{cfg.db_path} already has data; not seeding demo records.")
        else:
            counts = seed_demo(store, cfg.today(), cfg.currency)
            print("Seeded demo data: " + ", ".join(f"{v} {k}" for k, v in counts.items()))
    print(f"Database ready at {cfg.db_path}")
    return 0


def cmd_status(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    s = store.summary(cfg.today())
    print(f"{BOLD}{cfg.business_name} - {s['today']}{RESET}")

    def section(title: str, rows: list, fmt) -> None:
        if not rows:
            return
        print(f"\n{title}")
        for r in rows:
            print(f"  {fmt(r)}")

    inv = lambda i: f"#{i['id']} {i['customer_name']:<22} {i['amount']:>14}  due {i['due_date']}  [{i['status']}]"  # noqa: E731
    task = lambda t: f"#{t['id']} {t['title']}  (due {t['due_date'] or '-'}, {t['priority']})"  # noqa: E731
    appt = lambda a: f"#{a['id']} {a['starts_at'][11:]}-{a['ends_at'][11:]} {a['starts_at'][:10]}  {a['title']}  {a['customer_name'] or ''}"  # noqa: E731

    section("Overdue invoices", s["overdue_invoices"], inv)
    section("Invoices due within 7 days", s["invoices_due_soon"], inv)
    section("Draft invoices (not sent)", s["draft_invoices"], inv)
    section("Overdue tasks", s["overdue_tasks"], task)
    section("Tasks due today", s["tasks_due_today"], task)
    section("Tasks due this week", s["tasks_due_this_week"], task)
    section("Appointments today", s["appointments_today"], appt)
    section("Appointments this week", s["appointments_upcoming"], appt)
    if s["queued_messages"]:
        print(f"\n{s['queued_messages']} message(s) waiting in the outbox (bizagent outbox)")
    return 0


def cmd_ask(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    agent = _agent(cfg, store)
    print(_run(lambda: agent.ask(" ".join(args.text))))
    return 0


def cmd_brief(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    agent = _agent(cfg, store)
    print(_run(agent.briefing))
    return 0


def cmd_chat(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    agent = _agent(cfg, store)
    print(f"{BOLD}bizagent{RESET} for {cfg.business_name} ({cfg.model}, effort {cfg.effort}). "
          "Type your request; 'brief' for the daily briefing; 'quit' to exit.\n")
    while True:
        try:
            line = input(f"{BOLD}you>{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not line:
            continue
        if line.lower() in {"quit", "exit", "q"}:
            break
        if line.lower() == "reset":
            agent.reset()
            print("(conversation cleared)")
            continue
        try:
            reply = _run(lambda: agent.briefing() if line.lower() == "brief" else agent.ask(line))
        except SystemExit:
            raise
        except Exception as exc:  # keep the REPL alive on API errors
            print(f"error: {exc}")
            continue
        print(f"\n{reply}\n")
    u = agent.usage
    print(f"{DIM}tokens: {u['input_tokens']} in / {u['output_tokens']} out, "
          f"{u['cache_read_input_tokens']} read from cache{RESET}")
    return 0


def cmd_outbox(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    rows = store.list_outbox(status=None if args.all else "queued")
    if not rows:
        print("Outbox is empty.")
        return 0
    for m in rows:
        print(f"{BOLD}#{m['id']} [{m['status']}] {m['channel']} to {m['recipient']}{RESET}  {m['created_at']}")
        if m["subject"]:
            print(f"  Subject: {m['subject']}")
        for line in m["body"].splitlines():
            print(f"  {line}")
        print()
    return 0


def cmd_log(args: argparse.Namespace, cfg: Config) -> int:
    store = Store(cfg.db_path, clock=cfg.now)
    for e in store.recent_activity(limit=args.limit):
        target = f"{e['entity']}#{e['entity_id']}" if e["entity"] else ""
        print(f"{e['ts']}  {e['action']:<24} {target:<16} {e['details'] or ''}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="bizagent", description="AI assistant for small-business workflow.")
    p.add_argument("--db", help="SQLite file (default: $BIZAGENT_DB or bizagent.db)")
    p.add_argument("--model", help="Claude model id (default: $BIZAGENT_MODEL or claude-opus-5-5)")
    p.add_argument("--effort", choices=["low", "medium", "high", "xhigh", "max"], help="Reasoning effort")
    p.add_argument("-y", "--yes", action="store_true", help="Auto-approve outbound actions (no y/n prompts)")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("init", help="Create the database (optionally with demo data)")
    s.add_argument("--demo", action="store_true", help="Seed a sample week of customers, tasks, invoices, appointments")
    s.set_defaults(func=cmd_init)

    sub.add_parser("status", help="Print the overview without calling the model").set_defaults(func=cmd_status)
    sub.add_parser("brief", help="Daily briefing written by the agent").set_defaults(func=cmd_brief)
    sub.add_parser("chat", help="Interactive conversation").set_defaults(func=cmd_chat)

    s = sub.add_parser("ask", help="One request, one answer")
    s.add_argument("text", nargs="+")
    s.set_defaults(func=cmd_ask)

    s = sub.add_parser("outbox", help="Show messages the agent queued for sending")
    s.add_argument("--all", action="store_true", help="Include sent/failed messages")
    s.set_defaults(func=cmd_outbox)

    s = sub.add_parser("log", help="Recent activity log")
    s.add_argument("--limit", type=int, default=30)
    s.set_defaults(func=cmd_log)
    return p


def main(argv: list[str] | None = None) -> int:
    _load_dotenv()
    args = build_parser().parse_args(argv)
    try:
        cfg = _config(args)
    except ValueError as exc:
        print(f"config error: {exc}", file=sys.stderr)
        return 2
    return args.func(args, cfg)


if __name__ == "__main__":
    sys.exit(main())
