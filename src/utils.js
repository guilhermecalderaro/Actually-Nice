export function log(...args) {
    console.log('[Actually NICE]', ...args);
}

export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseTimeToMinutes(timeStr) {
    const date = new Date(`1970-01-01 ${timeStr}`);
    return (date.getHours() * 60) + date.getMinutes();
}

export function minutesToHHMM(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function parseDayDate(dayText) {
    const [, datePart] = dayText.split(' ');
    // Handle potential invalid date
    if (!datePart) return new Date(); 
    return new Date(datePart);
}

export function extractDayLabel(dayText) {
    const parts = dayText.split(' ');
    return {
        short: parts[0],
        date: parts[1],
        full: dayText
    };
}

export function isFutureDay(dayText) {
    const dayDate = parseDayDate(dayText);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate > today;
}

export function sortActivitiesDesc(activities) {
    return Object.entries(activities)
        .sort((a, b) => b[1].minutes - a[1].minutes);
}

export function sortDaysDesc(byDay) {
    return Object.keys(byDay)
        .sort((a, b) => parseDayDate(b) - parseDayDate(a));
}

export function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
