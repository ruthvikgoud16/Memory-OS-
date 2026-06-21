from fastapi import APIRouter, HTTPException
from schemas.semantic_cache import CacheStore, CacheSearch
from services.semantic_cache import SemanticCacheService
from typing import Optional, Dict, Any

router = APIRouter(prefix="/cache", tags=["Semantic Cache"])

@router.post("/store")
def store_cache(entry: CacheStore):
    prompt_hash = SemanticCacheService.store(
        prompt=entry.prompt,
        response=entry.response,
        tokens_saved=entry.tokens_saved,
        latency=entry.latency
    )
    return {"status": "success", "hash": prompt_hash}

@router.post("/search")
def search_cache(query: CacheSearch):
    result = SemanticCacheService.search(prompt=query.prompt, threshold=query.threshold)
    if result is None:
        return {"hit": False, "response": None}
    return {"hit": True, "data": result}

@router.get("/stats")
def get_cache_stats():
    return {
        "hit_rate": SemanticCacheService.hit_rate(),
        "token_savings": SemanticCacheService.token_savings()
    }
