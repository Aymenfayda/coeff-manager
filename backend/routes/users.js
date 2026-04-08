const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db");

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: "Admin access required" });
  next();
};

router.get("/", requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT id, username, is_admin, created_at FROM users ORDER BY id").all();
  res.json(rows);
});

router.post("/", requireAdmin, (req, res) => {
  const { username, password, is_admin } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const r = db.prepare("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)")
      .run(username, hash, is_admin ? 1 : 0);
    res.json({ id: r.lastInsertRowid, username, is_admin: is_admin ? 1 : 0 });
  } catch(e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "Cannot delete your own account" });
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_admin=1").get();
  const target = db.prepare("SELECT is_admin FROM users WHERE id=?").get(id);
  if (target && target.is_admin && adminCount.c <= 1)
    return res.status(400).json({ error: "Cannot delete the last admin" });
  db.prepare("DELETE FROM users WHERE id=?").run(id);
  res.json({ success: true });
});

module.exports = router;
