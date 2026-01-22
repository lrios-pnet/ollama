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

  sendBtn.disabled = true;
  input.disabled = true;

  input.value = "";
  input.style.height = "auto";

  addMessage(text, "user");

  const botMsg = addMessage("🤔 Pensando…", "bot status");

  let response;
  try {
    response = await fetch("https://ollama.mteam.com.ar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
  } catch {
    botMsg.textContent = "❌ Error de conexión";
    botMsg.classList.remove("status");
    desbloquearUI();
    return;
  }

  if (!response.ok || !response.body) {
    botMsg.textContent = "❌ Error del servidor";
    botMsg.classList.remove("status");
    desbloquearUI();
    return;
  }

  // Cambia estado cuando empieza el stream
  botMsg.textContent = "✍️ Escribiendo…";

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let finalText = "";
  botMsg.innerHTML = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    finalText += chunk;

    botMsg.innerHTML = marked.parse(normalizeMarkdown(finalText));
    messages.scrollTop = messages.scrollHeight;
  }

  botMsg.classList.remove("status");
  desbloquearUI();
}


function desbloquearUI() {
  sendBtn.disabled = false;
  input.disabled = false;
  input.focus();
}
