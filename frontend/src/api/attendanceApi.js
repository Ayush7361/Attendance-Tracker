import axios from "../utils/axiosInstance";

export function getSchedule() {
    return axios.get("/api/schedule");
}

export function saveSchedule(schedule) {
    return axios.put("/api/schedule", schedule);
}

export function saveDay(dateOrData, totalClasses, attendedClasses) {
    if (typeof dateOrData === "object" && dateOrData !== null && dateOrData.date) {
        return axios.post("/api/days", dateOrData);
    }
    return axios.post("/api/days", { date: dateOrData, totalClasses, attendedClasses });
}

export function getDay(date) {
    return axios.get("/api/days", { params: { date } });
}

export function getMonthSummary(year, month) {
    return axios.get("/api/days/summary/month", { params: { year, month } });
}

export function getOverallSummary() {
    return axios.get("/api/days/summary/overall");
}

export function getMonthRecords(year, month) {
    return axios.get("/api/days/month-records", { params: { year, month } });
}

export function deleteDayRange(start, end) {
    return axios.delete("/api/days", { data: { start, end } });
}

export function resetAll() {
    return axios.delete("/api/days", { data: { all: true } });
}