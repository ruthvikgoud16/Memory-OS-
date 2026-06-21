from fastapi import APIRouter
from schemas.metrics import MetricsResponse
from services.metrics import MetricsService

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("", response_model=MetricsResponse)
def get_metrics():
    return MetricsService.get_metrics()
