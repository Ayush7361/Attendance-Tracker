/**
 * Utility to export events or deadlines to iCalendar (.ics) format and trigger browser download.
 */

function formatDateToICS(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hours = String(d.getUTCHours()).padStart(2, "0");
    const minutes = String(d.getUTCMinutes()).padStart(2, "0");
    const seconds = String(d.getUTCSeconds()).padStart(2, "0");
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function generateICS(items = [], calendarName = "Academic Schedule") {
    let icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Attendance Tracker App//EN",
        `X-WR-CALNAME:${calendarName}`,
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ];

    items.forEach((item, index) => {
        const title = item.title || item.name || "Academic Task";
        const dateRaw = item.dueDate || item.date || new Date().toISOString();
        const formattedDate = formatDateToICS(dateRaw);
        
        if (!formattedDate) return;

        const description = (item.description || item.subject || `Type: ${item.type || 'General'}`).replace(/\n/g, "\\n");
        const uid = `academic-task-${item._id || index}-${Date.now()}@attendancetracker.app`;

        icsLines.push("BEGIN:VEVENT");
        icsLines.push(`UID:${uid}`);
        icsLines.push(`SUMMARY:${title}`);
        icsLines.push(`DESCRIPTION:${description}`);
        icsLines.push(`DTSTART:${formattedDate}`);
        icsLines.push(`DTEND:${formattedDate}`);
        icsLines.push(`STATUS:${item.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`);
        icsLines.push("END:VEVENT");
    });

    icsLines.push("END:VCALENDAR");

    return icsLines.join("\r\n");
}

export function downloadICS(items = [], filename = "academic_schedule.ics") {
    if (!items || items.length === 0) {
        alert("No items to export!");
        return;
    }

    const icsContent = generateICS(items);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
