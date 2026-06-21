from pydantic import BaseModel
from typing import Optional

class CacheStore(BaseModel):
    prompt: str
    response: str
    tokens_saved: Optional[int] = 0
    latency: Optional[float] = 0.0

class CacheSearch(BaseModel):
    prompt: str
    threshold: Optional[float] = 0.85
