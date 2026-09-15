const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const dataService = require("../services/dataService");

const RAW_DATA_PATH = path.join(__dirname, "..", "data", "raw", "retail_store_inventory.csv");
let monthlyAnalytics = null;

function getMonthlyAnalytics() {
  if (monthlyAnalytics) return monthlyAnalytics;

  const lines = fs.readFileSync(RAW_DATA_PATH, "utf8").trim().split(/\r?\n/);
  const headers = lines.shift().split(",");
  const indexes = {
    date: headers.indexOf("Date"),
    inventory: headers.indexOf("Inventory Level"),
    sold: headers.indexOf("Units Sold"),
    forecast: headers.indexOf("Demand Forecast"),
  };
  const months = new Map();

  for (const line of lines) {
    const values = line.split(",");
    const date = values[indexes.date];
    if (!date) continue;
    const month = date.slice(0, 7);
    const current = months.get(month) || { date: `${month}-01`, inventory: 0, sold: 0, forecast: 0, records: 0 };
    current.inventory += Number(values[indexes.inventory]) || 0;
    current.sold += Number(values[indexes.sold]) || 0;
    current.forecast += Number(values[indexes.forecast]) || 0;
    current.records += 1;
    months.set(month, current);
  }

  monthlyAnalytics = [...months.values()].map((item) => ({
    date: item.date,
    averageInventory: item.inventory / item.records,
    unitsSold: item.sold,
    demandForecast: item.forecast,
  }));
  return monthlyAnalytics;
}

// GET /api/inventory - tüm veri
router.get("/inventory", (req, res) => {
  res.json(dataService.getAllData());
});

// GET /api/inventory/summary - genel özet
router.get("/inventory/summary", (req, res) => {
  res.json(dataService.getSummaryStats());
});

// GET /api/inventory/analytics - aylık satış, talep ve stok trendi
router.get("/inventory/analytics", (req, res) => {
  res.json(getMonthlyAnalytics());
});

// GET /api/inventory/critical-alerts - bir günden az stok ömrü kalanlar
router.get("/inventory/critical-alerts", (req, res) => {
  res.json(dataService.getCriticalAlerts(3));
});

// GET /api/inventory/top-risks?level=HIGH&limit=10
router.get("/inventory/top-risks", (req, res) => {
  const { level, limit } = req.query;
  res.json(
    dataService.getTopRisks({
      riskLevel: level || null,
      limit: limit ? parseInt(limit, 10) : 10,
    })
  );
});

// GET /api/inventory/:storeId/:productId
router.get("/inventory/:storeId/:productId", (req, res) => {
  const row = dataService.findByStoreProduct(req.params.storeId, req.params.productId);
  if (!row) return res.status(404).json({ error: "Kayıt bulunamadı." });
  res.json(row);
});

module.exports = router;
