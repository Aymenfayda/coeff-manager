import { useEffect, useState } from "react";
import { api } from "../api";

export default function Users({ showToast, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ username:"", password:"", is_admin:false });

  const load = () => { setLoading(true); api.get("/users").then(d => { setUsers(d); setLoading(false); }).catch(e => { showToast(e.message, "error"); setLoading(false); }); };
  useEffect(load, []);

  const createUser = async () => {
    if (!form.username || !form.password) return showToast("Username and password required", "error");
    try {
      await api.post("/users", form);
      setAdding(false); setForm({ username:"", password:"", is_admin:false }); load(); showToast("User created");
    } catch(e) { showToast(e.message, "error"); }
  };

  const deleteUser = async (id, username) => {
    if (!confirm("Delete user " + username + "?")) return;
    try { await api.delete("/users/" + id); load(); showToast("User deleted"); }
    catch(e) { showToast(e.message, "error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, color:"#0f172a", margin:0 }}>User Management</h1>
          <p style={{ color:"#64748b", fontSize:14, margin:"4px 0 0" }}>Admin only</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ New User</button>
      </div>
      {adding && (
        <div className="card" style={{ marginBottom:16, borderLeft:"4px solid #6366f1" }}>
          <h4 style={{ margin:"0 0 12px", fontSize:14, fontWeight:600 }}>New User</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto auto", gap:8, alignItems:"end" }}>
            <div>
              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Username</label>
              <input className="input" value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} placeholder="username" />
            </div>
            <div>
              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="password" />
            </div>
            <div style={{ paddingBottom:2 }}>
              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:8 }}>Admin</label>
              <input type="checkbox" checked={form.is_admin} onChange={e => setForm(f=>({...f,is_admin:e.target.checked}))} style={{ width:16, height:16 }} />
            </div>
            <div style={{ display:"flex", gap:6, paddingBottom:2 }}>
              <button className="btn btn-primary" onClick={createUser} style={{ alignSelf:"flex-end" }}>Save</button>
              <button className="btn btn-secondary" onClick={() => setAdding(false)} style={{ alignSelf:"flex-end" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="card" style={{ padding:0 }}>
        {loading ? (
          <div className="loading"><div className="spinner" />Loading...</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr><th style={{ padding:"10px 16px", textAlign:"left", fontSize:13, fontWeight:600, color:"#64748b", borderBottom:"1px solid #e2e8f0" }}>Username</th><th style={{ padding:"10px 16px", textAlign:"left", fontSize:13, fontWeight:600, color:"#64748b", borderBottom:"1px solid #e2e8f0" }}>Role</th><th style={{ padding:"10px 16px", textAlign:"left", fontSize:13, fontWeight:600, color:"#64748b", borderBottom:"1px solid #e2e8f0" }}>Created</th><th style={{ padding:"10px 16px", borderBottom:"1px solid #e2e8f0" }}></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ padding:"10px 16px", fontWeight:500 }}>{u.username}{u.id === currentUser.id && <span style={{ marginLeft:8, fontSize:11, color:"#6366f1", background:"#eef2ff", padding:"2px 6px", borderRadius:4 }}>you</span>}</td>
                  <td style={{ padding:"10px 16px" }}>{u.is_admin ? <span style={{ fontSize:12, fontWeight:600, color:"#7c3aed", background:"#ede9fe", padding:"2px 8px", borderRadius:9999 }}>Admin</span> : <span style={{ fontSize:12, color:"#64748b" }}>User</span>}</td>
                  <td style={{ padding:"10px 16px", fontSize:12, color:"#64748b" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding:"10px 16px", textAlign:"right" }}>
                    {u.id !== currentUser.id && <button className="btn btn-danger" style={{ padding:"4px 10px", fontSize:12 }} onClick={() => deleteUser(u.id, u.username)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
