import json
from typing import List, Dict, Any
from valkey_client.client import valkey
from fastapi import HTTPException

class TimelineService:
    @staticmethod
    def replay(session_id: str) -> List[Dict[str, Any]]:
        # Verify session exists
        session_key = f"memoryos:session:{session_id}"
        if not valkey.get_client().exists(session_key):
            raise HTTPException(status_code=404, detail="Session not found")
            
        stream_key = f"memoryos:timeline:stream:{session_id}"
        if not valkey.get_client().exists(stream_key):
            return []
            
        # Retrieve all stream events chronologically
        raw_entries = valkey.xrange(stream_key)
        
        # Fetch session memories written
        session_mem_key = f"memoryos:memory:session:{session_id}"
        memories_raw = valkey.hgetall(session_mem_key)
        memories = {}
        for key, val_str in memories_raw.items():
            try:
                memories[key] = json.loads(val_str)
            except Exception:
                continue

        steps = []
        agent_order = ["ResearchAgent", "WriterAgent", "ReviewerAgent"]
        
        for agent_name in agent_order:
            agent_events = [
                e for _, e in raw_entries 
                if e.get("agent_name") == agent_name
            ]
            if not agent_events:
                continue
                
            start_event = next((e for e in agent_events if e.get("event_type") == "execution_start"), None)
            complete_event = next((e for e in agent_events if e.get("event_type") == "completion"), None)
            
            # Filter memories authored by this agent
            agent_memories = {
                k: v for k, v in memories.items() 
                if v.get("author") == agent_name
            }
            
            try:
                input_payload = json.loads(start_event.get("payload", "{}")) if start_event else {}
            except Exception:
                input_payload = {}
                
            try:
                output_payload = json.loads(complete_event.get("payload", "{}")) if complete_event else {}
            except Exception:
                output_payload = {}

            steps.append({
                "agent_name": agent_name,
                "status": "completed" if complete_event else ("running" if start_event else "pending"),
                "start_time": float(start_event.get("timestamp")) if start_event else None,
                "end_time": float(complete_event.get("timestamp")) if complete_event else None,
                "input": input_payload,
                "output": output_payload,
                "memories": agent_memories
            })
            
        return steps
