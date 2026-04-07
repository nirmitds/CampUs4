// Backend URL — set VITE_API_URL in your deployment environment
// Render static site: set in Environment Variables
// Local dev: falls back to localhost:5000
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
export default API;
