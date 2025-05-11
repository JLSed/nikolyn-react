import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CashierPage from "./pages/CashierPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import SystemManagementPage from "./pages/SystemManagementPage";
import OrderLogPage from "./pages/OrderLogPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PricingManagementPage from "./pages/PricingManagementPage";
import LandingPage from "./pages/LandingPage";
import { ConfirmProvider } from "./components/ConfirmDialog";
import AuditLogPage from "./pages/AuditLogPage";

function App() {
  return (
    <Router>
      <ConfirmProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<CashierPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/system" element={<SystemManagementPage />} />
          <Route path="/order-log" element={<OrderLogPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/pricing-management"
            element={<PricingManagementPage />}
          />
          <Route path="/audit-log" element={<AuditLogPage />} />
        </Routes>
      </ConfirmProvider>
    </Router>
  );
}

export default App;
