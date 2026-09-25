import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function DebugAuth() {
  const { currentUser } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "6px",
        fontSize: "11px",
        zIndex: 9999,
      }}
    >
      <strong>Auth debug</strong>
      <br />
      {currentUser ? (
        <>
          {currentUser.email}
          <br />
          Type: {currentUser.accountType}
        </>
      ) : (
        "Not logged in"
      )}
    </div>
  );
}
