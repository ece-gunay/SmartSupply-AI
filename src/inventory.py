import math


def calculate_reorder_point(
    average_daily_demand: float,
    lead_time_days: int,
    safety_stock: float,
) -> float:
    """Basic reorder point = demand during lead time + safety stock."""
    return average_daily_demand * lead_time_days + safety_stock


def calculate_safety_stock(
    demand_std: float,
    lead_time_days: int,
    service_factor: float = 1.65,
) -> float:
    """Starter safety-stock formula.

    The service factor is a simplified assumption and should be tuned for
    the business context.
    """
    return service_factor * demand_std * math.sqrt(lead_time_days)


def inventory_recommendation(
    current_stock: float,
    forecast_demand: float,
    reorder_point: float,
) -> dict:
    """Return a simple stock-risk recommendation."""
    if current_stock <= 0:
        status = "OUT_OF_STOCK"
    elif current_stock < reorder_point:
        status = "REORDER"
    elif current_stock < forecast_demand:
        status = "AT_RISK"
    else:
        status = "OK"

    order_qty = max(0.0, forecast_demand - current_stock)

    return {
        "status": status,
        "recommended_order_qty": round(order_qty, 2),
    }
