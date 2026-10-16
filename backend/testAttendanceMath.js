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

    console.log("attendance math tests passed");
}

run();
