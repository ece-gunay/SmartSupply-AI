# Retail Inventory Forecast

AI-powered retail inventory forecasting and decision support system.

## Project goals
- Geçmiş perakende satış zaman serisi verilerini analiz etmek ve zaman serisi dinamiklerini (trend, sezonsallık, lag/rolling etkileri) incelemek

- İstatistiksel ve makine öğrenmesi modellerini (XGBoost, LightGBM vb.) baseline tahminlerle karşılaştırarak gelecekteki ürün talebini tahmin etmek

- Tahmin edilen talep ile mevcut stok seviyelerini karşılaştırarak olası stok tükenme (stock-out) ve fazla stok risklerini tespit etmek

- Güvenlik stoğu ve iş kurallarını (business logic) kurgulayarak dinamik sipariş miktarı önerileri sunmak

- Geliştirilen talep tahmini ve stok analiz servislerini FastAPI backend mimarısı üzerinden dış dünyaya sunmak (API olarak servis etmek)

- Kullanıcıların tahminleri, risk durumlarını ve senaryo (What-If) analizlerini görselleştirebileceği interaktif bir Streamlit dashboard'u sunmak

- İşletme kararlarını ve ürün durumlarını doğal dille açıklayabilen, sisteme entegre yapay zekâ destekli bir tedarik zinciri asistanı (AI Chatbot) sunmak

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
