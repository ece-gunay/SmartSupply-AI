from pathlib import Path
import pandas as pd

from config.config import PROCESSED_DATA_DIR
from src.forecasting import moving_average_forecast


def get_forecast(horizon: int = 7) -> list[float]:
    """Generate a starter moving-average forecast from processed data."""
    path = PROCESSED_DATA_DIR / "daily_sales.csv"

    if not path.exists():
        # Demo fallback until the real dataset is processed.
        return [0.0] * horizon

    df = pd.read_csv(path)
    series = pd.to_numeric(df["Sales"], errors="coerce").dropna()

    if series.empty:
        return [0.0] * horizon

    return moving_average_forecast(series, horizon=horizon).tolist()
