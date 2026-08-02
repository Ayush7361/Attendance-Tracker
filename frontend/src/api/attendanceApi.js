import axios from "../utils/axiosInstance";

export function getSchedule() {
    return axios.get("/api/schedule");
}

export function saveSchedule(schedule) {
    return axios.put("/api/schedule", schedule);
}

export function getMonths() {
    return axios.get("/api/months");
}

export function addWeek(month, scheduled, attended) {
    return axios.post("/api/months/add-week", { month, scheduled, attended });
}

export function resetMonth(month) {
    return axios.delete("/api/months/" + month);
}

export function resetAll() {
    return axios.delete("/api/months");
}