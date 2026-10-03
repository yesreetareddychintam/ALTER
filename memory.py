import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DATA_DIR = Path(os.getenv("ALTER_DATA_DIR", "/app/data"))
DATA_FILE = DATA_DIR / "memory.json"


def _read() -> list[dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text())
    except Exception:
        return []


def _write(items: list[dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(json.dumps(items, indent=2))


def save_local(payload: dict[str, Any]) -> dict[str, Any]:
    items = _read()
    record = {
        "id": f"exp-{len(items)+1}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **payload,
    }
    items.insert(0, record)
    _write(items[:100])
    return record


def history_local() -> list[dict[str, Any]]:
    return _read()


def search_local(query: str) -> list[dict[str, Any]]:
    q = query.lower()
    return [
        item for item in _read()
        if q in json.dumps(item).lower()
    ]


class HindsightAdapter:
    """Best-effort Hindsight adapter with a transparent local fallback.

    Hindsight APIs can evolve. The adapter intentionally isolates that integration
    so the core ALTER workflow remains usable without a Hindsight credential.
    """

    def __init__(self):
        self.api_key = os.getenv("HINDSIGHT_API_KEY")
        self.base_url = os.getenv("HINDSIGHT_URL", "").rstrip("/")
        self.bank_id = os.getenv("HINDSIGHT_BANK_ID", "alter")

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.base_url)

    async def retain(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.enabled:
            return save_local(payload)

        import httpx
        content = json.dumps(payload)
        url = f"{self.base_url}/v1/banks/{self.bank_id}/memories"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(url, json={"content": content}, headers=headers)
                r.raise_for_status()
            return save_local({**payload, "memory_provider": "hindsight"})
        except Exception:
            return save_local({**payload, "memory_provider": "local-fallback"})

    async def recall(self, query: str) -> list[dict[str, Any]]:
        if not self.enabled:
            return search_local(query)

        import httpx
        url = f"{self.base_url}/v1/banks/{self.bank_id}/search"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(url, json={"query": query}, headers=headers)
                r.raise_for_status()
                remote = r.json()
            return remote.get("results", []) or search_local(query)
        except Exception:
            return search_local(query)
