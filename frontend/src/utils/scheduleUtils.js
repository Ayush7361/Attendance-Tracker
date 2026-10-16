export function classDisplayName(item) {
    if (!item) return "";
    if (typeof item === "string") return item.trim();
    return String(item.name || "").trim();
}

export function dayClassNames(dayArr) {
    if (!Array.isArray(dayArr)) return [];
    return dayArr.map(classDisplayName).filter(Boolean);
}
