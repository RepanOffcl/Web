import express from "express";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import multer from "multer";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: "uploads/" });
let botProcess = null;
let wsClient = null;

// Serve frontend
app.use(express.static("public"));

// Upload ZIP & extract
app.post("/upload", upload.single("file"), (req, res) => {
  const filePath = req.file.path;
  const zip = new AdmZip(filePath);
  const extractPath = path.join(process.cwd(), "workspace");

  if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);
  zip.extractAllTo(extractPath, true);

  fs.unlinkSync(filePath);
  res.json({ status: "ok", message: "ZIP berhasil di-extract!" });
});

// Start bot
app.post("/start", (req, res) => {
  if (botProcess) return res.json({ status: "error", message: "Bot sudah jalan" });

  botProcess = spawn("npm", ["start"], { cwd: "./workspace", shell: true });

  botProcess.stdout.on("data", (data) => {
    if (wsClient) wsClient.send(data.toString());
  });
  botProcess.stderr.on("data", (data) => {
    if (wsClient) wsClient.send("ERROR: " + data.toString());
  });
  botProcess.on("close", (code) => {
    if (wsClient) wsClient.send(`Bot berhenti dengan kode: ${code}`);
    botProcess = null;
  });

  res.json({ status: "ok", message: "run sedang berjalan powered by RepanOffcl" });
});

// Stop bot
app.post("/stop", (req, res) => {
  if (!botProcess) return res.json({ status: "error", message: "Bot tidak jalan" });
  botProcess.kill();
  botProcess = null;
  res.json({ status: "ok", message: "run di hentikan" });
});

// Restart bot
app.post("/restart", (req, res) => {
  if (!botProcess) return res.json({ status: "error", message: "Bot belum jalan" });

  botProcess.kill();
  botProcess = null;
  setTimeout(() => {
    botProcess = spawn("npm", ["start"], { cwd: "./workspace", shell: true });
    botProcess.stdout.on("data", (data) => {
      if (wsClient) wsClient.send(data.toString());
    });
  }, 1000);

  res.json({ status: "ok", message: "run direstart" });
});

// WebSocket buat kirim log realtime
const wss = new WebSocketServer({ noServer: true });
wss.on("connection", (ws) => {
  wsClient = ws;
});

const server = app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});