import { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch(e) {
      setError("Cannot reach server"); setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc" }}>
      <div style={{ width:360, background:"white", borderRadius:16, padding:40, boxShadow:"0 4px 24px rgba(0,0,0,0.10)" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:28, fontWeight:800, color:"#0f172a", letterSpacing:"-0.5px" }}>CoeffManager</div>
          <div style={{ color:"#64748b", fontSize:13, marginTop:4 }}>Sign in to continue</div>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Username</label>
            <input className="input" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="admin" autoFocus autoComplete="username" required />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:13, fontWeight:500, color:"#374151", display:"block", marginBottom:6 }}>Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="admin123" autoComplete="current-password" required />
          </div>
          {error && <div style={{ color:"#dc2626", fontSize:13, marginBottom:16, padding:"8px 12px", background:"#fee2e2", borderRadius:8 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width:"100%", justifyContent:"center", padding:"10px", fontSize:15 }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
