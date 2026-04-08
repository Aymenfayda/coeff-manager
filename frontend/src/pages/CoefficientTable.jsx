import { useEffect, useState, useRef } from "react";
import { api } from "../api";

export default function CoefficientTable({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ supplier:"", brand:"", brand_coeff:"", family:"", family_coeff:"" });
  const fileRef = useRef();

  const load = () => { setLoading(true); api.get("/coefficients").then(d => { setRows(d); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(load, []);

  const suppliers = [...new Set(rows.map(r => r.supplier))].sort();

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.supplier||"").toLowerCase().includes(q) || (r.brand||"").toLowerCase().includes(q) || (r.family||"").toLowerCase().includes(q);
    const matchSupplier = !filterSupplier || r.supplier === filterSupplier;
    return matchSearch && matchSupplier;
  });

  const startEdit = (row) => { setEditing(row.id); setEditData({ ...row }); };
  const saveEdit = async () => {
    try { await api.put("/coefficients/" + editing, editData); setEditing(null); load(); showToast("Row updated"); }
    catch(e) { showToast(e.message, "error"); }
  };
  const deleteRow = async (id) => {
    if (!confirm("Delete this row?")) return;
    try { await api.delete("/coefficients/" + id); load(); showToast("Deleted"); }
    catch(e) { showToast(e.message, "error"); }
  };
  const addRow = async () => {
    if (!newRow.supplier || !newRow.family || !newRow.family_coeff) return showToast("Supplier, family and family coeff are required", "error");
    try {
      await api.post("/coefficients", { ...newRow, brand_coeff: newRow.brand_coeff || null, family_coeff: parseFloat(newRow.family_coeff) });
      setAdding(false); setNewRow({ supplier:"", brand:"", brand_coeff:"", family:"", family_coeff:"" }); load(); showToast("Row added");
    } catch(e) { showToast(e.message, "error"); }
  };
  const importFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    try { const r = await api.upload("/coefficients/import", fd); load(); showToast("Imported " + r.imported + " rows (" + r.total + " total)"); }
    catch(e) { showToast(e.message, "error"); }
    e.target.value = "";
  };
  const clearAll = async () => {
    if (!confirm("Delete ALL coefficient rows?")) return;
    try { await api.delete("/coefficients/all"); load(); showToast("All coefficients cleared"); }
    catch(e) { showToast(e.message, "error"); }
  };
  const editField = (k, v) => setEditData(d => ({ ...d, [k]: v }));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Coefficient Table</h1>
          <p style={{ color:"#64748b", fontSize:14, margin:"4px 0 0" }}>{rows.length} entries across {suppliers.length} suppliers</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="file" ref={fileRef} onChange={importFile} accept=".csv,.xlsx,.xls" style={{ display:"none" }} />
          <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>Import CSV/Excel</button>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Add Row</button>
          {rows.length > 0 && <button className="btn btn-danger" onClick={clearAll}>Clear All</button>}
        </div>
      </div>
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:"flex", gap:12 }}>
          <input className="input" placeholder="Search supplier, brand, family..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:300 }} />
          <select className="select" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
            <option value="">All suppliers</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {adding && (
        <div className="card" style={{ marginBottom:16, borderLeft:"4px solid #6366f1" }}>
          <h4 style={{ margin:"0 0 12px", fontSize:14, fontWeight:600 }}>New Row</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 110px 1fr 110px", gap:8 }}>
            <input className="input" placeholder="Supplier *" value={newRow.supplier} onChange={e => setNewRow(d=>({...d,supplier:e.target.value}))} />
            <input className="input" placeholder="Brand" value={newRow.brand} onChange={e => setNewRow(d=>({...d,brand:e.target.value}))} />
            <input className="input" placeholder="Brand coeff" type="number" step="0.01" value={newRow.brand_coeff} onChange={e => setNewRow(d=>({...d,brand_coeff:e.target.value}))} />
            <input className="input" placeholder="Family *" value={newRow.family} onChange={e => setNewRow(d=>({...d,family:e.target.value}))} />
            <input className="input" placeholder="Fam coeff *" type="number" step="0.01" value={newRow.family_coeff} onChange={e => setNewRow(d=>({...d,family_coeff:e.target.value}))} />
          </div>
          <div style={{ display:"flex", gap:8, marginTop:10 }}>
            <button className="btn btn-primary" onClick={addRow}>Save</button>
            <button className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div className="loading"><div className="spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>
            {rows.length === 0 ? "No coefficients loaded. Import a file or add rows manually." : "No results match your search."}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Supplier</th><th>Brand</th><th>Brand Coeff</th><th>Family</th><th>Family Coeff</th><th style={{width:110}}>Actions</th></tr></thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    {editing === row.id ? (
                      <>
                        <td><input className="input" value={editData.supplier||""} onChange={e => editField("supplier",e.target.value)} /></td>
                        <td><input className="input" value={editData.brand||""} onChange={e => editField("brand",e.target.value)} /></td>
                        <td><input className="input" type="number" step="0.01" value={editData.brand_coeff||""} onChange={e => editField("brand_coeff",e.target.value)} /></td>
                        <td><input className="input" value={editData.family||""} onChange={e => editField("family",e.target.value)} /></td>
                        <td><input className="input" type="number" step="0.01" value={editData.family_coeff||""} onChange={e => editField("family_coeff",e.target.value)} /></td>
                        <td style={{whiteSpace:"nowrap"}}><button className="btn btn-success" style={{padding:"4px 8px",fontSize:12}} onClick={saveEdit}>Save</button>{" "}<button className="btn btn-secondary" style={{padding:"4px 8px",fontSize:12}} onClick={() => setEditing(null)}>Cancel</button></td>
                      </>
                    ) : (
                      <>
                        <td style={{fontWeight:500}}>{row.supplier}</td>
                        <td style={{color:"#64748b"}}>{row.brand}</td>
                        <td>{row.brand_coeff != null ? <span style={{fontFamily:"monospace",background:"#f1f5f9",padding:"2px 6px",borderRadius:4}}>{row.brand_coeff}</span> : <span style={{color:"#cbd5e1"}}>-</span>}</td>
                        <td style={{fontWeight:500}}>{row.family}</td>
                        <td><span style={{fontFamily:"monospace",background:"#ede9fe",color:"#7c3aed",padding:"2px 6px",borderRadius:4,fontWeight:600}}>{row.family_coeff}</span></td>
                        <td style={{whiteSpace:"nowrap"}}><button className="btn btn-secondary" style={{padding:"4px 8px",fontSize:12,marginRight:4}} onClick={() => startEdit(row)}>Edit</button><button className="btn btn-danger" style={{padding:"4px 8px",fontSize:12}} onClick={() => deleteRow(row.id)}>Del</button></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
