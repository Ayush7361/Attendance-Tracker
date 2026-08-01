let dummySchedule = { mon: 2, tue: 1, wed: 2, thu: 1, fri: 2, sat: 1 };

let dummyMonths = {
    January: { total: 20, attended: 17 },
    February: { total: 15, attended: 10 }
};

export function getSchedule() {
    return Promise.resolve({ data: dummySchedule });
}

export function saveSchedule(schedule) {
    dummySchedule = schedule;
    return Promise.resolve({ data: dummySchedule });
}

export function getMonths() {
    const monthsArray = Object.keys(dummyMonths).map((month) => ({
        month: month,
        total: dummyMonths[month].total,
        attended: dummyMonths[month].attended
    }));
    return Promise.resolve({ data: monthsArray });
}

export function addWeek(month, scheduled, attended) {
    if (!dummyMonths[month]) {
        dummyMonths[month] = { total: 0, attended: 0 };
    }
    dummyMonths[month].total += scheduled;
    dummyMonths[month].attended += attended;
    return Promise.resolve({ data: dummyMonths[month] });
}

export function resetMonth(month) {
    delete dummyMonths[month];
    return Promise.resolve({ data: {} });
}

export function resetAll() {
    dummyMonths = {};
    return Promise.resolve({ data: {} });
}