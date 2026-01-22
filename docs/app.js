const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");

/**
 * Configuración de marked (Markdown)
 */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Normaliza Markdown generado por el modelo
 * (listas, títulos y saltos de línea)
 */
function normalizeMarkdown(text) {
  return text
    .replace(/^\* /gm, "- ")
    .replace(/([^\n])\n(- )/g, "$1\n\n$2")
    .replace(/([^\n])\n(\*\*)/g, "$1\n\n$2");
}

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `message ${cls}`;

  const clean = normalizeMarkdown(text);
  div.innerHTML = marked.parse(clean);

  messages.appendChild(div);

  // Highlight de código
  div.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  messages.scrollTop = messages.scrollHeight;
  return div;
}

async function send() {
  const text = input.value.trim();
  if (!text) return;

  // Bloquear UI
  sendBtn.disabled = true;
  input.disabled = true;

  input.value = "";
  input.style.height = "auto";

  // Mostrar mensaje del usuario
  addMessage(text, "user");

  const botMsg = addMessage("🤔 Pensando…", "bot status");

  let res;
  try {
    res = await fetch("https://ollama.mteam.com.ar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
      }),
    });
  } catch (err) {
    botMsg.textContent = "❌ Error de conexión";
    botMsg.classList.remove("status");
    desbloquearUI();
    return;
  }

  if (!res.ok) {
    botMsg.textContent = "❌ Error del servidor";
    botMsg.classList.remove("status");
    desbloquearUI();
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    botMsg.textContent = "❌ Error leyendo respuesta";
    botMsg.classList.remove("status");
    desbloquearUI();
    return;
  }

  const reply = data.reply || "❌ Respuesta vacía";

  botMsg.innerHTML = marked.parse(normalizeMarkdown(reply));
  botMsg.classList.remove("status");

  desbloquearUI();
}

function desbloquearUI() {
  sendBtn.disabled = false;
  input.disabled = false;
  input.focus();
}
