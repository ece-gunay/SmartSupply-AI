from pathlib import Path
import pandas as pd


def load_data(path: str | Path) -> pd.DataFrame:
    """Load the raw sales CSV."""
    df = pd.read_csv(path)
    return df


def prepare_time_series(
    df: pd.DataFrame,
    date_col: str = "Date",
    target_col: str = "Sales",
    freq: str = "D",
) -> pd.DataFrame:
    """Convert the data into a regular time series.

    The function currently aggregates multiple observations on the same date.
    If the dataset contains Store/Product columns, filter or group by those
    dimensions before calling this function.
    """
    data = df.copy()

    if date_col not in data.columns:
        raise ValueError(f"Missing date column: {date_col}")
    if target_col not in data.columns:
        raise ValueError(f"Missing target column: {target_col}")

    data[date_col] = pd.to_datetime(data[date_col], errors="coerce")
    data[target_col] = pd.to_numeric(data[target_col], errors="coerce")
    data = data.dropna(subset=[date_col, target_col])

    series = (
        data.set_index(date_col)[target_col]
        .resample(freq)
        .sum()
        .asfreq(freq)
        .fillna(0)
        .rename(target_col)
        .reset_index()
    )

    return series


def save_processed_data(df: pd.DataFrame, path: str | Path) -> None:
    """Save processed data, creating the parent directory if needed."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
