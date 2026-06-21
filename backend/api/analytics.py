from fastapi import APIRouter
from services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics Leaderboards"])

@router.get("/leaderboards")
def get_analytics_leaderboards():
    return AnalyticsService.get_leaderboards()
