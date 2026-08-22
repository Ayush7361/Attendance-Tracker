import axios from "../utils/axiosInstance";

export function getGpaRecord() {
    return axios.get("/api/gpa");
}

export function saveGpaRecord(data) {
    return axios.put("/api/gpa", data);
}
