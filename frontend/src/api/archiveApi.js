import axios from "../utils/axiosInstance";

export function getArchiveRecords() {
    return axios.get("/api/archive");
}

export function saveArchiveSemester(data) {
    return axios.post("/api/archive", data);
}

export function deleteArchiveSemester(id) {
    return axios.delete(`/api/archive/${id}`);
}
