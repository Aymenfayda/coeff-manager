// Suppress Node experimental SQLite warning
const originalEmit = process.emit;
process.emit = function(name, data) {
  if (name === "warning" && data && data.name === "ExperimentalWarning" && String(data.message).includes("SQLite")) return false;
  return originalEmit.apply(process, arguments);
};

const express = require("express");
const path = require("path");
const fs = require("fs");
const auth = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3003;

const dataDir = path.join(__dirname, "..", "data");
const uploadsDir = path.join(dataDir, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? "[31m" : res.statusCode >= 400 ? "[33m" : "[32m";
    console.log(`${color}${res.statusCode}[0m ${req.method} ${req.path} ${ms}ms`);
  });
  next();
});

// Public routes (no auth)
app.get("/api/health", (req, res) => res.json({ status: "ok", port: PORT }));
app.use("/api/auth", require("./routes/auth"));

// Protected routes
app.use("/api/coefficients", auth, require("./routes/coefficients"));
app.use("/api/process", auth, require("./routes/process"));
app.use("/api/history", auth, require("./routes/history"));
app.use("/api/users", auth, require("./routes/users"));

// Serve built React frontend
const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
} else {
  app.get("/", (req, res) => res.send("Frontend not built. Run: cd frontend && npm run build"));
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("[31mError:[0m", err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("[36m[BACKEND][0m CoeffManager running on [1mhttp://localhost:" + PORT + "[0m");
});

process.on("uncaughtException", (e) => { console.error("Uncaught:", e.message); });
process.on("unhandledRejection", (e) => { console.error("Unhandled rejection:", e?.message || e); });
