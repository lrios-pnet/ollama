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
    // "* item" → "- item"
    .replace(/^\* /gm, "- ")
    // línea en blanco antes de listas
    .replace(/([^\n])\n(- )/g, "$1\n\n$2")
    // línea en blanco antes de títulos en negrita
    .replace(/([^\n])\n(\*\*)/g, "$1\n\n$2");
}

/**
 * Historial de conversación
 * El primer mensaje SIEMPRE es el system prompt
 */
const conversation = [
  {
    role: "system",
    content:
      "Sos un asistente de soporte técnico senior. Respondé en español, de forma clara, profesional y concisa.",
  },
];

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

  // Guardar en historial
  conversation.push({
    role: "user",
    content: text,
  });

  // Limitar historial (system + últimos 20 mensajes)
  if (conversation.length > 21) {
    conversation.splice(1, conversation.length - 21);
  }

  const botMsg = addMessage("🤔 Pensando…", "bot status");

  let res;
  try {
    res = await fetch("https://ollama.mteam.com.ar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "soporte",
        messages: conversation,
        stream: false,
        num_predict: 768,
      }),
    });
  } catch (err) {
    botMsg.textContent = "❌ Error de conexión";
    botMsg.classList.remove("status");
    console.error(err);
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
    console.error(err);
    desbloquearUI();
    return;
  }

  const reply = data.message?.content || "❌ Respuesta vacía";

  botMsg.innerHTML = marked.parse(normalizeMarkdown(reply));
  botMsg.classList.remove("status");

  // Guardar respuesta del asistente
  conversation.push({
    role: "assistant",
    content: reply,
  });

  desbloquearUI();
}

function desbloquearUI() {
  sendBtn.disabled = false;
  input.disabled = false;
  input.focus();
}
