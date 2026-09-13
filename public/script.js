const chatLog = document.getElementById("chat-log");
const form = document.getElementById("composer");
const input = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const statBlock = document.getElementById("stat-block");

function addMessage(text, sender) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${sender}`;
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = sender === "bot" ? formatBotText(text) : escapeHtml(text);
  wrap.appendChild(bubble);
  chatLog.appendChild(wrap);
  chatLog.scrollTop = chatLog.scrollHeight;
  return wrap;
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
      addMessage(data.answer, "bot");
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
    `;
  } catch (err) {
    statBlock.innerHTML = `<div class="stat-row skeleton"><span>Özet yüklenemedi</span></div>`;
  }
}

loadSummary();
