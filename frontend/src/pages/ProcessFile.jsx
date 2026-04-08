import { useState, useRef } from "react";
import { api } from "../api";

const STATUS_BADGE = {
  ok: { label: "OK", cls: "badge-ok", emoji: "" },
  calculated: { label: "Calculated", cls: "badge-calculated", emoji: "" },
  fallback: { label: "Fallback", cls: "badge-fallback", emoji: "" },
  unresolvable: { label: "Unresolvable", cls: "badge-unresolvable", emoji: "" },
};

export default function ProcessFile({ showToast }) {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [supplier, setSupplier] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [columnMap, setColumnMap] = useState({ family:"", sku:"", name:"", price:"", cost:"" });
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const loadSuppliers = () => api.get("/coefficients/suppliers").then(setSuppliers).catch(() => {});

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const data = await api.upload("/process/preview", fd);
      setSessionData(data);
      setColumnMap({ ...{ family:"", sku:"", name:"", price:"", cost:"" }, ...Object.fromEntries(Object.entries(data.suggestions).filter(([,v]) => v)) });
      await loadSuppliers();
      setStep(2);
    } catch(e) { showToast(e.message, "error"); }
    setUploading(false);
  };

  const applyCoeffs = async () => {
    if (!supplier) return showToast("Please select a supplier", "error");
    setApplying(true);
    try {
      const r = await api.post("/process/apply", { sessionId: sessionData.sessionId, supplier, columnMap });
      setResult(r);
      setStep(4);
    } catch(e) { showToast(e.message, "error"); }
    setApplying(false);
  };

  const reset = () => { setStep(1); setSessionData(null); setResult(null); setSupplier(""); setColumnMap({ family:"", sku:"", name:"", price:"", cost:"" }); };

  const downloadResult = async () => {
    try { await api.download("/process/export/" + result.resultId); }
    catch(e) { showToast(e.message, "error"); }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:"#0f172a", margin:0 }}>Process File</h1>
        <p style={{ color:"#64748b", marginTop:4, fontSize:14, margin:"4px 0 0" }}>Upload a supplier product file and apply pricing coefficients</p>
      </div>

      <div className="step-indicator">
        {["Upload File","Select Supplier","Column Mapping","Results"].map((s,i) => (
          <div key={i} className={"step" + (step===i+1 ? " active" : step>i+1 ? " done" : "")}>
            <span>{step>i+1 ? "Done" : i+1}</span> {s}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="card">
          <div
            className={"upload-zone" + (dragOver ? " drag-over" : "")}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current.click()}
          >
            <input type="file" ref={fileRef} style={{ display:"none" }} accept=".csv,.xlsx,.xls" onChange={e => handleFile(e.target.files[0])} />
            {uploading ? <div className="loading"><div className="spinner" />Uploading...</div> : (
              <>
                <div style={{ fontSize:40, marginBottom:12 }}>&#128193;</div>
                <div style={{ fontWeight:600, fontSize:16, color:"#374151" }}>Drop file here or click to browse</div>
                <div style={{ color:"#94a3b8", fontSize:13, marginTop:6 }}>Supports .csv, .xlsx, .xls</div>
              </>
            )}
          </div>
        </div>
      )}

      {step === 2 && sessionData && (
        <div>
          <div className="card">
            <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:600 }}>Step 2: Assign Supplier</h3>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Select supplier from coefficient table:</label>
                <select className="select" style={{ width:"100%", maxWidth:400 }} value={supplier} onChange={e => setSupplier(e.target.value)}>
                  <option value="">-- Select supplier --</option>
                  {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop:16, padding:"12px 16px", background:"#f8fafc", borderRadius:8, fontSize:13, color:"#64748b" }}>
              File: <strong>{sessionData.filename}</strong> &mdash; {sessionData.headers.length} columns detected
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-secondary" onClick={reset}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!supplier}>Next: Column Mapping</button>
          </div>
        </div>
      )}

      {step === 3 && sessionData && (
        <div>
          <div className="card">
            <h3 style={{ margin:"0 0 4px", fontSize:15, fontWeight:600 }}>Step 3: Column Mapping</h3>
            <p style={{ fontSize:13, color:"#64748b", margin:"0 0 16px" }}>Map your file columns to the required fields. Auto-detected where possible.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[["family","Family / Category *"],["sku","SKU / Reference"],["name","Product Name"],["price","Price"],["cost","Cost"]].map(([key, label]) => (
                <div key={key}>
                  <label style={{ fontSize:13, fontWeight:500, display:"block", marginBottom:4 }}>{label}</label>
                  <select className="select" style={{ width:"100%" }} value={columnMap[key]} onChange={e => setColumnMap(m => ({...m,[key]:e.target.value}))}>
                    <option value="">(not mapped)</option>
                    {sessionData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          {sessionData.preview.length > 0 && (
            <div className="card">
              <h4 style={{ margin:"0 0 10px", fontSize:13, fontWeight:600, color:"#64748b" }}>File Preview (first 5 rows)</h4>
              <div className="table-container">
                <table><thead><tr>{sessionData.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{sessionData.preview.map((row,i) => <tr key={i}>{sessionData.headers.map(h => <td key={h} style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row[h]!=null?String(row[h]):""}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary" onClick={applyCoeffs} disabled={applying}>
              {applying ? "Applying..." : "Apply Coefficients"}
            </button>
          </div>
        </div>
      )}

      {step === 4 && result && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
            {[["Total",result.stats.total,"#64748b"],["OK",result.stats.ok,"#16a34a"],["Calculated",result.stats.calculated,"#2563eb"],["Fallback",result.stats.fallback,"#ea580c"],["Unresolvable",result.stats.unresolvable,"#dc2626"]].map(([l,v,c]) => (
              <div key={l} style={{ background:"white", borderRadius:10, padding:"14px 18px", borderLeft:"3px solid "+c, boxShadow:"0 1px 3px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px" }}>{l}</div>
                <div style={{ fontSize:28, fontWeight:700, color:c, marginTop:4 }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:0 }}>
            <div style={{ padding:"14px 16px", borderBottom:"1px solid #f1f5f9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:600 }}>Processed Rows Preview</h3>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-success" onClick={downloadResult}>Download Excel</button>
                <button className="btn btn-secondary" onClick={reset}>Process Another File</button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead><tr>
                  <th>SKU</th><th>Name</th><th>Family</th>
                  <th>Orig. Price</th><th>Orig. Cost</th>
                  <th>Applied Coeff</th><th>Calc. Price</th><th>Calc. Cost</th><th>Status</th>
                </tr></thead>
                <tbody>
                  {result.preview.map((row, i) => {
                    const b = STATUS_BADGE[row._status] || STATUS_BADGE.unresolvable;
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily:"monospace", fontSize:12 }}>{row._sku}</td>
                        <td style={{ maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row._name}</td>
                        <td>{row._family}</td>
                        <td style={{ fontFamily:"monospace" }}>{row._original_price != null ? row._original_price.toFixed(2) : "—"}</td>
                        <td style={{ fontFamily:"monospace" }}>{row._original_cost != null ? row._original_cost.toFixed(2) : "—"}</td>
                        <td style={{ fontFamily:"monospace", background:"#f8f7ff", fontWeight:600 }}>{row._applied_coeff || "—"}</td>
                        <td style={{ fontFamily:"monospace", color:"#16a34a" }}>{row._calculated_price != null ? row._calculated_price.toFixed(4) : "—"}</td>
                        <td style={{ fontFamily:"monospace", color:"#2563eb" }}>{row._calculated_cost != null ? row._calculated_cost.toFixed(4) : "—"}</td>
                        <td><span className={"badge " + b.cls}>{b.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {result.preview.length < result.stats.total && (
              <div style={{ padding:"10px 16px", fontSize:12, color:"#94a3b8", borderTop:"1px solid #f1f5f9" }}>Showing first {result.preview.length} of {result.stats.total} rows. Export to see all.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
