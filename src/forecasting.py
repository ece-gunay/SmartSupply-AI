import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import SimpleExpSmoothing, ExponentialSmoothing


def naive_forecast(series: pd.Series, horizon: int = 7) -> np.ndarray:
    """Repeat the last observed value."""
    if len(series) == 0:
        raise ValueError("Series cannot be empty.")
    return np.repeat(series.iloc[-1], horizon)


def moving_average_forecast(
    series: pd.Series, horizon: int = 7, window: int = 7
) -> np.ndarray:
    """Forecast using the latest rolling mean."""
    if len(series) < window:
        window = len(series)
    if window == 0:
        raise ValueError("Series cannot be empty.")
    value = series.iloc[-window:].mean()
    return np.repeat(value, horizon)


def ses_forecast(series: pd.Series, horizon: int = 7) -> np.ndarray:
    """Simple Exponential Smoothing forecast."""
    model = SimpleExpSmoothing(series).fit(optimized=True)
    return model.forecast(horizon).to_numpy()


def holt_forecast(series: pd.Series, horizon: int = 7) -> np.ndarray:
    """Holt's trend method."""
    model = ExponentialSmoothing(
        series,
        trend="add",
        seasonal=None,
        initialization_method="estimated",
    ).fit(optimized=True)
    return model.forecast(horizon).to_numpy()


def arima_forecast(
    series: pd.Series,
    horizon: int = 7,
    order: tuple[int, int, int] = (1, 1, 1),
) -> np.ndarray:
    """ARIMA forecast with a starter order."""
    model = ARIMA(series, order=order).fit()
    return model.forecast(horizon).to_numpy()
