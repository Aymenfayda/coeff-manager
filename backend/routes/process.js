const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const Papa = require("papaparse");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const upload = multer({ dest: path.join(__dirname, "../../data/uploads") });

router.post("/preview", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    let rows = [], headers = [];
    if (originalName.toLowerCase().endsWith(".csv")) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
      headers = parsed.meta.fields || [];
      rows = parsed.data.slice(0, 5);
    } else {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const sheet = wb.worksheets[0];
      sheet.getRow(1).eachCell((cell) => headers.push((cell.value || "").toString().trim()));
      sheet.eachRow((row, rn) => {
        if (rn === 1 || rn > 6) return;
        const obj = {};
        row.eachCell((cell, cn) => { if (headers[cn-1]) obj[headers[cn-1]] = cell.value; });
        rows.push(obj);
      });
    }
    const lh = headers.map(h => h.toLowerCase());
    const detect = (cs) => { for (const c of cs) { const i = lh.findIndex(h => h.includes(c)); if (i !== -1) return headers[i]; } return null; };
    const suggestions = {
      family: detect(["family","famille","categ","category","type"]),
      sku: detect(["sku","ref","code","id","article"]),
      name: detect(["name","nom","designation","libelle","label","title"]),
      price: detect(["price","prix","pvp","sell","vente"]),
      cost: detect(["cost","cout","achat","purchase","buy"]),
    };
    const sessionId = uuidv4();
    const sf = path.join(__dirname, "../../data/uploads", "session_" + sessionId + ".json");
    fs.writeFileSync(sf, JSON.stringify({ filePath, originalName, headers }));
    res.json({ sessionId, headers, preview: rows, suggestions, filename: originalName });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/apply", async (req, res) => {
  const { sessionId, supplier, columnMap } = req.body;
  try {
    const sf = path.join(__dirname, "../../data/uploads", "session_" + sessionId + ".json");
    if (!fs.existsSync(sf)) return res.status(404).json({ error: "Session not found" });
    const session = JSON.parse(fs.readFileSync(sf, "utf8"));
    const { filePath, originalName, headers } = session;
    let allRows = [];
    if (originalName.toLowerCase().endsWith(".csv")) {
      allRows = Papa.parse(fs.readFileSync(filePath, "utf8"), { header: true, skipEmptyLines: true }).data;
    } else {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.readFile(filePath);
      const sheet = wb.worksheets[0];
      const hdrs = [];
      sheet.getRow(1).eachCell((cell) => hdrs.push((cell.value || "").toString().trim()));
      sheet.eachRow((row, rn) => {
        if (rn === 1) return;
        const obj = {};
        row.eachCell((cell, cn) => { if (hdrs[cn-1]) obj[hdrs[cn-1]] = cell.value; });
        allRows.push(obj);
      });
    }
    const coeffRows = db.prepare("SELECT * FROM coefficients WHERE supplier=?").all(supplier);
    const familyMap = {};
    for (const c of coeffRows) { const fk = (c.family||"").toLowerCase().trim(); if (fk) familyMap[fk] = c.family_coeff; }
    const defRow = coeffRows.find(c => c.brand_coeff);
    const defaultBrandCoeff = defRow ? defRow.brand_coeff : null;
    const processed = allRows.map((row, idx) => {
      const family = columnMap.family ? (row[columnMap.family]||"").toString().trim() : "";
      const sku = columnMap.sku ? row[columnMap.sku] : "row_"+(idx+1);
      const name = columnMap.name ? row[columnMap.name] : "";
      const rp = columnMap.price ? parseFloat(row[columnMap.price]) : NaN;
      const rc = columnMap.cost ? parseFloat(row[columnMap.cost]) : NaN;
      const hp = !isNaN(rp) && rp > 0, hc = !isNaN(rc) && rc > 0;
      const fk = family.toLowerCase().trim();
      let coeff = null, src = null;
      if (familyMap[fk] !== undefined) { coeff = familyMap[fk]; src = "family"; }
      else if (defaultBrandCoeff) { coeff = defaultBrandCoeff; src = "brand"; }
      let cp = hp ? rp : null, cc = hc ? rc : null, st = "ok";
      if (!coeff) { st = "unresolvable"; }
      else if (hp && hc) { st = "ok"; }
      else if (hp && !hc) { cc = parseFloat((rp/coeff).toFixed(4)); st = src==="brand" ? "fallback" : "calculated"; }
      else if (!hp && hc) { cp = parseFloat((rc*coeff).toFixed(4)); st = src==="brand" ? "fallback" : "calculated"; }
      else { st = "unresolvable"; }
      return Object.assign({}, row, { _sku:sku, _name:name, _family:family,
        _original_price:hp?rp:null, _original_cost:hc?rc:null,
        _applied_coeff:coeff, _calculated_price:cp, _calculated_cost:cc, _status:st });
    });
    const stats = { total:processed.length,
      ok:processed.filter(r => r._status==="ok").length,
      calculated:processed.filter(r => r._status==="calculated").length,
      fallback:processed.filter(r => r._status==="fallback").length,
      unresolvable:processed.filter(r => r._status==="unresolvable").length };
    const resultId = uuidv4();
    const rf = path.join(__dirname, "../../data/uploads", "result_"+resultId+".json");
    fs.writeFileSync(rf, JSON.stringify({ processed, headers, originalName, supplier, columnMap, stats }));
    const processedBy = (req.user && req.user.username) || "admin";
    const resultData = JSON.stringify({ processed, headers });
    db.prepare("INSERT INTO processing_history (id,filename,supplier,family_column,total_rows,rows_ok,rows_calculated,rows_fallback,rows_unresolvable,result_file,processed_by,result_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(resultId, originalName, supplier, columnMap.family||"", stats.total, stats.ok, stats.calculated, stats.fallback, stats.unresolvable, rf, processedBy, resultData);
    res.json({ resultId, stats, preview: processed.slice(0, 100), headers });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

router.get("/export/:resultId", async (req, res) => {
  try {
    const record = db.prepare("SELECT * FROM processing_history WHERE id=?").get(req.params.resultId);
    if (!record) return res.status(404).json({ error: "Result not found" });
    if (!record.result_data) return res.status(404).json({ error: "Result data not available (processed before persistent storage was added)" });
    const { processed, headers } = JSON.parse(record.result_data);
    const originalName = record.filename;
    const supplier = record.supplier;
    const stats = { total: record.total_rows, ok: record.rows_ok, calculated: record.rows_calculated, fallback: record.rows_fallback, unresolvable: record.rows_unresolvable };
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Processed Data");
    const extras = ["applied_coeff","calculated_price","calculated_cost","coeff_status"];
    const allH = [...headers, ...extras];
    sheet.addRow(allH);
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    const sl = { ok:"OK", calculated:"Calculated", fallback:"Fallback (brand)", unresolvable:"Unresolvable" };
    const sc = { ok:"FF22C55E", calculated:"FF3B82F6", fallback:"FFF97316", unresolvable:"FFEF4444" };
    for (const row of processed) {
      const rd = headers.map(h => (row[h]!==undefined && row[h]!==null) ? row[h] : "");
      rd.push(row._applied_coeff||"", row._calculated_price||"", row._calculated_cost||"", sl[row._status]||row._status);
      const er = sheet.addRow(rd);
      const cell = er.getCell(allH.length);
      cell.fill = { type:"pattern", pattern:"solid", fgColor:{ argb:sc[row._status]||"FFCCCCCC" } };
      cell.font = { color:{ argb:"FFFFFFFF" }, bold:true };
    }
    sheet.columns.forEach(c => { c.width = 16; });
    const ss = wb.addWorksheet("Summary");
    ss.addRow(["CoeffManager Export Summary"]);
    ss.getRow(1).font = { bold:true, size:14 };
    ss.addRow([]);
    ss.addRow(["Supplier", supplier]);
    ss.addRow(["Original File", originalName]);
    ss.addRow(["Processed At", new Date().toLocaleString()]);
    ss.addRow([]);
    ss.addRow(["Metric", "Count"]);
    ss.getRow(7).font = { bold:true };
    ss.addRow(["Total Rows", stats.total]);
    ss.addRow(["OK", stats.ok]);
    ss.addRow(["Calculated", stats.calculated]);
    ss.addRow(["Fallback", stats.fallback]);
    ss.addRow(["Unresolvable", stats.unresolvable]);
    ss.columns = [{ width:30 }, { width:20 }];
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeName = originalName.replace(/[.][^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeSupplier = supplier.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fname = safeSupplier + "_" + safeName + "_" + dateStr + ".xlsx";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

module.exports = router;
