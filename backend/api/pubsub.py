from fastapi import APIRouter
from schemas.pubsub import PubSubPublish
from services.pubsub import PubSubService

router = APIRouter(prefix="/pubsub", tags=["PubSub"])

@router.post("/publish")
def publish_message(payload: PubSubPublish):
    subscribers_notified = PubSubService.publish(channel=payload.channel, message=payload.message)
    return {"status": "success", "subscribers_notified": subscribers_notified}
