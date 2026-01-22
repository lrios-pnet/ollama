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

  input.value = "";
  input.style.height = "auto";

  addMessage(text, "user");

  const botMsg = addMessage("🤔 Pensando…", "bot status");

  const res = await fetch("https://ollama.mteam.com.ar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "soporte",
      prompt: text,
      stream: true
    })
  });

  botMsg.textContent = "⌨️ Escribiendo…";

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let output = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue;
      const json = JSON.parse(line);
      if (json.response) {
        output += json.response;
        botMsg.textContent = output;
        messages.scrollTop = messages.scrollHeight;
      }
    }
  }
}
