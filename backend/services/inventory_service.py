from src.inventory import (
    calculate_reorder_point,
    calculate_safety_stock,
    inventory_recommendation,
)


def get_inventory_summary() -> dict:
    """Demo inventory calculation.

    Replace these placeholder values with database/current-stock data.
    """
    average_daily_demand = 100.0
    demand_std = 20.0
    lead_time_days = 3
    current_stock = 250.0

    safety_stock = calculate_safety_stock(
        demand_std=demand_std,
        lead_time_days=lead_time_days,
    )
    reorder_point = calculate_reorder_point(
        average_daily_demand=average_daily_demand,
        lead_time_days=lead_time_days,
        safety_stock=safety_stock,
    )

    recommendation = inventory_recommendation(
        current_stock=current_stock,
        forecast_demand=average_daily_demand * 7,
        reorder_point=reorder_point,
    )

    return {
        "current_stock": current_stock,
        "average_daily_demand": average_daily_demand,
        "safety_stock": round(safety_stock, 2),
        "reorder_point": round(reorder_point, 2),
        **recommendation,
    }
