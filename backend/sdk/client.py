import httpx
from typing import Dict, Any, List, Optional

class MemorySubSDK:
    def __init__(self, client: 'MemoryOSClient'):
        self._c = client

    def store(
        self, 
        scope: str, 
        session_id: Optional[str], 
        key: str, 
        value: Any, 
        author: str, 
        tags: List[str] = []
    ) -> Dict[str, Any]:
        payload = {
            "scope": scope,
            "session_id": session_id,
            "key": key,
            "value": value,
            "author": author,
            "tags": tags
        }
        res = httpx.post(f"{self._c.base_url}/memory/add", json=payload)
        res.raise_for_status()
        return res.json()

    def retrieve(
        self, 
        scope: str, 
        session_id: Optional[str] = None, 
        key: Optional[str] = None, 
        tag: Optional[str] = None
    ) -> Dict[str, Any]:
        params = {"scope": scope}
        if session_id:
            params["session_id"] = session_id
        if key:
            params["key"] = key
        if tag:
            params["tag"] = tag
        res = httpx.get(f"{self._c.base_url}/memory/get", params=params)
        res.raise_for_status()
        return res.json()

    def search(self, query: str, threshold: float = 0.5) -> List[Dict[str, Any]]:
        params = {"query": query, "threshold": threshold}
        res = httpx.get(f"{self._c.base_url}/memory/search", params=params)
        res.raise_for_status()
        return res.json()

class CacheSubSDK:
    def __init__(self, client: 'MemoryOSClient'):
        self._c = client

    def semantic(
        self, 
        prompt: str, 
        response: Optional[str] = None, 
        tokens_saved: int = 0, 
        latency: float = 0.0, 
        threshold: float = 0.85
    ) -> Dict[str, Any]:
        # If response is provided, store it
        if response is not None:
            payload = {
                "prompt": prompt,
                "response": response,
                "tokens_saved": tokens_saved,
                "latency": latency
            }
            res = httpx.post(f"{self._c.base_url}/cache/store", json=payload)
            res.raise_for_status()
            return res.json()
        else:
            # Otherwise search it
            payload = {"prompt": prompt, "threshold": threshold}
            res = httpx.post(f"{self._c.base_url}/cache/search", json=payload)
            res.raise_for_status()
            return res.json()

class TimelineSubSDK:
    def __init__(self, client: 'MemoryOSClient'):
        self._c = client

    def replay(self, session_id: str) -> List[Dict[str, Any]]:
        res = httpx.get(f"{self._c.base_url}/timeline/replay/{session_id}")
        res.raise_for_status()
        return res.json()

class EventsSubSDK:
    def __init__(self, client: 'MemoryOSClient'):
        self._c = client

    def publish(self, channel: str, message: Dict[str, Any]) -> Dict[str, Any]:
        payload = {
            "channel": channel,
            "message": message
        }
        res = httpx.post(f"{self._c.base_url}/pubsub/publish", json=payload)
        res.raise_for_status()
        return res.json()

class MetricsSubSDK:
    def __init__(self, client: 'MemoryOSClient'):
        self._c = client

    def get(self) -> Dict[str, Any]:
        res = httpx.get(f"{self._c.base_url}/metrics")
        res.raise_for_status()
        return res.json()

class MemoryOSClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip('/')
        self.memory = MemorySubSDK(self)
        self.cache = CacheSubSDK(self)
        self.timeline = TimelineSubSDK(self)
        self.events = EventsSubSDK(self)
        self.metrics = MetricsSubSDK(self)
