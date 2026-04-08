const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sign } = require("../middleware/auth");
const authMiddleware = require("../middleware/auth");

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: "Invalid username or password" });
  const token = sign({ id: user.id, username: user.username, is_admin: user.is_admin });
  res.json({ token, user: { id: user.id, username: user.username, is_admin: user.is_admin } });
});

router.get("/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, username, is_admin, created_at FROM users WHERE id=?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

module.exports = router;
