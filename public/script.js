const logs = document.getElementById("logs");

// Upload ZIP
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch("/upload", { method: "POST", body: formData });
  const json = await res.json();
  alert(json.message);
});

// Command Start/Stop/Restart
async function sendCommand(cmd) {
  const res = await fetch(`/${cmd}`, { method: "POST" });
  const json = await res.json();
  alert(json.message);
}

// WebSocket log listener
const ws = new WebSocket(`ws://${location.host}`);
ws.onmessage = (msg) => {
  logs.textContent += msg.data + "\n";
  logs.scrollTop = logs.scrollHeight;
};
