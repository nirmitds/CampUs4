import { useState, useEffect } from "react";
import axios from "axios";
import API from "../api.js";

const tok = () => localStorage.getItem("token");
const hdrs = () => ({ Authorization: `Bearer ${tok()}` });

export function useVerification() {
  const [idVerified,    setIdVerified]    = useState(null);
  const [emailVerified, setEmailVerified] = useState(null);

  useEffect(() => {
    if (!tok()) { setIdVerified("none"); setEmailVerified(false); return; }
    axios.get(`${API}/auth/me`, { headers: hdrs() })
      .then(r => {
        setIdVerified(r.data.user?.idVerified || "none");
        setEmailVerified(r.data.user?.emailVerified ?? true); // default true for existing users
      })
      .catch(() => { setIdVerified("none"); setEmailVerified(false); });
  }, []);

  const isEmailVerified = emailVerified === true;
  const isIdVerified    = idVerified === "verified";
  const isVerified      = isEmailVerified && isIdVerified;
  const isLoading       = idVerified === null;

  return { idVerified, emailVerified, isEmailVerified, isIdVerified, isVerified, isLoading };
}
