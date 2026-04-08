const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM processing_history ORDER BY processed_at DESC LIMIT 50").all();
  res.json(rows);
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM processing_history WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

router.get("/stats", (req, res) => {
  const suppliers = db.prepare("SELECT COUNT(DISTINCT supplier) as count FROM coefficients").get();
  const lastFile = db.prepare("SELECT filename, supplier, processed_at FROM processing_history ORDER BY processed_at DESC LIMIT 1").get();
  const totalProcessed = db.prepare("SELECT COUNT(*) as count FROM processing_history").get();
  const coeffCount = db.prepare("SELECT COUNT(*) as count FROM coefficients").get();
  res.json({
    supplierCount: suppliers.count,
    lastFile: lastFile || null,
    totalProcessed: totalProcessed.count,
    coeffCount: coeffCount.count
  });
});

module.exports = router;
