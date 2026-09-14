const express = require("express");
const router = express.Router();
const dataService = require("../services/dataService");
const geminiService = require("../services/geminiService");

// Basit in-memory sohbet geçmişi (session bazlı olmadan, tek kullanıcı demo için)
// Prod'da bunu session/DB ile değiştir.
let conversationHistory = [];

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Geçerli bir 'message' alanı gönderilmeli." });
    }

    const { storeId, productId } = dataService.extractIds(message);
    const { isRiskList, isSummary, isLowCover, isHighestOrder, isProjection, projectionDays } = dataService.detectIntent(message);

    let contextData = null;
    let projectionData = null;
    let intent = "general";

    if (isProjection && projectionDays !== null) {
      if (storeId && productId) {
        contextData = dataService.findByStoreProduct(storeId, productId) || null;
      } else if (productId) {
        contextData = dataService.findByProduct(productId);
      } else if (storeId) {
        contextData = dataService.findByStore(storeId);
      } else {
        contextData = null;
      }
      projectionData = contextData ? dataService.projectStock(contextData, projectionDays) : null;
      intent = "stock_projection";
    } else if (storeId && productId) {
      // Senaryo 1: Ürün Durum Sorgusu (ör: "S001 mağazasındaki P0016 durumu nedir?")
      contextData = dataService.findByStoreProduct(storeId, productId) || null;
      intent = "store_product_lookup";
    } else if (isLowCover) {
      contextData = dataService.getLowCover();
      intent = "low_cover_list";
    } else if (isHighestOrder) {
      contextData = dataService.getTopOrderRecommendations();
      intent = "highest_order_recommendation";
    } else if (isRiskList || (!storeId && !productId && !isSummary)) {
      // Senaryo 2: Genel Risk Listesi (ör: "en riskli ürünler hangileri?")
      // Not: storeId/productId yoksa ve özel bir özet sorgusu değilse de risk listesine düşüyoruz,
      // çünkü bu en yaygın genel sorgu tipi.
      contextData = dataService.getTopRisks({ riskLevel: "HIGH", limit: 15 });
      intent = "top_risk_list";
    } else if (storeId && !productId) {
      contextData = dataService.findByStore(storeId);
      intent = "store_lookup";
    } else if (productId && !storeId) {
      contextData = dataService.findByProduct(productId);
      intent = "product_lookup";
    } else if (isSummary) {
      contextData = dataService.getSummaryStats();
      intent = "summary";
    }

    const answerContext = projectionData ? { records: contextData, projection: projectionData } : contextData;
    const answer = await geminiService.generateAnswer(message, answerContext, conversationHistory);

    // Geçmişe ekle (son 10 mesajla sınırlı tut)
    conversationHistory.push({ role: "user", text: message });
    conversationHistory.push({ role: "assistant", text: answer });
    conversationHistory = conversationHistory.slice(-10);

    res.json({
      answer,
      contextData,
      projectionData,
      debug: { intent, storeId, productId, matchedRecords: Array.isArray(contextData) ? contextData.length : contextData ? 1 : 0 },
    });
  } catch (err) {
    console.error("[/api/chat] Hata:", err.message);
    res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
});

// Sohbeti sıfırlama (opsiyonel yardımcı endpoint)
router.post("/chat/reset", (req, res) => {
  conversationHistory = [];
  res.json({ ok: true });
});

module.exports = router;
