import pandas as pd
from src.forecasting import naive_forecast, moving_average_forecast


def test_naive_forecast_length():
    series = pd.Series([10, 20, 30])
    result = naive_forecast(series, horizon=5)
    assert len(result) == 5
    assert all(result == 30)


def test_moving_average_forecast():
    series = pd.Series([10, 20, 30])
    result = moving_average_forecast(series, horizon=2, window=3)
    assert len(result) == 2
    assert result[0] == 20
