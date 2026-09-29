"""Runtime configuration, read from environment variables with sane defaults."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path
from typing import Mapping
from zoneinfo import ZoneInfo

DEFAULT_MODEL = "claude-opus-5-5"
EFFORT_LEVELS = ("low", "medium", "high", "xhigh", "max")


def _truthy(value: str | None, default: bool) -> bool:
    if value is None or value == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass
class Config:
    model: str = DEFAULT_MODEL
    effort: str = "medium"
    max_tokens: int = 16000
    max_tool_rounds: int = 20
    db_path: Path = field(default_factory=lambda: Path("bizagent.db"))
    business_name: str = "the business"
    business_profile: str = ""
    timezone: str = "UTC"
    currency: str = "EUR"
    auto_approve: bool = False
    fallbacks: bool = True

    def __post_init__(self) -> None:
        if self.effort not in EFFORT_LEVELS:
            raise ValueError(f"effort must be one of {EFFORT_LEVELS}, got {self.effort!r}")
        self.db_path = Path(self.db_path)

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "Config":
        env = os.environ if env is None else env
        return cls(
            model=env.get("BIZAGENT_MODEL") or DEFAULT_MODEL,
            effort=env.get("BIZAGENT_EFFORT") or "medium",
            max_tokens=int(env.get("BIZAGENT_MAX_TOKENS") or 16000),
            max_tool_rounds=int(env.get("BIZAGENT_MAX_TOOL_ROUNDS") or 20),
            db_path=Path(env.get("BIZAGENT_DB") or "bizagent.db"),
            business_name=env.get("BIZAGENT_BUSINESS_NAME") or "the business",
            business_profile=env.get("BIZAGENT_BUSINESS_PROFILE") or "",
            timezone=env.get("BIZAGENT_TZ") or "UTC",
            currency=env.get("BIZAGENT_CURRENCY") or "EUR",
            auto_approve=_truthy(env.get("BIZAGENT_AUTO_APPROVE"), False),
            fallbacks=_truthy(env.get("BIZAGENT_FALLBACKS"), True),
        )

    def now(self) -> datetime:
        """Current local time for the business, timezone-naive (matches stored values)."""
        return datetime.now(ZoneInfo(self.timezone)).replace(tzinfo=None, microsecond=0)

    def today(self) -> date:
        return self.now().date()
