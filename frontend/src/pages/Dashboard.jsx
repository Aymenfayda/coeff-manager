import { useEffect, useState } from "react";
import { api } from "../api";

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/history/stats").then(setStats).catch(() => {});
  }, []);

  const statCards = [
    { label: "Suppliers Loaded", value: stats?.supplierCount ?? 0, color: "#6366f1", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { label: "Coefficient Entries", value: stats?.coeffCount ?? 0, color: "#0ea5e9", icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
    { label: "Files Processed", value: stats?.totalProcessed ?? 0, color: "#10b981", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#64748b", marginTop: 6, fontSize: 14 }}>Overview of your coefficient data and processing activity</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {statCards.map(c => (
          <div key={c.label} className="stat-card" style={{ borderLeftColor: c.color }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{c.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#0f172a", marginTop: 6 }}>{c.value}</div>
              </div>
              <div style={{ background: c.color + "18", borderRadius: 10, padding: 10 }}>
                <svg width="22" height="22" fill="none" stroke={c.color} strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats?.lastFile && (
        <div className="card">
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600, color: "#374151" }}>Last Processed File</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            <div><div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Filename</div><div style={{ marginTop: 4, fontWeight: 500 }}>{stats.lastFile.filename}</div></div>
            <div><div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Supplier</div><div style={{ marginTop: 4, fontWeight: 500 }}>{stats.lastFile.supplier}</div></div>
            <div><div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Processed At</div><div style={{ marginTop: 4, fontWeight: 500 }}>{new Date(stats.lastFile.processed_at).toLocaleString()}</div></div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card" style={{ cursor: "pointer" }} onClick={() => onNavigate("coefficients")}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>Manage Coefficients</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Import or edit your supplier pricing coefficients table.</p>
          <div style={{ marginTop: 12, color: "#6366f1", fontSize: 13, fontWeight: 500 }}>Open table &rarr;</div>
        </div>
        <div className="card" style={{ cursor: "pointer" }} onClick={() => onNavigate("process")}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>Process a File</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>Upload a supplier file and apply coefficients automatically.</p>
          <div style={{ marginTop: 12, color: "#6366f1", fontSize: 13, fontWeight: 500 }}>Upload file &rarr;</div>
        </div>
      </div>
    </div>
  );
}
