const ALLOWED_STATUS = new Set(["attended", "missed", "cancelled"]);

function subjectKey(name) {
    return String(name || "").trim().toLowerCase();
}

function isTeacherLocked(subject, coveredSet) {
    if (!subject) return false;
    if (subject.source === "teacher") return true;
    const key = subjectKey(subject.name);
    return Boolean(key && coveredSet && coveredSet.has(key));
}

function normalizeStatus(status) {
    return ALLOWED_STATUS.has(status) ? status : "attended";
}

function mergeStudentSubjects(existingSubjects, incomingSubjects, coveredSet) {
    const existing = Array.isArray(existingSubjects) ? existingSubjects : [];
    const incoming = Array.isArray(incomingSubjects) ? incomingSubjects : [];
    const locked = existing.filter((s) => isTeacherLocked(s, coveredSet));
    const lockedNames = new Set(locked.map((s) => subjectKey(s.name)));

    const merged = locked.map((s) => ({
        name: String(s.name || "").trim(),
        status: normalizeStatus(s.status),
        source: "teacher"
    }));

    for (const s of incoming) {
        const name = String(s.name || "").trim();
        if (!name) continue;
        if (lockedNames.has(subjectKey(name))) continue;
        merged.push({
            name,
            status: normalizeStatus(s.status),
            source: "self"
        });
    }

    return merged;
}

function recalcTotals(subjects) {
    let totalClasses = 0;
    let attendedClasses = 0;
    for (const s of subjects || []) {
        if (s.status === "cancelled") continue;
        totalClasses += 1;
        if (s.status === "attended") attendedClasses += 1;
    }
    return { totalClasses, attendedClasses };
}

function applyTeacherMark(existingSubjects, subjectName, status) {
    const subjects = Array.isArray(existingSubjects)
        ? existingSubjects.map((s) => ({
            name: s.name,
            status: s.status,
            source: s.source || "self"
        }))
        : [];
    const key = subjectKey(subjectName);
    const idx = subjects.findIndex((s) => subjectKey(s.name) === key);
    const previousStatus = idx >= 0 ? subjects[idx].status : null;
    const nextStatus = normalizeStatus(status);

    if (idx >= 0) {
        subjects[idx].status = nextStatus;
        subjects[idx].source = "teacher";
        subjects[idx].name = String(subjectName).trim();
    } else {
        subjects.push({
            name: String(subjectName).trim(),
            status: nextStatus,
            source: "teacher"
        });
    }

    return {
        subjects,
        previousStatus,
        changed: previousStatus !== nextStatus
    };
}

module.exports = {
    subjectKey,
    isTeacherLocked,
    mergeStudentSubjects,
    recalcTotals,
    applyTeacherMark
};
