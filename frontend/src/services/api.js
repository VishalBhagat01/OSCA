import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: import.meta.env.VITE_API_KEY
        ? { "x-api-key": import.meta.env.VITE_API_KEY }
        : {},
});

export default api;
