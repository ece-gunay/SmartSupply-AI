const fs = require("fs");
const path = require("path");

// --- Veriyi bir kez, uygulama başlarken belleğe yükle ---
const DATA_PATH = path.join(__dirname, "..", "data", "inventory_risk_analysis.json");
let riskData = [];

function loadData() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  riskData = JSON.parse(raw);
  console.log(`[dataService] ${riskData.length} mağaza-ürün kaydı yüklendi.`);
}

function getLowCover(limit = 15, storeId = null) {
  return riskData
    .filter((row) => {
      const isLowCover = Number(row["Days_of_Cover"]) < 3;
      if (!isLowCover) return false;
      if (!storeId) return true;
      return String(row["Store ID"]).toUpperCase() === String(storeId).toUpperCase();
    })
    .sort((a, b) => Number(a["Days_of_Cover"]) - Number(b["Days_of_Cover"]))
    .slice(0, limit);
}

function getTopOrderRecommendations(limit = 10) {
  return [...riskData]
    .sort((a, b) => Number(b["Recommended_Order_Qty"]) - Number(a["Recommended_Order_Qty"]))
    .slice(0, limit);
}
loadData();

function getAllData() {
  return riskData;
}

// Belirli bir mağaza + ürün kombinasyonunu bul
function findByStoreProduct(storeId, productId) {
  return riskData.find(
    (row) =>
      row["Store ID"].toUpperCase() === storeId.toUpperCase() &&
      row["Product ID"].toUpperCase() === productId.toUpperCase()
  );
}

function findByStore(storeId) {
  return riskData.filter(
    (row) => row["Store ID"].toUpperCase() === storeId.toUpperCase()
  );
}

function findByProduct(productId) {
  return riskData.filter(
    (row) => row["Product ID"].toUpperCase() === productId.toUpperCase()
  );
}

// Risk seviyesine göre filtrele ve en acil olanları öne çıkar
// (sıralama: önce Risk Level HIGH>MEDIUM>LOW, sonra Days_of_Cover artan - yani en az günü kalan en üstte)
const RISK_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function getTopRisks({ riskLevel = null, limit = 10 } = {}) {
  let rows = [...riskData];
  if (riskLevel) {
    rows = rows.filter((r) => r["Risk Level"].toUpperCase() === riskLevel.toUpperCase());
  }
  rows.sort((a, b) => {
    const rA = RISK_ORDER[a["Risk Level"]] ?? 3;
    const rB = RISK_ORDER[b["Risk Level"]] ?? 3;
    if (rA !== rB) return rA - rB;
    return a["Days_of_Cover"] - b["Days_of_Cover"];
  });
  return rows.slice(0, limit);
}

function getSummaryStats() {
  const total = riskData.length;
  const byLevel = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  let totalRecommendedOrder = 0;
  for (const row of riskData) {
    const lvl = row["Risk Level"];
    if (byLevel[lvl] !== undefined) byLevel[lvl] += 1;
    totalRecommendedOrder += row["Recommended_Order_Qty"] || 0;
  }

  return { total, byLevel, totalRecommendedOrder };
}

function getCriticalAlerts(limit = 3) {
  return riskData
    .filter((row) => Number(row["Days_of_Cover"]) < 1)
    .sort((a, b) => Number(a["Days_of_Cover"]) - Number(b["Days_of_Cover"]))
    .slice(0, limit);
}

function projectStock(rows, days) {
  const horizonDays = Number(days);
  if (!Number.isFinite(horizonDays) || horizonDays < 0) {
    throw new Error("Projeksiyon günü sıfır veya daha büyük bir sayı olmalı.");
  }

  return (Array.isArray(rows) ? rows : [rows]).filter(Boolean).map((row) => {
    const currentInventory = Number(row["Current_Inventory"]);
    const dailyForecast = Number(row["Avg_Daily_Forecast"]);
    const leadTimeDemand = Number(row["Lead_Time_Demand"]);
    const leadTimeDays = dailyForecast > 0 ? leadTimeDemand / dailyForecast : null;
    const projectedInventory = currentInventory - dailyForecast * horizonDays;
    return {
      "Store ID": row["Store ID"],
      "Product ID": row["Product ID"],
      currentInventory,
      horizonDays,
      projectedInventory: Math.max(0, projectedInventory),
      projectedInventoryRaw: projectedInventory,
      estimatedSales: dailyForecast * horizonDays,
      dailyForecast,
      leadTimeDays,
      stockoutWithinHorizon: projectedInventory <= 0,
      orderNeededToday: leadTimeDays !== null && Number(row["Days_of_Cover"]) <= leadTimeDays,
    };
  });
}

// --- Kullanıcı mesajından Store ID / Product ID / niyet çıkarma ---
// Store ID formatı: S001, s02, S1... -> normalize edilir: S + 3 haneli
// Product ID formatı: P0016, p3... -> normalize edilir: P + 4 haneli
function extractIds(message) {
  const storeMatch = message.match(/\bS\s?0*(\d{1,4})\b/i);
  const productMatch = message.match(/\bP\s?0*(\d{1,4})\b/i);

  const storeId = storeMatch ? `S${storeMatch[1].padStart(3, "0")}` : null;
  const productId = productMatch ? `P${productMatch[1].padStart(4, "0")}` : null;

  return { storeId, productId };
}

function detectIntent(message) {
  const lower = message.toLowerCase();

  const riskListKeywords = [
    "en riskli", "acil sipariş", "risk listesi", "yüksek risk",
    "en acil", "hangi ürünler", "tükenme riski", "kritik ürün",
  ];
  const summaryKeywords = ["genel durum", "özet", "kaç ürün", "toplam kaç", "istatistik"];

  const lowCoverPatterns = [
    /(?:3|üç)\s*günden\s+(?:az|kısa|daha az)/i,
    /\b(?:\d+(?:[.,]\d+)?)\s*günden\s+(?:az|kısa|daha az)\b/i,
    /\bstok\s*ömrü\s*(?:\d+(?:[.,]\d+)?)\s*günden\s+(?:az|kısa|daha az)\b/i,
    /\b(?:3|üç)\s*günden\s+az\s+olan\b/i,
    /\b(?:3|üç)\s*günden\s+az\s+ürün\b/i,
    /\bkısa\s+stok\s+ömrü\b/i,
  ];

  const isRiskList = riskListKeywords.some((k) => lower.includes(k));
  const isSummary = summaryKeywords.some((k) => lower.includes(k));
  const isLowCover = lowCoverPatterns.some((pattern) => pattern.test(lower));
  const isHighestOrder = lower.includes("en yüksek sipariş") || lower.includes("en fazla sipariş");
  const projectionMatch = lower.match(/(?:\b|\.)(\d{1,3})\s*\.?\s*(?:gün|günde|günlük)\b/);
  const projectionSignal = /(sonra|sonunda|durum|kalır|olacak|kaç\s*gün|kalan\s*stok|tükenir|stok\s*durumu)/i.test(lower);
  const isProjection = Boolean(projectionMatch) && projectionSignal && !isLowCover;
  const projectionDays = projectionMatch ? Number(projectionMatch[1]) : null;

  return { isRiskList, isSummary, isLowCover, isHighestOrder, isProjection, projectionDays };
}

module.exports = {
  getAllData,
  findByStoreProduct,
  findByStore,
  findByProduct,
  getTopRisks,
  getSummaryStats,
  getCriticalAlerts,
  getLowCover,
  getTopOrderRecommendations,
  projectStock,
  extractIds,
  detectIntent,
};
