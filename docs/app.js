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

  // Reset input
  input.value = "";
  input.style.height = "auto";

  // Mostrar mensaje usuario
  addMessage(text, "user");

  // Mensaje bot (placeholder)
  const botMsg = addMessage("🤔 Pensando…", "bot status");

  let res;
  try {
    res = await fetch("https://ollama.mteam.com.ar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "soporte",
        prompt: text,
        stream: true
      })
    });
  } catch (err) {
    botMsg.textContent = "❌ Error de conexión";
    botMsg.classList.remove("status");
    console.error(err);
    return;
  }

  if (!res.ok || !res.body) {
    botMsg.textContent = "❌ Error del servidor";
    botMsg.classList.remove("status");
    return;
  }

  botMsg.textContent = "⌨️ Escribiendo…";

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let output = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Acumular chunk (NO parsear directo)
      buffer += decoder.decode(value, { stream: true });

      // Separar por líneas
      const lines = buffer.split("\n");
      buffer = lines.pop(); // guardar línea incompleta

      for (const line of lines) {
        if (!line.trim()) continue;

        let json;
        try {
          json = JSON.parse(line);
        } catch (e) {
          // JSON incompleto → esperar más datos
          continue;
        }

        if (json.response) {
          output += json.response;
          botMsg.textContent = output;
          messages.scrollTop = messages.scrollHeight;
        }

        if (json.done) {
          botMsg.classList.remove("status");
        }
      }
    }
  } catch (err) {
    console.error(err);
    botMsg.textContent = "❌ Error procesando respuesta";
    botMsg.classList.remove("status");
  }
}
