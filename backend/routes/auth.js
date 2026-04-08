const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { sign } = require("../middleware/auth");
const authMiddleware = require("../middleware/auth");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  try {
    const rows = await query("SELECT * FROM users WHERE username=$1", [username]);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: "Invalid username or password" });
    const token = sign({ id: user.id, username: user.username, is_admin: user.is_admin });
    res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const rows = await query("SELECT id, username, is_admin, created_at FROM users WHERE id=$1", [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
