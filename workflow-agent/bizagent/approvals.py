"""Human-in-the-loop gate for actions that leave the building.

The model decides *what* to do; the owner decides whether outbound or
hard-to-undo actions actually happen. Tools call ``approvals.approve`` before
sending anything to a customer or cancelling an appointment. A ``False`` answer
is returned to the model as a tool error so it can tell the owner and move on.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Protocol


class ApprovalPolicy(Protocol):
    def approve(self, action: str, summary: str) -> bool:
        """Return True to let the action run, False to block it."""


@dataclass
class AutoApprove:
    """Approves everything. For unattended runs where the owner has opted in."""

    decisions: list[tuple[str, str, bool]] = field(default_factory=list)

    def approve(self, action: str, summary: str) -> bool:
        self.decisions.append((action, summary, True))
        return True


@dataclass
class DenyAll:
    """Blocks every gated action. Useful for dry runs and tests."""

    decisions: list[tuple[str, str, bool]] = field(default_factory=list)

    def approve(self, action: str, summary: str) -> bool:
        self.decisions.append((action, summary, False))
        return False


@dataclass
class ConsoleApproval:
    """Asks on the terminal. ``input_fn`` and ``print_fn`` are injectable for tests."""

    input_fn: Callable[[str], str] = input
    print_fn: Callable[[str], None] = print

    def approve(self, action: str, summary: str) -> bool:
        self.print_fn(f"\n  Approval needed: {action}\n  {summary}")
        while True:
            try:
                answer = self.input_fn("  Allow? [y/N] ").strip().lower()
            except EOFError:
                return False
            if answer in {"y", "yes"}:
                return True
            if answer in {"", "n", "no"}:
                return False
            self.print_fn("  Please answer y or n.")
