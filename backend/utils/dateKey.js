function pad(n) {
    return String(n).padStart(2, "0");
}

function localDateKey(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseDateKey(input) {
    if (!input) return null;
    if (typeof input === "string") {
        const match = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
        }
    }
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function monthRangeUtc(year, month) {
    const y = Number(year);
    const m = Number(month);
    return {
        start: new Date(Date.UTC(y, m - 1, 1)),
        end: new Date(Date.UTC(y, m, 1))
    };
}

function isFutureDateKey(input) {
    const parsed = parseDateKey(input);
    if (!parsed) return false;
    const today = parseDateKey(localDateKey());
    return parsed > today;
}

module.exports = {
    localDateKey,
    parseDateKey,
    monthRangeUtc,
    isFutureDateKey
};
