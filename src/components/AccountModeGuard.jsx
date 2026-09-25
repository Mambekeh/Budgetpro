import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AccountModeGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Source of truth for account mode
  const accountType = localStorage.getItem("accountType") || "personal";
  const path = location.pathname;

  // Route classification
  const isBusinessRoute = path.startsWith("/business");

  const isPersonalRoute =
    path === "/dashboard" ||
    path === "/analytics" ||
    path === "/debt-tracker" ||
    path === "/settings";

  /**
   * ⛔ HARD BLOCK RENDER
   * Prevents wrong UI from mounting even for 1 frame
   */
  if (accountType === "personal" && isBusinessRoute) {
    return null;
  }

  if (accountType === "business" && isPersonalRoute) {
    return null;
  }

  /**
   * 🔁 SAFE REDIRECTION
   * Handles URL correction after mount
   */
  useEffect(() => {
    if (accountType === "personal" && isBusinessRoute) {
      navigate("/dashboard", { replace: true });
    }

    if (accountType === "business" && isPersonalRoute) {
      navigate("/business", { replace: true });
    }
  }, [accountType, path, navigate]);

  return children;
}
