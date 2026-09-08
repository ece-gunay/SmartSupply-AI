from src.inventory import calculate_reorder_point


def test_reorder_point():
    result = calculate_reorder_point(
        average_daily_demand=100,
        lead_time_days=3,
        safety_stock=50,
    )
    assert result == 350
