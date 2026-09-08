from datetime import date, timedelta
from fastapi import APIRouter, Query
from backend.services.forecast_service import get_forecast

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("")
def forecast(horizon: int = Query(7, ge=1, le=90)):
    values = get_forecast(horizon)
    start = date.today()

    return {
        "horizon": horizon,
        "forecast": [
            {
                "date": str(start + timedelta(days=i + 1)),
                "predicted_sales": round(float(value), 2),
            }
            for i, value in enumerate(values)
        ],
    }
