import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider } from "./context/FinanceContext";

/* LAYOUTS */
import PersonalLayout from "./layouts/PersonalLayout";
import BusinessLayout from "./layouts/BusinessLayout";

/* PERSONAL PAGES */
import Dashboard from "./pages/personal/Dashboard";
import MonthlyOverview from "./pages/personal/MonthlyOverview";
import DebtTracker from "./pages/personal/DebtTracker";
import Goals from "./pages/personal/Goals";
import Upgrade from "./pages/personal/Upgrade";
import Settings from "./pages/personal/Settings";
import TermsAndConditions from "./pages/personal/TermsAndConditions";
import PrivacyPolicy from "./pages/personal/PrivacyPolicy";

/* BUSINESS PAGES */
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessIncome from "./pages/business/BusinessIncome";
import BusinessExpenses from "./pages/business/BusinessExpenses";
import BusinessQuotations from "./pages/business/BusinessQuotations";
import BusinessInvoices from "./pages/business/BusinessInvoices";

/* AUTH PAGES */
import LandingPage from "./pages/auth/LandingPage"; // NEW
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

/* =================================================
   AUTH GUARD
================================================= */
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null; // ⏳ wait for auth resolution

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =================================================
   BUSINESS GUARD (PRO / LIFETIME ONLY)
================================================= */
function BusinessRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) return null; // ⏳ wait for auth resolution

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.plan !== "pro" && currentUser.plan !== "lifetime") {
    return <Navigate to="/upgrade" replace />;
  }

  return children;
}

/* =================================================
   SMART LANDING ROUTE
================================================= */
function SmartLandingRoute() {
  const { currentUser, loading } = useAuth();
  
  if (loading) return null;
  
  // Check if user has visited before (using localStorage)
  const hasVisitedBefore = localStorage.getItem("budgetpro_has_visited");
  
  // If logged in, go to dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If visited before (not first time), go to login
  if (hasVisitedBefore) {
    return <Navigate to="/login" replace />;
  }
  
  // First-time visitor - show landing page
  return <LandingPage />;
}

/* =================================================
   APP
================================================= */
export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            {/* ROOT - Smart Landing Page */}
            <Route path="/" element={<SmartLandingRoute />} />
            
            {/* PUBLIC */}
            <Route path="/preview" element={<LandingPage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

            {/* PERSONAL */}
            <Route
              element={
                <ProtectedRoute>
                  <PersonalLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<MonthlyOverview />} />
              <Route path="/debt-tracker" element={<DebtTracker />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/upgrade" element={<Upgrade />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* BUSINESS */}
            <Route
              element={
                <ProtectedRoute>
                  <BusinessRoute>
                    <BusinessLayout />
                  </BusinessRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/business" element={<BusinessDashboard />} />
              <Route path="/business/income" element={<BusinessIncome />} />
              <Route path="/business/expenses" element={<BusinessExpenses />} />
              <Route path="/business/quotations" element={<BusinessQuotations />} />
              <Route path="/business/invoices" element={<BusinessInvoices />} />
            </Route>

            {/* FALLBACK - Updated */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  );
}