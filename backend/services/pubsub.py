import json
import time
import threading
from typing import Callable, Dict, List, Any
from valkey_client.client import valkey

class PubSubService:
    _subscribers: Dict[str, List[Callable]] = {}
    _pubsub_thread = None
    _stop_event = threading.Event()
    _lock = threading.Lock()

    @classmethod
    def publish(cls, channel: str, message: dict) -> int:
        msg_str = json.dumps(message)
        # Update metrics
        try:
            valkey.hincrby("memoryos:metrics:global", "total_messages_routed", 1)
        except Exception:
            pass
            
        # Use underlying client to publish
        full_channel = f"memoryos:pubsub:{channel}"
        return valkey.publish(full_channel, msg_str)

    @classmethod
    def subscribe(cls, channel: str, callback: Callable):
        with cls._lock:
            if channel not in cls._subscribers:
                cls._subscribers[channel] = []
            cls._subscribers[channel].append(callback)
            
            # Start background thread if not already running
            if not cls._pubsub_thread:
                cls._stop_event.clear()
                cls._pubsub_thread = threading.Thread(target=cls._listen_loop, daemon=True)
                cls._pubsub_thread.start()

    @classmethod
    def unsubscribe_all(cls):
        with cls._lock:
            cls._stop_event.set()
            cls._subscribers = {}
            cls._pubsub_thread = None

    @classmethod
    def _listen_loop(cls):
        import redis
        from core.config import settings
        
        try:
            client = redis.Redis(
                host=settings.VALKEY_HOST,
                port=settings.VALKEY_PORT,
                decode_responses=True
            )
            pubsub = client.pubsub()
            pubsub.psubscribe("memoryos:pubsub:*")
        except Exception as e:
            print(f"Failed to start pubsub connection: {e}")
            return
        
        while not cls._stop_event.is_set():
            try:
                # Non-blocking check with short timeout
                msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.1)
                if msg:
                    channel_raw = msg['channel'] # e.g. "memoryos:pubsub:research.complete"
                    channel = channel_raw.replace("memoryos:pubsub:", "")
                    data_str = msg['data']
                    
                    try:
                        data = json.loads(data_str)
                    except Exception:
                        data = data_str
                        
                    # Dispatch to callbacks
                    with cls._lock:
                        callbacks = cls._subscribers.get(channel, [])
                        for cb in callbacks:
                            try:
                                cb(data)
                            except Exception as e:
                                print(f"Error in pubsub callback: {e}")
            except Exception as e:
                time.sleep(1)
        
        try:
            pubsub.punsubscribe()
            pubsub.close()
        except Exception:
            pass
