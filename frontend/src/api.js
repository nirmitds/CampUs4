// In production (Docker/Render) the backend serves the frontend on the same origin,
// so API calls are relative. In dev, proxy via vite to localhost:5000.
const API = import.meta.env.VITE_API_URL || "";
export default API;
