import axios from "../utils/axiosInstance";

export function getSemesterEvents() {
    return axios.get("/api/semester-events");
}

export function createSemesterEvent(data) {
    return axios.post("/api/semester-events", data);
}

export function deleteSemesterEvent(id) {
    return axios.delete("/api/semester-events/" + id);
}
