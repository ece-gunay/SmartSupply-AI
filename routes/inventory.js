const express = require("express");
const router = express.Router();
const dataService = require("../services/dataService");

// GET /api/inventory - tüm veri
router.get("/inventory", (req, res) => {
  res.json(dataService.getAllData());
});

// GET /api/inventory/summary - genel özet
router.get("/inventory/summary", (req, res) => {
  res.json(dataService.getSummaryStats());
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
