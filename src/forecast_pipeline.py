from pathlib import Path
import joblib
import pandas as pd

from src.forecasting import naive_forecast, moving_average_forecast, ses_forecast


def train_and_save_baseline(
    csv_path: str | Path,
    model_path: str | Path,
    date_col: str = "Date",
    target_col: str = "Sales",
    horizon: int = 7,
) -> None:
    """Train a simple baseline object and save it for the API."""
    df = pd.read_csv(csv_path)
    df[date_col] = pd.to_datetime(df[date_col])
    series = pd.to_numeric(df[target_col], errors="coerce").dropna()

    artifact = {
        "model_type": "moving_average",
        "window": min(7, len(series)),
        "last_date": df[date_col].max(),
        "horizon": horizon,
    }

    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, model_path)


def generate_baseline_forecast(
    series: pd.Series,
    horizon: int = 7,
) -> list[float]:
    return moving_average_forecast(series, horizon=horizon).tolist()
