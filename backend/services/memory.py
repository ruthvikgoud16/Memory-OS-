import time
import json
import math
from typing import Optional, List, Dict, Any
from valkey_client.client import valkey
from schemas.memory import MemoryAdd, MemoryAddResponse, MemoryGetResponse, MemoryItem
from fastapi import HTTPException
from services.embedding import EmbeddingService

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
            emb_lookup_key = f"session:{memory_in.session_id}:{memory_in.key}"
        else:
            target_key = "memoryos:memory:shared"
            emb_lookup_key = f"shared:shared:{memory_in.key}"

        # Serialize memory value including tags list
        payload = {
            "value": memory_in.value,
            "author": memory_in.author,
            "timestamp": now,
            "tags": memory_in.tags or []
        }
        payload_str = json.dumps(payload)
        
        # Write to Valkey Hash
        valkey.hset(target_key, {memory_in.key: payload_str})
        
        # Generate & Store memory embedding
        try:
            # Generate embedding text by stringifying memory value
            text_to_embed = str(memory_in.value)
            emb = EmbeddingService.get_embedding(text_to_embed)
            valkey.hset("memoryos:memory:embeddings", {emb_lookup_key: json.dumps(emb)})
        except Exception as e:
            print(f"Error generating embedding: {e}")
        
        # If shared and tags exist, write tags mapping
        if memory_in.scope == "shared" and memory_in.tags:
            for tag in memory_in.tags:
                valkey.sadd(f"memoryos:memory:shared:tag:{tag}", memory_in.key)
                
        # Update metrics
        valkey.hincrby("memoryos:metrics:global", "total_memory_writes", 1)
        valkey.hincrby("memoryos:metrics:agents", f"{memory_in.author}:invocations", 1)
        
        # Increments analytics sorted set scores
        try:
            if memory_in.scope == "session" and memory_in.session_id:
                valkey.get_client().zincrby("memoryos:analytics:sessions:writes", 1.0, memory_in.session_id)
            valkey.get_client().zincrby("memoryos:analytics:agents:invocations", 1.0, memory_in.author)
        except Exception as e:
            print(f"Analytics logging error: {e}")

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

    @staticmethod
    def vector_search(query: str, threshold: float = 0.5) -> List[Dict[str, Any]]:
        # Generate query embedding
        query_emb = EmbeddingService.get_embedding(query)
        
        results = []
        
        # 1. Fetch shared memories
        shared_raw = valkey.hgetall("memoryos:memory:shared")
        for key, val_str in shared_raw.items():
            try:
                data = json.loads(val_str)
                results.append({
                    "key": key,
                    "scope": "shared",
                    "session_id": "shared",
                    "value": data["value"],
                    "author": data["author"],
                    "timestamp": data["timestamp"],
                    "tags": data.get("tags", [])
                })
            except Exception:
                continue

        # 2. Fetch all session memories
        session_ids = valkey.smembers("memoryos:session:all")
        for session_id in session_ids:
            session_raw = valkey.hgetall(f"memoryos:memory:session:{session_id}")
            for key, val_str in session_raw.items():
                try:
                    data = json.loads(val_str)
                    results.append({
                        "key": key,
                        "scope": "session",
                        "session_id": session_id,
                        "value": data["value"],
                        "author": data["author"],
                        "timestamp": data["timestamp"],
                        "tags": data.get("tags", [])
                    })
                except Exception:
                    continue

        matched_results = []
        
        # 3. Calculate cosine similarity
        for item in results:
            emb_lookup_key = f"{item['scope']}:{item['session_id']}:{item['key']}"
            emb_str = valkey.hget("memoryos:memory:embeddings", emb_lookup_key)
            
            # Dynamically compute embedding on the fly if missing (supports legacy data)
            if not emb_str:
                try:
                    emb = EmbeddingService.get_embedding(str(item["value"]))
                    valkey.hset("memoryos:memory:embeddings", {emb_lookup_key: json.dumps(emb)})
                except Exception:
                    continue
            else:
                try:
                    emb = json.loads(emb_str)
                except Exception:
                    continue
            
            # Math Cosine similarity
            dot_product = sum(x * y for x, y in zip(query_emb, emb))
            mag1 = math.sqrt(sum(x * x for x in query_emb))
            mag2 = math.sqrt(sum(x * x for x in emb))
            
            score = 0.0
            if mag1 > 0 and mag2 > 0:
                score = dot_product / (mag1 * mag2)
                
            if score >= threshold:
                matched_results.append({
                    "key": item["key"],
                    "content": item["value"],
                    "similarity_score": round(score, 4),
                    "tags": item["tags"],
                    "source_session": item["session_id"]
                })
                
        # Sort by similarity score descending
        matched_results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return matched_results
