import time
import uuid
import json
from typing import Optional, List, Dict, Any
from valkey_client.client import valkey
from schemas.event import EventAdd, EventAddResponse, EventListResponse, EventResponseItem
from fastapi import HTTPException

class EventService:
    @staticmethod
    def add_event(event_in: EventAdd) -> EventAddResponse:
        session_key = f"memoryos:session:{event_in.session_id}"
        if not valkey.get_client().exists(session_key):
            raise HTTPException(status_code=404, detail="Session not found")
            
        event_id = str(uuid.uuid4())
        now = time.time()
        
        # Serialize payload
        payload_str = json.dumps(event_in.payload)
        
        # Write to session stream
        session_stream_key = f"memoryos:timeline:stream:{event_in.session_id}"
        valkey.xadd(session_stream_key, {
            "event_id": event_id,
            "timestamp": str(now),
            "agent_name": event_in.agent_name,
            "event_type": event_in.event_type,
            "payload": payload_str
        })
        
        # Write to global stream
        valkey.xadd("memoryos:timeline:global", {
            "session_id": event_in.session_id,
            "event_id": event_id,
            "timestamp": str(now),
            "agent_name": event_in.agent_name,
            "event_type": event_in.event_type,
            "payload": payload_str
        })
        
        # Increment metrics
        valkey.hincrby("memoryos:metrics:global", "total_events_logged", 1)
        valkey.hincrby("memoryos:metrics:agents", f"{event_in.agent_name}:invocations", 1)
        
        # Also publish message to pub/sub to alert agents of the event
        pubsub_channel = f"memoryos:pubsub:session:{event_in.session_id}"
        pubsub_message = json.dumps({
            "message_id": event_id,
            "from_agent": event_in.agent_name,
            "to_agent": "all",
            "message_type": event_in.event_type,
            "content": event_in.payload,
            "timestamp": now
        })
        valkey.publish(pubsub_channel, pubsub_message)
        valkey.hincrby("memoryos:metrics:global", "total_messages_routed", 1)
        
        # Store message history
        valkey.xadd(f"memoryos:pubsub:history:{event_in.session_id}", {
            "message_id": event_id,
            "from_agent": event_in.agent_name,
            "to_agent": "all",
            "message_type": event_in.event_type,
            "content": payload_str,
            "timestamp": str(now)
        })
        
        return EventAddResponse(
            status="success",
            event_id=event_id,
            session_id=event_in.session_id,
            timestamp=now
        )

    @staticmethod
    def list_events(
        session_id: Optional[str] = None,
        limit: int = 50,
        order: str = "asc"
    ) -> EventListResponse:
        
        if session_id:
            stream_key = f"memoryos:timeline:stream:{session_id}"
            session_key = f"memoryos:session:{session_id}"
            if not valkey.get_client().exists(session_key):
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            stream_key = "memoryos:timeline:global"

        if not valkey.get_client().exists(stream_key):
            return EventListResponse(session_id=session_id, events=[])

        # Fetch stream records using xrange or xrevrange
        if order.lower() == "desc":
            raw_entries = valkey.xrevrange(stream_key, count=limit)
        else:
            raw_entries = valkey.xrange(stream_key, count=limit)

        events_list = []
        for entry_id, fields in raw_entries:
            try:
                payload = json.loads(fields.get("payload", "{}"))
            except json.JSONDecodeError:
                payload = {}
                
            # If global stream, fields will have event_id, timestamp, etc.
            events_list.append(EventResponseItem(
                event_id=fields.get("event_id", entry_id),
                timestamp=float(fields.get("timestamp", time.time())),
                agent_name=fields.get("agent_name", "unknown"),
                event_type=fields.get("event_type", "unknown"),
                payload=payload
            ))

        return EventListResponse(
            session_id=session_id,
            events=events_list
        )
