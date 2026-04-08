const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "coeff-manager-dev-secret";

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch(e) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports.sign = function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
