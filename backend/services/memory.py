import time
import json
from typing import Optional, List, Dict, Any
from valkey_client.client import valkey
from schemas.memory import MemoryAdd, MemoryAddResponse, MemoryGetResponse, MemoryItem
from fastapi import HTTPException

class MemoryService:
    @staticmethod
    def add_memory(memory_in: MemoryAdd) -> MemoryAddResponse:
        now = time.time()
        
        # If session-scoped, verify session exists
        if memory_in.scope == "session":
            session_key = f"memoryos:session:{memory_in.session_id}"
            if not valkey.get_client().exists(session_key):
                raise HTTPException(status_code=404, detail="Session not found")
            target_key = f"memoryos:memory:session:{memory_in.session_id}"
        else:
            target_key = "memoryos:memory:shared"

        # Serialize memory value
        payload = {
            "value": memory_in.value,
            "author": memory_in.author,
            "timestamp": now
        }
        payload_str = json.dumps(payload)
        
        # Write to Valkey Hash
        valkey.hset(target_key, {memory_in.key: payload_str})
        
        # If shared and tags exist, write tags mapping
        if memory_in.scope == "shared" and memory_in.tags:
            for tag in memory_in.tags:
                valkey.sadd(f"memoryos:memory:shared:tag:{tag}", memory_in.key)
                
        # Update metrics
        valkey.hincrby("memoryos:metrics:global", "total_memory_writes", 1)
        valkey.hincrby("memoryos:metrics:agents", f"{memory_in.author}:invocations", 1)
        
        return MemoryAddResponse(
            status="success",
            scope=memory_in.scope,
            key=memory_in.key,
            written_at=now
        )

    @staticmethod
    def get_memory(
        scope: str,
        session_id: Optional[str] = None,
        key: Optional[str] = None,
        tag: Optional[str] = None
    ) -> MemoryGetResponse:
        
        if scope == "session":
            if not session_id:
                raise HTTPException(status_code=400, detail="session_id is required for session-scoped memory")
            
            session_key = f"memoryos:session:{session_id}"
            if not valkey.get_client().exists(session_key):
                raise HTTPException(status_code=404, detail="Session not found")
                
            target_key = f"memoryos:memory:session:{session_id}"
            
            if key:
                val_str = valkey.hget(target_key, key)
                if not val_str:
                    valkey.hincrby("memoryos:metrics:global", "cache_misses", 1)
                    raise HTTPException(status_code=404, detail=f"Memory key '{key}' not found in session")
                
                # Increment cache hits & calculate tokens saved
                valkey.hincrby("memoryos:metrics:global", "cache_hits", 1)
                tokens = max(1, len(val_str) // 4)
                valkey.hincrby("memoryos:metrics:global", "tokens_saved", tokens)
                
                data = json.loads(val_str)
                memories = {
                    key: MemoryItem(
                        value=data["value"],
                        author=data["author"],
                        timestamp=data["timestamp"]
                    )
                }
            else:
                raw_memories = valkey.hgetall(target_key)
                memories = {}
                for k, v in raw_memories.items():
                    data = json.loads(v)
                    memories[k] = MemoryItem(
                        value=data["value"],
                        author=data["author"],
                        timestamp=data["timestamp"]
                    )
            
            return MemoryGetResponse(
                scope=scope,
                session_id=session_id,
                memories=memories
            )
            
        elif scope == "shared":
            target_key = "memoryos:memory:shared"
            memories = {}
            
            if key:
                val_str = valkey.hget(target_key, key)
                if not val_str:
                    valkey.hincrby("memoryos:metrics:global", "cache_misses", 1)
                    raise HTTPException(status_code=404, detail=f"Memory key '{key}' not found in shared memory")
                
                valkey.hincrby("memoryos:metrics:global", "cache_hits", 1)
                tokens = max(1, len(val_str) // 4)
                valkey.hincrby("memoryos:metrics:global", "tokens_saved", tokens)
                
                data = json.loads(val_str)
                memories = {
                    key: MemoryItem(
                        value=data["value"],
                        author=data["author"],
                        timestamp=data["timestamp"]
                    )
                }
            elif tag:
                tagged_keys = valkey.smembers(f"memoryos:memory:shared:tag:{tag}")
                if tagged_keys:
                    # Fetch values for keys in tag index
                    for k in tagged_keys:
                        val_str = valkey.hget(target_key, k)
                        if val_str:
                            data = json.loads(val_str)
                            memories[k] = MemoryItem(
                                value=data["value"],
                                author=data["author"],
                                timestamp=data["timestamp"]
                            )
            else:
                raw_memories = valkey.hgetall(target_key)
                for k, v in raw_memories.items():
                    data = json.loads(v)
                    memories[k] = MemoryItem(
                        value=data["value"],
                        author=data["author"],
                        timestamp=data["timestamp"]
                    )
                    
            return MemoryGetResponse(
                scope=scope,
                session_id=None,
                memories=memories
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid scope. Must be 'session' or 'shared'.")
