const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { query } = require("../db");

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) return res.status(403).json({ error: "Admin access required" });
  next();
};

router.get("/", requireAdmin, async (req, res) => {
  try {
    const rows = await query("SELECT id, username, is_admin, created_at FROM users ORDER BY id");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", requireAdmin, async (req, res) => {
  const { username, password, is_admin } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const rows = await query(
      "INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id",
      [username, hash, is_admin ? 1 : 0]
    );
    res.json({ id: rows[0].id, username, is_admin: is_admin ? 1 : 0 });
  } catch (e) {
    if (e.message.includes("UNIQUE") || e.message.includes("unique")) return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "Cannot delete your own account" });
  try {
    const adminRows = await query("SELECT COUNT(*) AS c FROM users WHERE is_admin=1");
    const target = (await query("SELECT is_admin FROM users WHERE id=$1", [id]))[0];
    if (target && target.is_admin && parseInt(adminRows[0].c, 10) <= 1)
      return res.status(400).json({ error: "Cannot delete the last admin" });
    await query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
