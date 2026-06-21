import uuid
import time
import json
from typing import Optional, Dict, Any
from valkey_client.client import valkey
from schemas.session import SessionCreate, SessionResponse, SessionDeleteResponse
from fastapi import HTTPException

class SessionService:
    @staticmethod
    def create_session(session_in: SessionCreate) -> SessionResponse:
        session_id = str(uuid.uuid4())
        now = time.time()
        
        # Serialize metadata
        metadata_str = json.dumps(session_in.metadata)
        
        session_key = f"memoryos:session:{session_id}"
        
        valkey.hset(session_key, {
            "id": session_id,
            "name": session_in.name,
            "status": "active",
            "created_at": str(now),
            "updated_at": str(now),
            "metadata": metadata_str
        })
        
        # Add to active set and all set
        valkey.sadd("memoryos:session:active", session_id)
        valkey.sadd("memoryos:session:all", session_id)
        
        # Increment metric
        valkey.hincrby("memoryos:metrics:global", "total_sessions_created", 1)
        
        return SessionResponse(
            id=session_id,
            name=session_in.name,
            status="active",
            created_at=now,
            updated_at=now,
            metadata=session_in.metadata
        )

    @staticmethod
    def get_session(session_id: str) -> SessionResponse:
        session_key = f"memoryos:session:{session_id}"
        
        if not valkey.get_client().exists(session_key):
            raise HTTPException(status_code=404, detail="Session not found")
            
        data = valkey.hgetall(session_key)
        
        try:
            metadata = json.loads(data.get("metadata", "{}"))
        except json.JSONDecodeError:
            metadata = {}
            
        return SessionResponse(
            id=data["id"],
            name=data["name"],
            status=data["status"],
            created_at=float(data["created_at"]),
            updated_at=float(data["updated_at"]),
            metadata=metadata
        )

    @staticmethod
    def delete_session(session_id: str) -> SessionDeleteResponse:
        session_key = f"memoryos:session:{session_id}"
        
        if not valkey.get_client().exists(session_key):
            raise HTTPException(status_code=404, detail="Session not found")
            
        now = time.time()
        
        # Update status to completed
        valkey.hset(session_key, {
            "status": "completed",
            "updated_at": str(now)
        })
        
        # Remove from active list
        valkey.srem("memoryos:session:active", session_id)
        
        return SessionDeleteResponse(
            status="success",
            message=f"Session {session_id} has been completed.",
            session_id=session_id,
            completed_at=now
        )
