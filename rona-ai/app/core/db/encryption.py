from __future__ import annotations

from app.core.config import get_settings
from app.core.encryption import DataEncryptor

_encryptor: DataEncryptor | None = None


def get_encryptor() -> DataEncryptor:
    global _encryptor
    if _encryptor is None:
        _encryptor = DataEncryptor.from_settings(get_settings())
    return _encryptor


def reset_encryption_state() -> None:
    global _encryptor
    _encryptor = None


__all__ = ["get_encryptor", "reset_encryption_state"]
