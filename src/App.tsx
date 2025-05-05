import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CashierPage from "./pages/CashierPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import SystemManagementPage from "./pages/SystemManagementPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<CashierPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/system" element={<SystemManagementPage />} />
      </Routes>
    </Router>
  );
}

export default App;
