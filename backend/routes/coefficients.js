const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const Papa = require("papaparse");
const { query } = require("../db");

const upload = multer({ dest: path.join(__dirname, "../../data/uploads") });

router.get("/", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM coefficients ORDER BY supplier, brand, family");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get("/suppliers", async (req, res) => {
  try {
    const rows = await query("SELECT DISTINCT supplier FROM coefficients ORDER BY supplier");
    res.json(rows.map(r => r.supplier));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  const { supplier, brand, brand_coeff, family, family_coeff } = req.body;
  try {
    const rows = await query(
      "INSERT INTO coefficients (supplier, brand, brand_coeff, family, family_coeff) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [supplier, brand || "", brand_coeff || null, family, family_coeff]
    );
    res.json({ id: rows[0].id, success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  const { supplier, brand, brand_coeff, family, family_coeff } = req.body;
  try {
    await query(
      "UPDATE coefficients SET supplier=$1, brand=$2, brand_coeff=$3, family=$4, family_coeff=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6",
      [supplier, brand || "", brand_coeff || null, family, family_coeff, req.params.id]
    );
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete("/all", async (req, res) => {
  try {
    await query("DELETE FROM coefficients");
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM coefficients WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname.toLowerCase();
    let rows = [];
    if (originalName.endsWith(".csv")) {
      rows = Papa.parse(fs.readFileSync(filePath, "utf8"), { header: true, skipEmptyLines: true }).data;
    } else {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const sheet = wb.worksheets[0];
      const hdrs = [];
      sheet.getRow(1).eachCell((cell) => hdrs.push((cell.value || "").toString().trim()));
      sheet.eachRow((row, rn) => {
        if (rn === 1) return;
        const obj = {};
        row.eachCell((cell, cn) => { obj[hdrs[cn - 1]] = cell.value; });
        rows.push(obj);
      });
    }
    const norm = (obj) => {
      const n = {};
      for (const k in obj) if (k) n[k.toLowerCase().trim().replace(/\s+/g, "_")] = obj[k];
      return n;
    };
    let imported = 0;
    for (const row of rows) {
      const r = norm(row);
      const supplier = (r.supplier || r.fournisseur || "").toString().trim();
      const brand = (r.brand || r.marque || "").toString().trim();
      const brand_coeff = parseFloat(r.brand_coeff || r.coeff_marque || r.coeff_brand) || null;
      const family = (r.family || r.famille || "").toString().trim();
      const family_coeff = parseFloat(r.family_coeff || r.coeff_famille || r.coeff_family) || null;
      if (supplier && family && family_coeff) {
        await query(
          `INSERT INTO coefficients (supplier, brand, brand_coeff, family, family_coeff)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (supplier, family) DO UPDATE SET
             brand = EXCLUDED.brand,
             brand_coeff = EXCLUDED.brand_coeff,
             family_coeff = EXCLUDED.family_coeff,
             updated_at = CURRENT_TIMESTAMP`,
          [supplier, brand, brand_coeff, family, family_coeff]
        );
        imported++;
      }
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const counts = await query("SELECT COUNT(*) AS c FROM coefficients");
    res.json({ success: true, imported, total: parseInt(counts[0].c, 10) });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
