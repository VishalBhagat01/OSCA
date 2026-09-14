import axios from "axios";

const baseURL =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api";

const apiKey =
    import.meta.env.VITE_API_KEY ||
    import.meta.env.VITE_AGENT_API_KEY ||
    "";

const api = axios.create({
    baseURL,
    headers: apiKey ? { "x-api-key": apiKey } : {},
});

export default api;
