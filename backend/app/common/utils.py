import uuid
import re


def generate_uuid() -> str:
    return str(uuid.uuid4())


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


def mask_secret(key: str, visible: int = 4) -> str:
    if len(key) <= visible:
        return "*" * len(key)
    return key[:visible] + "*" * (len(key) - visible)
