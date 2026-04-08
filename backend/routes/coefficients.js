const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const Papa = require("papaparse");
const db = require("../db");

const upload = multer({ dest: path.join(__dirname, "../../data/uploads") });

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM coefficients ORDER BY supplier, brand, family").all();
  res.json(rows);
});

router.get("/suppliers", (req, res) => {
  const rows = db.prepare("SELECT DISTINCT supplier FROM coefficients ORDER BY supplier").all();
  res.json(rows.map(r => r.supplier));
});

router.put("/:id", (req, res) => {
  const { supplier, brand, brand_coeff, family, family_coeff } = req.body;
  try {
    db.prepare("UPDATE coefficients SET supplier=?, brand=?, brand_coeff=?, family=?, family_coeff=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(supplier, brand || "", brand_coeff || null, family, family_coeff, req.params.id);
    res.json({ success: true });
  } catch(e) { res.status(400).json({ error: e.message }); }
});

router.delete("/all", (req, res) => {
  db.prepare("DELETE FROM coefficients").run();
  res.json({ success: true });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM coefficients WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

router.post("/", (req, res) => {
  const { supplier, brand, brand_coeff, family, family_coeff } = req.body;
  try {
    const result = db.prepare("INSERT INTO coefficients (supplier, brand, brand_coeff, family, family_coeff) VALUES (?, ?, ?, ?, ?)")
      .run(supplier, brand || "", brand_coeff || null, family, family_coeff);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname.toLowerCase();
    let rows = [];
    if (originalName.endsWith(".csv")) {
      const text = fs.readFileSync(filePath, "utf8");
      rows = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
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
    const stmt = db.prepare("INSERT OR REPLACE INTO coefficients (supplier, brand, brand_coeff, family, family_coeff) VALUES (?, ?, ?, ?, ?)");
    let imported = 0;
    for (const row of rows) {
      const r = norm(row);
      const supplier = (r.supplier || r.fournisseur || "").toString().trim();
      const brand = (r.brand || r.marque || "").toString().trim();
      const brand_coeff = parseFloat(r.brand_coeff || r.coeff_marque || r.coeff_brand) || null;
      const family = (r.family || r.famille || "").toString().trim();
      const family_coeff = parseFloat(r.family_coeff || r.coeff_famille || r.coeff_family) || null;
      if (supplier && family && family_coeff) { stmt.run(supplier, brand, brand_coeff, family, family_coeff); imported++; }
    }
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const count = db.prepare("SELECT COUNT(*) as c FROM coefficients").get();
    res.json({ success: true, imported, total: count.c });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
