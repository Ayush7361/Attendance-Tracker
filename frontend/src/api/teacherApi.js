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

export async function getTodayTeacherSchedule(dateStr) {
    const url = dateStr
        ? `${API_URL}/teacher/today-schedule?date=${encodeURIComponent(dateStr)}`
        : `${API_URL}/teacher/today-schedule`;
    const res = await axios.get(url, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function getClassRoster(classId, dateStr = "", subjectName = "") {
    let url = `${API_URL}/teacher/class/${classId}/roster`;
    const params = [];
    if (dateStr) params.push(`date=${encodeURIComponent(dateStr)}`);
    if (subjectName) params.push(`subjectName=${encodeURIComponent(subjectName)}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    const res = await axios.get(url, {
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

export async function getClassRoutine(classId) {
    const res = await axios.get(`${API_URL}/teacher/class/${classId}/routine`, {
        headers: getAuthHeader()
    });
    return res.data;
}

export async function saveClassRoutine(classId, routine) {
    const res = await axios.post(
        `${API_URL}/teacher/class/${classId}/routine`,
        { routine },
        { headers: getAuthHeader() }
    );
    return res.data;
}

export async function getCoveredSubjects() {
    const res = await axios.get(`${API_URL}/teacher/covered-subjects`, {
        headers: getAuthHeader()
    });
    return res.data;
}
