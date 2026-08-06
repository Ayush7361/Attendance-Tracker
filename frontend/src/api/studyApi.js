import axios from "../utils/axiosInstance";

const LOCAL_STORAGE_KEY = "at_study_sessions";

function getLocalSessions() {
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setLocalSessions(sessions) {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } catch (err) {
        console.error("Failed to write study sessions to localStorage", err);
    }
}

export async function getStudySessions() {
    try {
        const res = await axios.get("/api/study-sessions");
        if (Array.isArray(res.data)) {
            setLocalSessions(res.data);
            return res.data;
        }
    } catch (err) {
        console.warn("Backend unavailable, loading study sessions from localStorage", err);
    }
    return getLocalSessions();
}

export async function saveStudySession(sessionData) {
    let savedSession = null;
    try {
        const res = await axios.post("/api/study-sessions", sessionData);
        if (res.data) {
            savedSession = res.data;
        }
    } catch (err) {
        console.warn("Backend save failed, writing to localStorage", err);
    }

    if (!savedSession) {
        savedSession = {
            _id: "local_" + Date.now(),
            ...sessionData,
            date: sessionData.date || new Date().toISOString()
        };
    }

    const current = getLocalSessions();
    const updated = [savedSession, ...current];
    setLocalSessions(updated);
    return savedSession;
}

export async function deleteStudySession(id) {
    try {
        await axios.delete("/api/study-sessions/" + id);
    } catch (err) {
        console.warn("Backend delete failed, removing from localStorage", err);
    }
    const current = getLocalSessions();
    const updated = current.filter((s) => s._id !== id && s.id !== id);
    setLocalSessions(updated);
    return true;
}
