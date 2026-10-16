const assert = require("assert");
const {
    mergeStudentSubjects,
    recalcTotals,
    applyTeacherMark,
    isTeacherLocked
} = require("./utils/attendanceMath");
const { parseDateKey, monthRangeUtc, isFutureDateKey, localDateKey } = require("./utils/dateKey");

function run() {
    const covered = new Set(["physics"]);

    const merged = mergeStudentSubjects(
        [
            { name: "Physics", status: "missed", source: "teacher" },
            { name: "Math", status: "attended", source: "self" }
        ],
        [
            { name: "Physics", status: "attended" },
            { name: "Math", status: "missed" },
            { name: "Lab", status: "attended" }
        ],
        covered
    );

    assert.strictEqual(merged.find((s) => s.name === "Physics").status, "missed");
    assert.strictEqual(merged.find((s) => s.name === "Physics").source, "teacher");
    assert.strictEqual(merged.find((s) => s.name === "Math").status, "missed");
    assert.strictEqual(merged.find((s) => s.name === "Lab").status, "attended");

    const totals = recalcTotals(merged);
    assert.strictEqual(totals.totalClasses, 3);
    assert.strictEqual(totals.attendedClasses, 1);

    const cancelled = recalcTotals([
        { status: "attended" },
        { status: "cancelled" },
        { status: "missed" }
    ]);
    assert.strictEqual(cancelled.totalClasses, 2);
    assert.strictEqual(cancelled.attendedClasses, 1);

    const marked = applyTeacherMark(
        [{ name: "Math", status: "attended", source: "self" }],
        "Math",
        "missed"
    );
    assert.strictEqual(marked.changed, true);
    assert.strictEqual(marked.subjects[0].source, "teacher");
    assert.strictEqual(marked.subjects[0].status, "missed");

    const same = applyTeacherMark(marked.subjects, "Math", "missed");
    assert.strictEqual(same.changed, false);

    const classOne = applyTeacherMark([], "Math", "attended", "class-one");
    const twoClasses = applyTeacherMark(classOne.subjects, "Math", "missed", "class-two");
    assert.strictEqual(twoClasses.subjects.length, 2);
    assert.strictEqual(recalcTotals(twoClasses.subjects).totalClasses, 2);

    assert.strictEqual(isTeacherLocked({ name: "Physics", source: "self" }, covered), true);
    assert.strictEqual(isTeacherLocked({ name: "Math", source: "self" }, covered), false);

    const key = parseDateKey("2026-10-16");
    assert.strictEqual(key.toISOString(), "2026-10-16T00:00:00.000Z");
    const range = monthRangeUtc(2026, 10);
    assert.ok(key >= range.start && key < range.end);
    assert.strictEqual(isFutureDateKey(localDateKey()), false);

    // Timezone grace check: tomorrow relative to UTC is allowed, but 3 days later is rejected
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 3);
    assert.strictEqual(isFutureDateKey(farFuture), true);

    // Attendance Viability Math assertions
    function computeViability(total, attended, targetPct) {
        const targetDec = targetPct / 100;
        const pct = total > 0 ? (attended / total) * 100 : 0;
        const isSafe = pct >= targetPct;
        let safeBunks = 0;
        let recoveryNeeded = 0;
        if (total > 0) {
            if (isSafe) {
                safeBunks = Math.max(0, Math.floor((attended - targetDec * total) / targetDec));
            } else {
                const num = targetDec * total - attended;
                const den = 1 - targetDec;
                recoveryNeeded = den > 0 ? Math.ceil(num / den) : 0;
            }
        }
        return { isSafe, safeBunks, recoveryNeeded };
    }

    const v1 = computeViability(10, 9, 75);
    assert.strictEqual(v1.isSafe, true);
    assert.strictEqual(v1.safeBunks, 2);
    assert.strictEqual(v1.recoveryNeeded, 0);

    const v2 = computeViability(10, 6, 75);
    assert.strictEqual(v2.isSafe, false);
    assert.strictEqual(v2.safeBunks, 0);
    assert.strictEqual(v2.recoveryNeeded, 6);

    const v3 = computeViability(10, 8, 85);
    assert.strictEqual(v3.isSafe, false);
    assert.strictEqual(v3.safeBunks, 0);
    assert.strictEqual(v3.recoveryNeeded, 4);

    console.log("attendance math and viability tests passed");
}

run();
