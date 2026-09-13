# SmartSupply AI — Tedarik Zinciri Chatbot

Node.js (Express) backend + Gemini API ile çalışan, `inventory_risk_analysis` verisine dayalı
stok risk asistanı. Frontend statik HTML/CSS/JS (React'e gerek yok, tek parça).

## Klasör yapısı
```
smartsupply-chatbot/
├── data/
│   └── inventory_risk_analysis.json   ← senin CSV/parquet verinden üretildi
├── services/
│   ├── dataService.js    ← veriyi yükler, ID/niyet çıkarır, filtreler
│   └── geminiService.js  ← Gemini API çağrısı + sistem promptu
├── routes/
│   ├── chat.js           ← POST /api/chat (ana chatbot mantığı)
│   └── inventory.js       ← ham veriye erişim için yardımcı GET endpoint'leri
├── public/                ← frontend (index.html, style.css, script.js)
├── server.js
├── package.json
└── .env.example
```

## Kurulum

1. Bağımlılıkları yükle:
   ```bash
   npm install
   ```

2. `.env.example` dosyasını `.env` olarak kopyala ve kendi Gemini API key'ini gir:
   ```bash
   cp .env.example .env
   ```
   Key'i https://aistudio.google.com/app/apikey adresinden ücretsiz alabilirsin.

3. Sunucuyu başlat:
   ```bash
   npm start
   ```
   veya geliştirme sırasında otomatik yeniden başlatma için:
   ```bash
   npm run dev
   ```

4. Tarayıcıda aç: `http://localhost:3000`

## Nasıl çalışıyor?

1. Kullanıcı mesaj gönderir → `POST /api/chat`
2. `dataService.extractIds()` mesajdan mağaza kodu (S001) ve ürün kodu (P0016) çıkarır (regex).
3. `dataService.detectIntent()` mesajın "genel risk listesi" mi yoksa "özet" mi istediğini anlar.
4. Bulunan niyete göre `inventory_risk_analysis.json` içinden ilgili satır(lar) çekilir.
5. Bu satırlar + kullanıcının orijinal sorusu, sistem promptuyla birlikte Gemini'ye gönderilir.
   **Önemli:** Gemini'ye "sadece sana verilen VERİ bloğundaki sayıları kullan, uydurma" talimatı
   veriliyor — böylece halüsinasyon riski minimize ediliyor.
6. Gemini'nin ürettiği Türkçe, aksiyon odaklı cevap kullanıcıya döner.

## Desteklenen sorgu tipleri

| Kullanıcı sorusu | Ne olur |
|---|---|
| "S001 mağazasındaki P0016 durumu nedir?" | Tek satır lookup (mağaza+ürün) |
| "En riskli ürünler hangileri?" / "acil sipariş" | Risk seviyesine göre sıralı ilk 15 kayıt |
| "S001'deki ürünler nasıl?" | Sadece mağaza ID'si varsa, o mağazanın tüm ürünleri |
| "P0016 hangi mağazalarda riskli?" | Sadece ürün ID'si varsa, tüm mağazalardaki o ürün |
| "Genel durum özeti nedir?" | Toplam risk dağılımı (HIGH/MEDIUM/LOW sayıları) |

## Diğer ML dosyaların (opsiyonel genişletme)

Şu an chatbot sadece hazır `inventory_risk_analysis` tablosunu kullanıyor (en hızlı, en güvenilir yol —
model her seferinde yeniden çalıştırılmıyor). Eğer ileride "P0020 için yarının talebini tahmin et"
gibi anlık tahmin istersen, `final_ml_model.pkl` + `final_ml_model_metadata.pkl` dosyalarını
bir Python mikroservisi (FastAPI, ayrı bir process) olarak ayağa kaldırıp Node backend'den
`fetch` ile çağırman gerekir — LightGBM modelini doğrudan Node.js içinde çalıştıramazsın.
İstersen bu mikroservisi de ayrıca kurabilirim.

## Notlar / production öncesi yapılacaklar

- Şu an sohbet geçmişi tek bir global değişkende tutuluyor (demo amaçlı). Çoklu kullanıcı için
  session ID bazlı bir yapıya (örn. `express-session` + Redis) geçirilmeli.
- Gemini API key'i asla frontend'e veya git'e commit etme (`.env` zaten `.gitignore`'da olmalı).
- Veri şu an dosyadan okunuyor; gerçek kullanımda bu tablo muhtemelen bir DB'den (Postgres vb.)
  ya da periyodik olarak yeniden üretilen bir job'dan besleniyor olacak.
