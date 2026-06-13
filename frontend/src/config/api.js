/** Base URL for REST API (PRD §7.4). Override with VITE_API_URL in `.env` */
const raw = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_BASE = raw.replace(/\/$/, "");
