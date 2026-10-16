import axios from "../utils/axiosInstance";

export async function getUserNotifications() {
    const res = await axios.get("/api/notifications");
    return res.data;
}

export async function markNotificationRead(id) {
    const res = await axios.put(`/api/notifications/${id}/read`);
    return res.data;
}

export async function markAllNotificationsRead() {
    const res = await axios.put("/api/notifications/read-all");
    return res.data;
}
