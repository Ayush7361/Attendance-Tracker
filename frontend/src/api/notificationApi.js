import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getUserNotifications() {
    const res = await axios.get(`${API_URL}/notifications`, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function markNotificationRead(id) {
    const res = await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function markAllNotificationsRead() {
    const res = await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: getAuthHeader()
    });
    return res.data;
}
