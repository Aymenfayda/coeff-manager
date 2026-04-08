import { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_COLORS = { ok:"#16a34a", calculated:"#2563eb", fallback:"#ea580c", unresolvable:"#dc2626" };

export default function History({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/history").then(d => { setRows(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const del = async (id) => {
    if (!confirm("Remove this entry from history?")) return;
    try { await api.delete("/history/" + id); load(); showToast("Removed"); }
    catch(e) { showToast(e.message, "error"); }
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, color:"#0f172a", margin:0 }}>History</h1>
        <p style={{ color:"#64748b", marginTop:4, fontSize:14, margin:"4px 0 0" }}>Previously processed files</p>
      </div>
      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div className="loading"><div className="spinner" />Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding:48, textAlign:"center", color:"#94a3b8" }}>No files processed yet.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr>
                <th>Filename</th><th>Supplier</th><th>Family Col</th>
                <th>Total</th><th>OK</th><th>Calculated</th><th>Fallback</th><th>Unresolvable</th>
                <th>Processed At</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight:500 }}>{r.filename}</td>
                    <td>{r.supplier}</td>
                    <td style={{ fontFamily:"monospace", fontSize:12 }}>{r.family_column || "—"}</td>
                    <td style={{ fontWeight:600 }}>{r.total_rows}</td>
                    <td style={{ color:"#16a34a", fontWeight:600 }}>{r.rows_ok}</td>
                    <td style={{ color:"#2563eb", fontWeight:600 }}>{r.rows_calculated}</td>
                    <td style={{ color:"#ea580c", fontWeight:600 }}>{r.rows_fallback}</td>
                    <td style={{ color:"#dc2626", fontWeight:600 }}>{r.rows_unresolvable}</td>
                    <td style={{ fontSize:12, color:"#64748b" }}>{new Date(r.processed_at).toLocaleString()}</td>
                    <td>
                      <a className="btn btn-success" style={{ padding:"4px 10px", fontSize:12, marginRight:4 }} href={"http://localhost:3003/api/process/export/" + r.id} download>Export</a>
                      <button className="btn btn-danger" style={{ padding:"4px 10px", fontSize:12 }} onClick={() => del(r.id)}>Del</button>
                    </td>
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
