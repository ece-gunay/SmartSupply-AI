const { GoogleGenerativeAI } = require("@google/generative-ai");

const SYSTEM_PROMPT = `Sen SmartSupply AI sisteminin Tedarik Zinciri ve Stok Yönetimi Yapay Zeka Asistanısın.
Görevin, kullanıcının sorduğu soruları arka plandaki envanter, risk ve sipariş önerisi verilerini kullanarak
net, profesyonel ve aksiyon odaklı Türkçe yanıtlamaktır.

KURALLAR:
- SANA VERİLEN "VERİ" bloğu dışında hiçbir sayı, stok miktarı veya risk seviyesi UYDURMA. Sadece verilen veriyi kullan.
- Eğer istenen mağaza/ürün kombinasyonu VERİ bloğunda yoksa, bunu açıkça belirt ve veri bulunamadığını söyle.
- Yanıtların kısa, net, profesyonel ve aksiyon odaklı olsun (ne yapılması gerektiğini söyle).
- Sayısal değerleri Türkçe biçimde, okunaklı şekilde sun (örn: 3.002 adet, %34 gibi ondalık için virgül kullan).
- Stok riski HIGH ise "acil", MEDIUM ise "yakın takip", LOW ise "normal seviyede" gibi ifadeler kullan.
- Zaman projeksiyonu verisi varsa, projection alanındaki hesaplanmış değerleri aynen kullan; projectedInventoryRaw sıfırın altındaysa stokun tükeneceğini belirt.
- projection içindeki orderNeededToday true ise tedarik süresi nedeniyle siparişin bugün verilmesi gerektiğini açıkça söyle.
- Projeksiyon yanıtında mevcut stok, seçilen gün ufku, tahmini satış, beklenen stok ve tedarik süresi etkisini kısa biçimde özetle.
- Gerektiğinde madde imleri veya kısa listeler kullanabilirsin ama gereksiz uzatma.
- Sen bir sohbet asistanısın; selamlaşma ve nezaket cümleleri kısa tut, asıl işe odaklan.`;

let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tanımlı değil. .env dosyanı kontrol et.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });
  }
  return model;
}

/**
 * @param {string} userMessage - kullanıcının orijinal sorusu
 * @param {object|array|null} contextData - dataService'ten çekilen ilgili satır(lar)
 * @param {array} history - önceki mesajlar [{role: 'user'|'model', text: string}]
 */
async function generateAnswer(userMessage, contextData, history = []) {
  const m = getModel();

  const contextBlock = contextData
    ? `VERİ (JSON):\n${JSON.stringify(contextData, null, 2)}`
    : `VERİ: (Bu soruyla eşleşen bir mağaza/ürün kaydı bulunamadı.)`;

  const prompt = `${contextBlock}\n\nKULLANICI SORUSU: ${userMessage}`;

  const chatHistory = history.map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.text }],
  }));

  const chat = m.startChat({ history: chatHistory });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

module.exports = { generateAnswer };
