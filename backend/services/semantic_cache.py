import hashlib
import time
import json
import math
from typing import Optional, Dict, Any
from valkey_client.client import valkey
from services.embedding import EmbeddingService

class SemanticCacheService:
    @staticmethod
    def _compute_hash(prompt: str) -> str:
        return hashlib.sha256(prompt.strip().encode('utf-8')).hexdigest()

    @staticmethod
    def store(prompt: str, response: str, tokens_saved: int = 0, latency: float = 0.0) -> str:
        prompt_hash = SemanticCacheService._compute_hash(prompt)
        now = time.time()
        
        # Generate embedding
        embedding = EmbeddingService.get_embedding(prompt)
        
        cache_key = f"memoryos:cache:item:{prompt_hash}"
        valkey.hset(cache_key, {
            "prompt": prompt,
            "response": response,
            "embedding": json.dumps(embedding),
            "timestamp": str(now)
        })
        
        # Track hash in all_hashes set
        valkey.sadd("memoryos:cache:all_hashes", prompt_hash)
        
        # Increment metric counts
        valkey.hincrby("memoryos:cache:stats", "token_savings", tokens_saved)
        valkey.get_client().hincrbyfloat("memoryos:cache:stats", "total_latency_saved_ms", latency)
        
        return prompt_hash

    @staticmethod
    def search(prompt: str, threshold: float = 0.85) -> Optional[Dict[str, Any]]:
        # Get embedding
        query_emb = EmbeddingService.get_embedding(prompt)
        
        # Retrieve all prompt hashes
        hashes = valkey.smembers("memoryos:cache:all_hashes")
        if not hashes:
            valkey.hincrby("memoryos:cache:stats", "misses", 1)
            valkey.hincrby("memoryos:metrics:global", "cache_misses", 1)
            return None
            
        best_match = None
        best_score = -1.0
        
        for h in hashes:
            cache_key = f"memoryos:cache:item:{h}"
            data = valkey.hgetall(cache_key)
            if not data:
                continue
                
            try:
                cached_emb = json.loads(data.get("embedding", "[]"))
            except Exception:
                continue
                
            # Cosine similarity in pure Python
            dot_product = sum(x * y for x, y in zip(query_emb, cached_emb))
            mag1 = math.sqrt(sum(x * x for x in query_emb))
            mag2 = math.sqrt(sum(x * x for x in cached_emb))
            
            score = 0.0
            if mag1 > 0 and mag2 > 0:
                score = dot_product / (mag1 * mag2)
                
            if score > best_score:
                best_score = score
                best_match = data
                
        if best_score >= threshold and best_match:
            # Hit!
            valkey.hincrby("memoryos:cache:stats", "hits", 1)
            # Update cache metrics
            tokens = max(1, len(best_match.get("response", "")) // 4)
            valkey.hincrby("memoryos:cache:stats", "token_savings", tokens)
            
            # Record global hits
            valkey.hincrby("memoryos:metrics:global", "cache_hits", 1)
            valkey.hincrby("memoryos:metrics:global", "tokens_saved", tokens)
            
            return {
                "prompt": best_match.get("prompt"),
                "response": best_match.get("response"),
                "similarity_score": best_score,
                "timestamp": float(best_match.get("timestamp", 0))
            }
            
        # Miss
        valkey.hincrby("memoryos:cache:stats", "misses", 1)
        valkey.hincrby("memoryos:metrics:global", "cache_misses", 1)
        return None

    @staticmethod
    def hit_rate() -> float:
        stats = valkey.hgetall("memoryos:cache:stats")
        hits = int(stats.get("hits", "0"))
        misses = int(stats.get("misses", "0"))
        total = hits + misses
        if total == 0:
            return 0.0
        return round(hits / total, 4)

    @staticmethod
    def token_savings() -> int:
        stats = valkey.hgetall("memoryos:cache:stats")
        return int(stats.get("token_savings", "0"))
