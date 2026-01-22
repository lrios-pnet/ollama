const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");

/**
 * Historial de la conversación
 * El primer mensaje SIEMPRE es el system prompt
 */
const conversation = [
  {
    role: "system",
    content:
      "Sos un asistente de soporte técnico senior. Respondé en español, de forma clara, profesional y concisa."
  }
];

sendBtn.addEventListener("click", send);
input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

function addMessage(text, cls) {
  const div = document.createElement("div");
  div.className = `message ${cls}`;

  // Markdown → HTML
  div.innerHTML = marked.parse(text);

  messages.appendChild(div);

  // Highlight de código
  div.querySelectorAll("pre code").forEach(block => {
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

  // Guardar mensaje en el historial
  conversation.push({
    role: "user",
    content: text
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
        stream: false
      })
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

  const reply =
    data.message?.content ||
    data.response ||
    "❌ Respuesta vacía";

  botMsg.textContent = reply;
  botMsg.classList.remove("status");

  // Guardar respuesta del asistente en el historial
  conversation.push({
    role: "assistant",
    content: reply
  });

  desbloquearUI();
}

function desbloquearUI() {
  sendBtn.disabled = false;
  input.disabled = false;
  input.focus();
}
