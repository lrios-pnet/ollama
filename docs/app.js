const messages = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");

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
  div.textContent = text;
  messages.appendChild(div);
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

  addMessage(text, "user");

  const botMsg = addMessage("🤔 Pensando…", "bot status");

  let res;
  try {
    res = await fetch("https://ollama.mteam.com.ar/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "soporte",
        prompt: text,
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

  botMsg.textContent = data.response || "❌ Respuesta vacía";
  botMsg.classList.remove("status");

  desbloquearUI();
}

function desbloquearUI() {
  sendBtn.disabled = false;
  input.disabled = false;
  input.focus();
}

