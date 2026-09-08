from fastapi import FastAPI
from backend.routes.forecast import router as forecast_router
from backend.routes.inventory import router as inventory_router
from backend.routes.chatbot import router as chatbot_router

app = FastAPI(
    title="Retail Inventory Forecast API",
    version="0.1.0",
    description="Forecasting and inventory decision-support backend.",
)

app.include_router(forecast_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(chatbot_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Retail Inventory Forecast API is running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
