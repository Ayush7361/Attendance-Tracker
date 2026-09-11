import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTeacherAssignments() {
    const res = await axios.get(`${API_URL}/teacher/assignments`, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function getClassRoster(classId) {
    const res = await axios.get(`${API_URL}/teacher/class/${classId}/roster`, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function submitTeacherAttendance(payload) {
    const res = await axios.post(`${API_URL}/teacher/attendance`, payload, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function getCoveredSubjects() {
    const res = await axios.get(`${API_URL}/teacher/covered-subjects`, {
        headers: getAuthHeader()
    });
    return res.data;
}
