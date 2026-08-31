from __future__ import annotations

import asyncio
import base64
import logging
from pathlib import Path

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_B64_PREFIX = "b64:"


class ReportStorage:
    def __init__(self) -> None:
        settings = get_settings()
        self.settings = settings
        self._root = Path(settings.report_output_dir)
        self._root.mkdir(parents=True, exist_ok=True)

    async def put(self, key: str, data: bytes) -> str:
        from app.core.database import get_encryptor

        encoded = _B64_PREFIX + base64.b64encode(data).decode("ascii")
        encrypted = get_encryptor().encrypt(encoded, context=f"report-file:{key}").encode("ascii")
        path = self._root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, encrypted)
        return str(path)

    async def get(self, storage_key: str) -> bytes:
        from app.core.database import get_encryptor

        encrypted = await asyncio.to_thread(Path(storage_key).read_bytes)
        object_key = Path(storage_key).name

        plaintext = get_encryptor().decrypt(
            encrypted.decode("ascii"), context=f"report-file:{object_key}"
        )
        if plaintext.startswith(_B64_PREFIX):
            return base64.b64decode(plaintext[len(_B64_PREFIX):])
        # Legacy files written with hex encoding.
        return bytes.fromhex(plaintext)

    async def delete(self, storage_key: str) -> None:
        try:
            await asyncio.to_thread(Path(storage_key).unlink, True)
        except Exception:
            logger.warning("failed to delete report file storage_key=%s", storage_key, exc_info=True)

    async def health_check(self) -> bool:
        return self._root.exists() and self._root.is_dir()


_storage: ReportStorage | None = None


def get_report_storage() -> ReportStorage:
    global _storage
    if _storage is None:
        _storage = ReportStorage()
    return _storage


def reset_report_storage() -> None:
    global _storage
    _storage = None
