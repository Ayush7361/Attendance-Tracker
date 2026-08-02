import axios from "../utils/axiosInstance";

export function registerUser(username, password) {
    return axios.post("/api/auth/register", { username, password });
}

export function loginUser(username, password) {
    return axios.post("/api/auth/login", { username, password });
}

export function logoutUser() {
    return axios.post("/api/auth/logout");
}