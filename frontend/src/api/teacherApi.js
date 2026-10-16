import axios from "../utils/axiosInstance";

export async function getTeacherAssignments() {
    const res = await axios.get("/api/teacher/assignments");
    return res.data;
}

export async function getTodayTeacherSchedule(dateStr) {
    const url = dateStr
        ? `/api/teacher/today-schedule?date=${encodeURIComponent(dateStr)}`
        : "/api/teacher/today-schedule";
    const res = await axios.get(url);
    return res.data;
}

export async function getTeacherWeekSchedule() {
    const res = await axios.get("/api/teacher/week-schedule");
    return res.data;
}

export async function getClassRoster(classId, dateStr = "", subjectName = "") {
    const res = await axios.get(`/api/teacher/class/${classId}/roster`, {
        params: {
            ...(dateStr ? { date: dateStr } : {}),
            ...(subjectName ? { subjectName } : {})
        }
    });
    return res.data;
}

export async function submitTeacherAttendance(payload) {
    const res = await axios.post("/api/teacher/attendance", payload);
    return res.data;
}

export async function getClassAnalytics(classId) {
    const res = await axios.get(`/api/teacher/class/${classId}/analytics`);
    return res.data;
}

export async function getAuditHistory() {
    const res = await axios.get("/api/teacher/audit-history");
    return res.data;
}

export async function joinClassWithCode(joinCode) {
    const res = await axios.post("/api/teacher/class/join", { joinCode });
    return res.data;
}

export async function getClassRoutine(classId) {
    const res = await axios.get(`/api/teacher/class/${classId}/routine`);
    return res.data;
}

export async function saveClassRoutine(classId, routine) {
    const res = await axios.post(`/api/teacher/class/${classId}/routine`, { routine });
    return res.data;
}

export async function getCoveredSubjects() {
    const res = await axios.get("/api/teacher/covered-subjects");
    return res.data;
}
