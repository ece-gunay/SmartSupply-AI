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

  const isRiskList = riskListKeywords.some((k) => lower.includes(k));
  const isSummary = summaryKeywords.some((k) => lower.includes(k));

  return { isRiskList, isSummary };
}

module.exports = {
  getAllData,
  findByStoreProduct,
  findByStore,
  findByProduct,
  getTopRisks,
  getSummaryStats,
  extractIds,
  detectIntent,
};
