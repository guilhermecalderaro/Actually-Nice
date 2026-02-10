import { TABLE_SELECTOR } from './config.js';
import { isFutureDay, parseTimeToMinutes } from './utils.js';

export function buildSummary(iframeDoc) {
    const table = iframeDoc.querySelector(TABLE_SELECTOR);

    if (!table) {
        return { byDay: {}, byActivity: {} };
    }

    const rows = Array.from(table.querySelectorAll('tr'))
        .filter((row) => !row.classList.contains('schedTableHdr'));

    const byDay = {};
    const byActivity = {};
    let currentDay = null;

    rows.forEach((row) => {
        const cells = row.querySelectorAll('td, th');

        if (cells.length < 7) {
            return;
        }

        const dayCell = cells[1]?.innerText.trim();
        const activityCell = cells[4];
        const start = cells[5]?.innerText.trim();
        const end = cells[6]?.innerText.trim();

        if (dayCell) {
            currentDay = dayCell;
        }

        if (!currentDay || isFutureDay(currentDay)) {
            return;
        }

        if (!activityCell || !start || !end) {
            return;
        }

        const activityText = activityCell.innerText.trim();
        const img = activityCell.querySelector('img');
        const imgSrc = img ? img.getAttribute('src') : null;

        const duration = parseTimeToMinutes(end) - parseTimeToMinutes(start);

        if (!Number.isFinite(duration) || duration <= 0) {
            return;
        }

        byDay[currentDay] = byDay[currentDay] || {};
        byDay[currentDay][activityText] = byDay[currentDay][activityText] || {
            minutes: 0,
            imgSrc
        };
        byDay[currentDay][activityText].minutes += duration;

        byActivity[activityText] = byActivity[activityText] || {
            minutes: 0,
            imgSrc
        };
        byActivity[activityText].minutes += duration;
    });

    return { byDay, byActivity };
}
