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
        classId: s.classId || null,
        status: normalizeStatus(s.status),
        source: "teacher"
    }));

    const seenSelfSubjects = new Set();
    for (const s of incoming) {
        const name = String(s.name || "").trim();
        const key = subjectKey(name);
        if (!name || seenSelfSubjects.has(key)) continue;
        seenSelfSubjects.add(key);
        if (lockedNames.has(key)) continue;
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

function applyTeacherMark(existingSubjects, subjectName, status, classId) {
    const subjects = Array.isArray(existingSubjects)
        ? existingSubjects.map((s) => ({
            name: s.name,
            classId: s.classId || null,
            status: s.status,
            source: s.source || "self"
        }))
        : [];
    const key = subjectKey(subjectName);
    const classKey = String(classId || "");
    // Legacy self-records did not carry a class id.  A teacher may claim the
    // matching legacy self entry once; subsequent class sessions stay scoped.
    const idx = subjects.findIndex((s) =>
        subjectKey(s.name) === key &&
        (String(s.classId || "") === classKey || !s.classId)
    );
    const previousStatus = idx >= 0 ? subjects[idx].status : null;
    const nextStatus = normalizeStatus(status);

    if (idx >= 0) {
        subjects[idx].status = nextStatus;
        subjects[idx].source = "teacher";
        subjects[idx].name = String(subjectName).trim();
        subjects[idx].classId = classId;
    } else {
        subjects.push({
            name: String(subjectName).trim(),
            classId,
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
