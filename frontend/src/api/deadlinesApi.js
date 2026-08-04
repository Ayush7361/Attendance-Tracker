import axios from "../utils/axiosInstance";

export function getDeadlines(params = {}) {
    return axios.get("/api/deadlines", { params });
}

export function getDeadline(id) {
    return axios.get("/api/deadlines/" + id);
}

export function createDeadline(data) {
    return axios.post("/api/deadlines", data);
}

export function updateDeadline(id, data) {
    return axios.put("/api/deadlines/" + id, data);
}

export function deleteDeadline(id) {
    return axios.delete("/api/deadlines/" + id);
}

export function getDeadlineAnalytics() {
    return axios.get("/api/deadlines/analytics");
}

export function getDeadlineSubjects() {
    return axios.get("/api/deadlines/subjects");
}

export function getWorkloadForecast() {
    return axios.get("/api/deadlines/forecast");
}

export function getDeadlineInsights() {
    return axios.get("/api/deadlines/insights");
}

export function rescheduleDeadline(id, days = 7) {
    return axios.post("/api/deadlines/" + id + "/reschedule", { days });
}
