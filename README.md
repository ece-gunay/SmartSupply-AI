# Retail Inventory Forecast

AI-powered retail inventory forecasting and decision support system.

## Project goals
- Analyze historical retail sales time series
- Compare forecasting baselines and statistical models
- Forecast future product demand
- Detect potential stock-out risks
- Provide inventory recommendations
- Expose forecasts through a FastAPI backend
- Provide a dashboard and AI assistant

## Initial structure
- `data/`: raw and processed datasets
- `notebooks/`: exploration and experiments
- `src/`: reusable Python code
- `models/`: saved trained models
- `backend/`: FastAPI application
- `frontend/`: dashboard
- `tests/`: basic tests

## Quick start

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

Put the dataset in `data/raw/sales.csv`.

Run the API:

```bash
uvicorn backend.app:app --reload
```

Then open the API documentation at `http://127.0.0.1:8000/docs`.

> The forecasting functions are intentionally simple starter implementations. They should be validated and improved after the dataset is inspected.
