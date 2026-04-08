const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "coefficients", label: "Coefficient Table", icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { id: "process", label: "Process File", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "history", label: "History", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const adminNavItems = [
  { id: "users", label: "User Management", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
];

export default function Sidebar({ current, onNavigate, user, onLogout }) {
  const items = user && user.is_admin ? [...navItems, ...adminNavItems] : navItems;
  return (
    <nav className="sidebar">
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "-0.3px" }}>CoeffManager</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.8px" }}>Pricing Coefficients</div>
      </div>
      <div style={{ padding: "12px 0", flex: 1 }}>
        {items.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              width: "100%", padding: "10px 20px",
              background: current === item.id ? "#1e293b" : "transparent",
              color: current === item.id ? "white" : "#94a3b8",
              border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: current === item.id ? 600 : 400,
              textAlign: "left",
              borderLeft: current === item.id ? "3px solid #6366f1" : "3px solid transparent",
              transition: "all 0.15s",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #1e293b" }}>
        {user && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Signed in as</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginTop: 2 }}>{user.username}</div>
            {user.is_admin && <div style={{ fontSize: 11, color: "#a78bfa", marginTop: 1 }}>Administrator</div>}
          </div>
        )}
        <button onClick={onLogout}
          style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", border:"1px solid #334155", color:"#94a3b8", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13, width:"100%", justifyContent:"center" }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Logout
        </button>
      </div>
    </nav>
  );
}
