const express = require("express");
const router = express.Router();
const { query } = require("../db");

router.get("/", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM processing_history ORDER BY processed_at DESC LIMIT 50");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM processing_history WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/stats", async (req, res) => {
  try {
    const [suppliers, lastFile, totalProcessed, coeffCount] = await Promise.all([
      query("SELECT COUNT(DISTINCT supplier) AS count FROM coefficients"),
      query("SELECT filename, supplier, processed_at FROM processing_history ORDER BY processed_at DESC LIMIT 1"),
      query("SELECT COUNT(*) AS count FROM processing_history"),
      query("SELECT COUNT(*) AS count FROM coefficients"),
    ]);
    res.json({
      supplierCount: parseInt(suppliers[0].count, 10),
      lastFile: lastFile[0] || null,
      totalProcessed: parseInt(totalProcessed[0].count, 10),
      coeffCount: parseInt(coeffCount[0].count, 10),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
