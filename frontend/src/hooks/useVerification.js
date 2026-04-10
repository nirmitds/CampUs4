import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api.js";

const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

export function useVerification() {
  const [idVerified, setIdVerified] = useState(null); // null = loading

  useEffect(() => {
    if (!tok()) { setIdVerified("none"); return; }
    axios.get(`${API}/auth/me`, { headers: hdrs() })
      .then(r => setIdVerified(r.data.user?.idVerified || "none"))
      .catch(() => setIdVerified("none"));
  }, []);

  const isVerified = idVerified === "verified";
  const isLoading  = idVerified === null;

  return { idVerified, isVerified, isLoading };
}
