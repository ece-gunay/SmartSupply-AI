const chatLog = document.getElementById("chat-log");
const form = document.getElementById("composer");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const statBlock = document.getElementById("stat-block");
const criticalAlerts = document.getElementById("critical-alerts");
const inventoryView = document.getElementById("inventory-view");
const analysisView = document.getElementById("analysis-view");
const tableBody = document.getElementById("inventory-table-body");
const tableFilter = document.getElementById("table-filter");
const trendChart = document.getElementById("trend-chart");
const whatIfProduct = document.getElementById("what-if-product");
const whatIfResult = document.getElementById("what-if-result");
let inventoryData = [];
let analyticsData = [];

function addMessage(text, sender, contextData = null, projectionData = null) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${sender}`;
  if (sender === "bot") {
    const label = document.createElement("div");
    label.className = "bot-label";
    label.textContent = "🤖 SmartSupply AI";
    wrap.appendChild(label);
  }
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = sender === "bot" ? formatBotText(text) : escapeHtml(text);
  wrap.appendChild(bubble);
  if (sender === "bot") {
    const card = createResponseCard(contextData);
    if (card) wrap.appendChild(card);
    const projectionCard = createProjectionCard(projectionData);
    if (projectionCard) wrap.appendChild(projectionCard);
  }
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}

function createProjectionCard(projectionData) {
  if (!Array.isArray(projectionData) || !projectionData.length) return null;
  const card = document.createElement("div");
  card.className = "response-card projection-card";
  card.innerHTML = `<div class="card-title">📈 Zaman projeksiyonu · ${formatNumber(projectionData[0].horizonDays)} gün</div>`;
  projectionData.forEach((item) => {
    const row = document.createElement("div");
    row.className = "projection-row";
    row.innerHTML = `
      <strong>${escapeHtml(item["Store ID"])} / ${escapeHtml(item["Product ID"])}</strong>
      <span>${item.stockoutWithinHorizon ? "Stok tükenir" : `${formatNumber(item.projectedInventory)} adet kalır`}</span>
      <small>${item.orderNeededToday ? "Tedarik süresi nedeniyle bugün sipariş gerekli." : "Mevcut stok tedarik süresini karşılıyor."}</small>`;
    card.appendChild(row);
  });
  return card;
}

function createResponseCard(contextData) {
  if (!contextData || Array.isArray(contextData) || !contextData["Product ID"]) return null;
  const row = contextData;
  const card = document.createElement("div");
  card.className = "response-card";
  const risk = row["Risk Level"] || "—";
  card.innerHTML = `
    <div class="card-title">📦 ${escapeHtml(row["Store ID"])} / ${escapeHtml(row["Product ID"])}</div>
    <div class="card-grid">
      <span>Mevcut stok <strong>${formatNumber(row["Current_Inventory"])} adet</strong></span>
      <span>Risk <strong class="risk-${risk.toLowerCase()}">${escapeHtml(risk)}</strong></span>
      <span>Stok ömrü <strong>${formatNumber(row["Days_of_Cover"])} gün</strong></span>
      <span>Sipariş önerisi <strong>${formatNumber(row["Recommended_Order_Qty"])} adet</strong></span>
    </div>
    <button class="explain-btn" type="button">Gerekçeyi ve formülü gör</button>
    <div class="explanation" hidden>
      ${formatNumber(row["Lead_Time_Demand"])} günlük tedarik talebi +
      ${formatNumber(row["Safety_Stock"])} emniyet stoğu -
      ${formatNumber(row["Current_Inventory"])} eldeki stok =
      <strong>${formatNumber(row["Recommended_Order_Qty"])} adet</strong>
    </div>`;
  card.querySelector(".explain-btn").addEventListener("click", (event) => {
    const explanation = card.querySelector(".explanation");
    explanation.hidden = !explanation.hidden;
    event.currentTarget.textContent = explanation.hidden ? "Gerekçeyi ve formülü gör" : "Gerekçeyi gizle";
  });
  return card;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Basit markdown-ish: **kalın** -> <strong>, satır başı "- " -> madde imi zaten \n ile korunuyor
function formatBotText(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function addTypingIndicator() {
  const wrap = document.createElement("div");
  wrap.className = "msg bot typing";
  wrap.innerHTML = `<div class="msg-bubble">SmartSupply AI yazıyor…</div>`;
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
}

async function sendMessage(text) {
  addMessage(text, "user");
  input.value = "";
  sendBtn.disabled = true;
  const typingEl = addTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    typingEl.remove();

    if (!res.ok) {
      addMessage(`Hata: ${data.error || "Bilinmeyen bir sorun oluştu."}`, "bot");
    } else {
      addMessage(data.answer, "bot", data.contextData, data.projectionData);
    }
  } catch (err) {
    typingEl.remove();
    addMessage(`Sunucuya ulaşılamadı: ${err.message}`, "bot");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  sendMessage(text);
});

document.querySelectorAll(".quick-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const q = btn.getAttribute("data-q");
    sendMessage(q);
  });
});

// Sol paneldeki canlı risk özetini yükle
async function loadSummary() {
  try {
    const res = await fetch("/api/inventory/summary");
    const s = await res.json();
    statBlock.innerHTML = `
      <div class="stat-row high"><span class="label">Yüksek risk</span><span class="n">${s.byLevel.HIGH}</span></div>
      <div class="stat-row med"><span class="label">Orta risk</span><span class="n">${s.byLevel.MEDIUM}</span></div>
      <div class="stat-row low"><span class="label">Düşük risk</span><span class="n">${s.byLevel.LOW}</span></div>
      <div class="stat-row"><span class="label">Toplam kayıt</span><span class="n">${s.total}</span></div>
      <div class="order-kpi"><span>Toplam önerilen sipariş</span><strong>${formatNumber(s.totalRecommendedOrder)} adet</strong></div>
    `;
  } catch (err) {
    statBlock.innerHTML = `<div class="stat-row skeleton"><span>Özet yüklenemedi</span></div>`;
  }
}

async function loadCriticalAlerts() {
  try {
    const res = await fetch("/api/inventory/critical-alerts");
    const rows = await res.json();
    criticalAlerts.innerHTML = rows.length ? rows.map((row) => `
      <button class="critical-alert" data-q="${escapeHtml(`${row["Store ID"]} mağazasındaki ${row["Product ID"]} ürününün durumu nedir?`)}">
        <span>🔴</span><strong>${escapeHtml(row["Store ID"])} / ${escapeHtml(row["Product ID"])}</strong>
        <small>${formatNumber(row["Days_of_Cover"] * 24)} saatlik stok</small>
      </button>`).join("") : `<div class="alert-skeleton">Kritik ürün bulunamadı.</div>`;
    criticalAlerts.querySelectorAll(".critical-alert").forEach((button) => {
      button.addEventListener("click", () => sendMessage(button.dataset.q));
    });
  } catch (err) {
    criticalAlerts.innerHTML = `<div class="alert-skeleton">Uyarılar yüklenemedi.</div>`;
  }
}

function renderInventoryTable() {
  const query = tableFilter.value.trim().toLowerCase();
  const rows = inventoryData.filter((row) =>
    [row["Store ID"], row["Product ID"], row["Risk Level"]].some((value) => String(value).toLowerCase().includes(query))
  );
  tableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row["Store ID"])}</td><td>${escapeHtml(row["Product ID"])}</td>
      <td>${formatNumber(row["Current_Inventory"])}</td><td>${formatNumber(row["Days_of_Cover"])} gün</td>
      <td><span class="risk-pill risk-${row["Risk Level"].toLowerCase()}">${escapeHtml(row["Risk Level"])}</span></td>
      <td class="order-cell">${formatNumber(row["Recommended_Order_Qty"])}</td>
    </tr>`).join("") || `<tr><td colspan="6">Eşleşen kayıt bulunamadı.</td></tr>`;
}

async function loadInventory() {
  const res = await fetch("/api/inventory");
  if (!res.ok) throw new Error("Envanter yüklenemedi.");
  inventoryData = await res.json();
  renderInventoryTable();
  loadWhatIfProducts();
}

function loadWhatIfProducts() {
  whatIfProduct.innerHTML = inventoryData.map((row, index) =>
    `<option value="${index}">${escapeHtml(row["Store ID"])} / ${escapeHtml(row["Product ID"])}</option>`
  ).join("");
  ["what-if-order", "what-if-demand", "what-if-days"].forEach((id) => document.getElementById(id).addEventListener("input", updateWhatIf));
  whatIfProduct.addEventListener("change", updateWhatIf);
  updateWhatIf();
}

function updateWhatIf() {
  const row = inventoryData[Number(whatIfProduct.value)];
  if (!row) return;
  const order = Math.max(0, Number(document.getElementById("what-if-order").value) || 0);
  const demandChange = Number(document.getElementById("what-if-demand").value) || 0;
  const days = Math.max(1, Number(document.getElementById("what-if-days").value) || 1);
  const dailyDemand = Number(row["Avg_Daily_Forecast"]) * (1 + demandChange / 100);
  const projected = Number(row["Current_Inventory"]) + order - dailyDemand * days;
  const cover = dailyDemand > 0 ? Math.max(0, (Number(row["Current_Inventory"]) + order) / dailyDemand) : null;
  const exhausted = projected <= 0;
  whatIfResult.className = `what-if-result ${exhausted ? "negative" : "positive"}`;
  whatIfResult.innerHTML = `<strong>${exhausted ? "⚠ Stok tükeniyor" : "✓ Stok yeterli"}</strong>
    <span>${escapeHtml(row["Store ID"])} / ${escapeHtml(row["Product ID"])} · ${formatNumber(Math.max(0, projected))} adet kalır</span>
    <small>${formatNumber(days)} gün sonunda · Yeni stok ömrü yaklaşık ${formatNumber(cover)} gün</small>`;
}

function drawTrendChart() {
  if (!trendChart || !analyticsData.length) return;
  const ctx = trendChart.getContext("2d");
  const width = trendChart.clientWidth || 700;
  const height = 250;
  const ratio = window.devicePixelRatio || 1;
  trendChart.width = width * ratio;
  trendChart.height = height * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, width, height);
  const pad = { left: 42, right: 16, top: 18, bottom: 34 };
  const max = Math.max(...analyticsData.flatMap((item) => [item.unitsSold, item.demandForecast])) || 1;
  const x = (index) => pad.left + (index * (width - pad.left - pad.right)) / Math.max(1, analyticsData.length - 1);
  const y = (value) => height - pad.bottom - (value / max) * (height - pad.top - pad.bottom);
  ctx.strokeStyle = "#2a3341";
  ctx.fillStyle = "#8b96a5";
  ctx.font = "10px Inter, sans-serif";
  for (let i = 0; i <= 4; i += 1) {
    const value = (max * i) / 4;
    const lineY = y(value);
    ctx.beginPath(); ctx.moveTo(pad.left, lineY); ctx.lineTo(width - pad.right, lineY); ctx.stroke();
    ctx.fillText(formatNumber(value), 2, lineY + 3);
  }
  const drawLine = (key, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
    analyticsData.forEach((item, index) => index ? ctx.lineTo(x(index), y(item[key])) : ctx.moveTo(x(index), y(item[key])));
    ctx.stroke();
  };
  drawLine("unitsSold", "#e8a33d");
  drawLine("demandForecast", "#4fa89a");
  ctx.fillStyle = "#8b96a5";
  analyticsData.forEach((item, index) => {
    if (index % Math.max(1, Math.ceil(analyticsData.length / 8)) === 0) {
      ctx.fillText(item.date.slice(0, 7), x(index) - 18, height - 12);
    }
  });
}

async function loadAnalytics() {
  if (analyticsData.length) { drawTrendChart(); return; }
  const res = await fetch("/api/inventory/analytics");
  if (!res.ok) throw new Error("Analiz verisi yüklenemedi.");
  analyticsData = await res.json();
  drawTrendChart();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
    const assistant = tab.dataset.tab === "assistant";
    chatLog.hidden = !assistant;
    document.querySelector(".composer").hidden = !assistant;
    inventoryView.hidden = assistant || tab.dataset.tab !== "inventory";
    analysisView.hidden = assistant || tab.dataset.tab !== "analysis";
    if (!assistant && !inventoryData.length) loadInventory().catch(() => {
      tableBody.innerHTML = `<tr><td colspan="6">Tablo yüklenemedi.</td></tr>`;
    });
    if (tab.dataset.tab === "analysis") {
      if (!inventoryData.length) loadInventory().catch(() => {});
      loadAnalytics().catch(() => {});
    }
  });
});

tableFilter.addEventListener("input", renderInventoryTable);

loadSummary();
loadCriticalAlerts();
window.addEventListener("resize", drawTrendChart);
