import redis
from typing import Dict, List, Optional, Any
from core.config import settings

class ValkeyClient:
    def __init__(self):
        self.pool: Optional[redis.ConnectionPool] = None
        self.client: Optional[redis.Redis] = None

    def connect(self):
        if not self.pool:
            self.pool = redis.ConnectionPool(
                host=settings.VALKEY_HOST,
                port=settings.VALKEY_PORT,
                decode_responses=True
            )
            self.client = redis.Redis(connection_pool=self.pool)

    def disconnect(self):
        if self.pool:
            self.pool.disconnect()
            self.pool = None
            self.client = None

    def get_client(self) -> redis.Redis:
        if not self.client:
            self.connect()
        return self.client

    # Ping
    def ping(self) -> bool:
        return self.get_client().ping()

    # General / String keys
    def get(self, key: str) -> Optional[str]:
        return self.get_client().get(key)

    def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        return self.get_client().set(key, value, ex=ex)

    def delete(self, *keys: str) -> int:
        return self.get_client().delete(*keys)

    # Hash Operations
    def hset(self, key: str, mapping: Dict[str, Any]) -> int:
        return self.get_client().hset(key, mapping=mapping)

    def hget(self, key: str, field: str) -> Optional[str]:
        return self.get_client().hget(key, field)

    def hgetall(self, key: str) -> Dict[str, str]:
        return self.get_client().hgetall(key)

    def hdel(self, key: str, *fields: str) -> int:
        return self.get_client().hdel(key, *fields)

    def hincrby(self, key: str, field: str, amount: int = 1) -> int:
        return self.get_client().hincrby(key, field, amount)

    def hexists(self, key: str, field: str) -> bool:
        return self.get_client().hexists(key, field)

    # Set Operations
    def sadd(self, key: str, *members: Any) -> int:
        return self.get_client().sadd(key, *members)

    def srem(self, key: str, *members: Any) -> int:
        return self.get_client().srem(key, *members)

    def smembers(self, key: str) -> List[str]:
        return list(self.get_client().smembers(key))

    def sismember(self, key: str, member: Any) -> bool:
        return self.get_client().sismember(key, member)

    # Stream Operations
    def xadd(self, key: str, fields: Dict[str, Any], maxlen: Optional[int] = None) -> str:
        # Stream XADD expects fields as mapping
        # Pydantic or complex fields need to be stringified beforehand
        return self.get_client().xadd(key, fields, maxlen=maxlen)

    def xrange(self, key: str, start: str = "-", end: str = "+", count: Optional[int] = None) -> List[Any]:
        return self.get_client().xrange(key, min=start, max=end, count=count)

    def xrevrange(self, key: str, start: str = "+", end: str = "-", count: Optional[int] = None) -> List[Any]:
        return self.get_client().xrevrange(key, max=start, min=end, count=count)

    # Pub/Sub Operations
    def publish(self, channel: str, message: str) -> int:
        return self.get_client().publish(channel, message)

valkey = ValkeyClient()
