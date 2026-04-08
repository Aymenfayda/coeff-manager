import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CoefficientTable from "./pages/CoefficientTable";
import ProcessFile from "./pages/ProcessFile";
import History from "./pages/History";
import Users from "./pages/Users";
import Login from "./pages/Login";
import "./index.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { localStorage.removeItem("user"); }
    }
    setAuthReady(true);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setPage("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  if (!authReady) return null;
  if (!user) return <Login onLogin={handleLogin} />;

  const pages = { dashboard: Dashboard, coefficients: CoefficientTable, process: ProcessFile, history: History, users: Users };
  const Page = pages[page] || Dashboard;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar current={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Page showToast={showToast} onNavigate={setPage} currentUser={user} />
      </div>
      {toast && (
        <div className={"toast toast-" + toast.type}>{toast.msg}</div>
      )}
    </div>
  );
}
