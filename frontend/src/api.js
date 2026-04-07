// Strip trailing slash to prevent double-slash in URLs like //ping
const raw = import.meta.env.VITE_API_URL || "https://campus45.onrender.com";
const API = raw.replace(/\/$/, "");
export default API;
