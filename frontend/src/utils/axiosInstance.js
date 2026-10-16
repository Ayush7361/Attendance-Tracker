import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = "Bearer " + token;
    }
    return config;
});

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.dispatchEvent(new Event("study-dashboard:unauthorized"));
        }
        return Promise.reject(error);
    }
);

export default instance;
