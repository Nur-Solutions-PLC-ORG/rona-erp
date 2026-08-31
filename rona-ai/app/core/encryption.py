from __future__ import annotations

import base64
import json
import logging
import os
from dataclasses import dataclass

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

logger = logging.getLogger(__name__)


_PREFIX = "enc:v1:"
_DEV_KEY = base64.urlsafe_b64encode(b"0123456789abcdef0123456789abcdef").decode()


class EncryptionError(RuntimeError):
    pass


@dataclass(frozen=True)
class DataEncryptor:
    keys: dict[str, bytes]
    active_kid: str

    @classmethod
    def from_settings(cls, settings) -> "DataEncryptor":
        raw_keyring = settings.data_encryption_keyring
        keys: dict[str, bytes] = {}
        for kid, encoded in raw_keyring.items():
            try:
                key = base64.urlsafe_b64decode(encoded.get_secret_value())
            except Exception as exc:
                raise ValueError(f"DATA_ENCRYPTION_KEYRING key '{kid}' is not valid base64") from exc
            if len(key) != 32:
                raise ValueError(f"DATA_ENCRYPTION_KEYRING key '{kid}' must decode to 32 bytes")
            keys[kid] = key
        active = settings.data_encryption_active_kid
        if not keys or active not in keys:
            raise ValueError("DATA_ENCRYPTION_ACTIVE_KID must identify a configured encryption key")
        return cls(keys=keys, active_kid=active)

    def encrypt(self, value: str, *, context: str) -> str:
        nonce = os.urandom(12)
        ciphertext = AESGCM(self.keys[self.active_kid]).encrypt(
            nonce, value.encode("utf-8"), context.encode("utf-8")
        )
        payload = base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")
        return f"{_PREFIX}{self.active_kid}:{payload}"

    def decrypt(self, value: str, *, context: str) -> str:
        if not value.startswith(_PREFIX):
            logger.warning(
                "decrypt() received a value without the '%s' prefix (context=%s); "
                "returning it as-is. This is expected only for legacy plaintext data.",
                _PREFIX,
                context,
            )
            return value
        try:
            _, _, kid, encoded = value.split(":", 3)
            key = self.keys[kid]
            raw = base64.urlsafe_b64decode(encoded.encode("ascii"))
            plaintext = AESGCM(key).decrypt(raw[:12], raw[12:], context.encode("utf-8"))
            return plaintext.decode("utf-8")
        except Exception as exc:
            raise EncryptionError("encrypted value failed authentication or uses a retired key") from exc


def parse_keyring(raw: str | None, fallback: str) -> dict[str, str]:
    if raw:
        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise ValueError("DATA_ENCRYPTION_KEYRING must be a JSON object")
        return {str(k).strip(): str(v).strip() for k, v in parsed.items()}
    return {"dev": fallback}


__all__ = ["DataEncryptor", "EncryptionError", "parse_keyring"]
