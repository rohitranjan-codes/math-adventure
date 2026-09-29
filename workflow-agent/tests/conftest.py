from __future__ import annotations

from datetime import datetime

import pytest

from bizagent.config import Config
from bizagent.store import Store

FIXED_NOW = datetime(2026, 9, 29, 9, 15)  # a Tuesday


@pytest.fixture
def config() -> Config:
    return Config(business_name="Riverside Plumbing", currency="GBP", timezone="UTC", fallbacks=True)


@pytest.fixture
def store(monkeypatch, config) -> Store:
    monkeypatch.setattr(Config, "now", lambda self: FIXED_NOW)
    s = Store(":memory:", clock=lambda: FIXED_NOW)
    yield s
    s.close()
