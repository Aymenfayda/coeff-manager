import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CoefficientTable from "./pages/CoefficientTable";
import ProcessFile from "./pages/ProcessFile";
import History from "./pages/History";
import "./index.css";


export default function App() {
  const [page, setPage] = useState("dashboard");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pages = { dashboard: Dashboard, coefficients: CoefficientTable, process: ProcessFile, history: History };
  const Page = pages[page] || Dashboard;

  return (
    <div style={{ display: "flex" }}>
      <Sidebar current={page} onNavigate={setPage} />
      <div className="main-content">
        <Page showToast={showToast} onNavigate={setPage} />
      </div>
      {toast && (
        <div className={"toast toast-" + toast.type}>{toast.msg}</div>
      )}
    </div>
  );
}
