from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: str
    predicted_sales: float


class ChatRequest(BaseModel):
    message: str
