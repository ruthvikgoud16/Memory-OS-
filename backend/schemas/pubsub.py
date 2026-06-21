from pydantic import BaseModel
from typing import Dict, Any

class PubSubPublish(BaseModel):
    channel: str
    message: Dict[str, Any]
