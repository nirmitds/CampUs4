import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") {
      setStatus("fail");
      return;
    }

    axios.get("http://localhost:5000/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        /* admins must use /admin — block them from student app */
        if (r.data.user?.role === "admin") {
          setStatus("admin");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setStatus("fail");
      });
  }, []);

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#05050f", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid rgba(59,130,246,0.2)",
          borderTopColor: "#3b82f6", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: "sans-serif", fontSize: 14 }}>
          Verifying session…
        </span>
      </div>
    );
  }

  if (status === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (status === "fail")  return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;