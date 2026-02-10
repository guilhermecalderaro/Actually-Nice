// ==UserScript==
// @name         Actually NICE – My Schedule Summary (Dropdown @ H1)
// @namespace    https://github.com/actually-nice/actually-nice
// @version      0.3.1
// @description  Builds a dropdown summary table in the main document, anchored to the "My Schedule" H1 block.
// @match        https://equiti-wfm.nicecloudsvc.com/wfm/webstation/my-schedule*
// @grant        none
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const IFRAME_SELECTOR = 'iframe.legacy-wrapper';
    const TABLE_SELECTOR = '#scheduleDetailTableDiv > table';

    const CHECK_INTERVAL_MS = 500;
    const READY_TIMEOUT_MS = 15_000;
    const READY_POLL_MS = 250;

    const UI = {
        rootId: 'an-root',
        toggleId: 'an-toggle',
        panelId: 'an-panel',
        tableId: 'an-summary-table',
        // Anchor: the H1 block inside main/app-home-page
        anchorSelector: 'body > app-root > div > main > app-home-page > h1.page-title',
        // We will mount inside app-home-page, positioned relative to it
        containerSelector: 'body > app-root > div > main > app-home-page'
    };

    const STATE = {
        iframe: null,
        iframeDoc: null,
        lastDoc: null,
        lastSnapshotKey: '',
        tickTimer: null,
        isOpen: false
    };

    function log(...args) {
        // eslint-disable-next-line no-console
        console.log('[Actually NICE]', ...args);
    }

    function getIframe() {
        return document.querySelector(IFRAME_SELECTOR);
    }

    function getIframeDocument(iframe) {
        try {
            return iframe.contentDocument || iframe.contentWindow.document;
        } catch (_) {
            return null;
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function waitForIframeReady(iframe) {
        const startedAt = Date.now();

        while (Date.now() - startedAt <= READY_TIMEOUT_MS) {
            const doc = getIframeDocument(iframe);
            if (doc && doc.body) {
                const baseTable = doc.querySelector(TABLE_SELECTOR);
                if (baseTable) {
                    return doc;
                }
            }
            await sleep(READY_POLL_MS);
        }

        return null;
    }

    function parseTimeToMinutes(timeStr) {
        const date = new Date(`1970-01-01 ${timeStr}`);
        return (date.getHours() * 60) + date.getMinutes();
    }

    function minutesToHHMM(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function parseDayDate(dayText) {
        const [, datePart] = dayText.split(' ');
        return new Date(datePart);
    }

    function extractDayLabel(dayText) {
        const parts = dayText.split(' ');
        return {
            short: parts[0],
            date: parts[1],
            full: dayText
        };
    }

    function isFutureDay(dayText) {
        const dayDate = parseDayDate(dayText);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dayDate > today;
    }

    function sortActivitiesDesc(activities) {
        return Object.entries(activities)
            .sort((a, b) => b[1].minutes - a[1].minutes);
    }

    function sortDaysDesc(byDay) {
        return Object.keys(byDay)
            .sort((a, b) => parseDayDate(b) - parseDayDate(a));
    }

    function escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function buildSummary(iframeDoc) {
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

    function buildSnapshotKey(summary) {
        const days = sortDaysDesc(summary.byDay);
        const activities = sortActivitiesDesc(summary.byActivity);

        const dayHead = days.slice(0, 5).join('|');
        const actHead = activities.slice(0, 8)
            .map(([name, data]) => `${name}:${data.minutes}`)
            .join('|');

        return `${days.length}/${activities.length}::${dayHead}::${actHead}`;
    }

    function buildDropdownTableHtml(summary) {
        const weekRows = sortActivitiesDesc(summary.byActivity);
        const dayKeys = sortDaysDesc(summary.byDay);

        const headerRow = `
            <tr class="an-hdr">
                <th class="an-th an-center">Day</th>
                <th class="an-th">Activity</th>
                <th class="an-th an-center">Total</th>
            </tr>
        `;

        let striped = false;
        let lastGroup = null;

        function rowHtml(groupKey, dayText, indexRow, activity, data, isTotal) {
            if (groupKey !== lastGroup) {
                striped = !striped;
                lastGroup = groupKey;
            }

            let dayLabel = '';
            if (indexRow > 1) {
                dayLabel = '';
            } else if (groupKey === 'WEEK') {
                dayLabel = indexRow === 0 ? 'Week' : '';
            } else {
                const label = extractDayLabel(dayText);
                dayLabel = indexRow === 0 ? label.short : label.date;
            }

            const imgHtml = data.imgSrc ? `
                <img
                    src="${escapeHtml(data.imgSrc)}"
                    alt=""
                    class="an-ico"
                >
            ` : '';

            const total = minutesToHHMM(data.minutes);

            return `
                <tr class="${striped ? 'an-row an-striped' : 'an-row'}">
                    <td class="an-td an-center" title="${escapeHtml(dayText)}">${escapeHtml(dayLabel)}</td>
                    <td class="an-td" title="${escapeHtml(activity)}">
                        <span class="an-activity">
                            ${imgHtml}
                            <span class="an-activity-text">${escapeHtml(activity)}</span>
                        </span>
                    </td>
                    <td class="an-td an-center ${isTotal ? 'an-bold' : ''}"
                        title="${escapeHtml(total)} (${escapeHtml(String(data.minutes))} minutos)">
                        ${escapeHtml(total)}
                    </td>
                </tr>
            `;
        }

        const bodyParts = [];

        weekRows.forEach(([activity, data], index) => {
            bodyParts.push(rowHtml('WEEK', 'WEEK', index, activity, data, true));
        });

        dayKeys.forEach((day) => {
            const activities = sortActivitiesDesc(summary.byDay[day]);
            activities.forEach(([activity, data], index) => {
                bodyParts.push(rowHtml(day, day, index, activity, data, false));
            });
        });

        return `
            <table id="${UI.tableId}" class="an-table">
                <thead>${headerRow}</thead>
                <tbody>${bodyParts.join('')}</tbody>
            </table>
        `;
    }

    function ensureStyles() {
        const styleId = 'an-styles';
        if (document.getElementById(styleId)) {
            return;
        }

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Container anchored to app-home-page (relative) */
            #${UI.rootId} {
                position: absolute;
                top: 10px;
                right: 10px;
                display: inline-flex;
                align-items: center;
                z-index: 2147483646;
                font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            #${UI.toggleId} {
                font-size: 12px;
                line-height: 1;
                padding: 6px 10px;
                border-radius: 10px;
                border: 1px solid rgba(0, 0, 0, 0.18);
                background: rgba(255, 255, 255, 0.85);
                color: #223037;
                cursor: pointer;
                user-select: none;
                display: inline-flex;
                gap: 6px;
                align-items: center;
            }

            #${UI.toggleId}:hover {
                background: rgba(255, 255, 255, 0.98);
            }

            #${UI.panelId} {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                width: 520px;
                max-width: min(calc(100vw - 24px), 720px);
                max-height: calc(100vh - 180px);
                overflow: auto;
                background: #fff;
                color: #111;
                border: 1px solid rgba(0, 0, 0, 0.18);
                border-radius: 12px;
                box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
                display: none;
            }

            #${UI.panelId}.an-open {
                display: block;
            }

            #${UI.panelId} .an-panel-header {
                position: sticky;
                top: 0;
                background: rgba(255, 255, 255, 0.98);
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
                padding: 10px 12px;
                display: flex;
                gap: 10px;
                align-items: baseline;
                justify-content: space-between;
            }

            #${UI.panelId} .an-title {
                font-size: 13px;
                font-weight: 600;
                margin: 0;
            }

            #${UI.panelId} .an-meta {
                font-size: 11px;
                color: #555;
                display: inline-flex;
                gap: 10px;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            #${UI.panelId} .an-panel-body {
                padding: 10px 12px 12px;
            }

            .an-table {
                width: 100%;
                border-collapse: collapse;
                table-layout: auto;
                font-size: 12px;
            }

            .an-th, .an-td {
                border: 1px solid rgba(0, 0, 0, 0.12);
                padding: 6px 6px;
                vertical-align: top;
            }

            .an-hdr .an-th {
                font-weight: 600;
                background: rgba(0, 0, 0, 0.03);
            }

            .an-center {
                text-align: center;
                white-space: nowrap;
            }

            .an-striped {
                background: #f5f5f5;
            }

            .an-bold {
                font-weight: 600;
            }

            .an-activity {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                min-width: 0;
            }

            .an-ico {
                width: 14px;
                height: 14px;
                flex: 0 0 auto;
            }

            .an-activity-text {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: inline-block;
                max-width: 360px;
            }

            .an-empty {
                font-size: 12px;
                color: #666;
                padding: 6px 0;
            }
        `;
        document.head.appendChild(style);
    }

    function ensureAnchorLayout() {
        const container = document.querySelector(UI.containerSelector);
        const anchor = document.querySelector(UI.anchorSelector);

        if (!container || !anchor) {
            return null;
        }

        const cs = window.getComputedStyle(container);
        if (cs.position === 'static') {
            container.style.position = 'relative';
        }

        return container;
    }

    function ensureDropdownUi() {
        ensureStyles();

        const container = ensureAnchorLayout();
        if (!container) {
            return null;
        }

        let root = document.getElementById(UI.rootId);
        if (root) {
            // If DOM re-rendered and our root got detached, re-append.
            if (!root.isConnected) {
                container.appendChild(root);
            }
            return root;
        }

        root = document.createElement('div');
        root.id = UI.rootId;

        const btn = document.createElement('button');
        btn.id = UI.toggleId;
        btn.type = 'button';
        btn.innerHTML = '<span>Actually NICE</span><span style="opacity:.8">▾</span>';

        const panel = document.createElement('div');
        panel.id = UI.panelId;
        panel.innerHTML = `
            <div class="an-panel-header">
                <p class="an-title">Schedule Summary</p>
                <div class="an-meta">
                    <span data-an-meta="updated">Updated: -</span>
                    <span data-an-meta="source">Source: -</span>
                </div>
            </div>
            <div class="an-panel-body">
                <div class="an-empty">Waiting for schedule...</div>
            </div>
        `;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            STATE.isOpen = !STATE.isOpen;
            panel.classList.toggle('an-open', STATE.isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!STATE.isOpen) {
                return;
            }
            if (!root.contains(e.target)) {
                STATE.isOpen = false;
                panel.classList.remove('an-open');
            }
        });

        root.appendChild(btn);
        root.appendChild(panel);
        container.appendChild(root);

        return root;
    }

    function setMeta(updated, source) {
        const root = ensureDropdownUi();
        if (!root) {
            return;
        }

        const updatedEl = root.querySelector('[data-an-meta="updated"]');
        const sourceEl = root.querySelector('[data-an-meta="source"]');

        if (updatedEl) updatedEl.textContent = `Updated: ${updated}`;
        if (sourceEl) sourceEl.textContent = `Source: ${source}`;
    }

    function setBodyHtml(html) {
        const root = ensureDropdownUi();
        if (!root) {
            return;
        }

        const body = root.querySelector('.an-panel-body');
        if (body) body.innerHTML = html;
    }

    function renderFromIframeDoc(iframeDoc, reason) {
        if (!ensureDropdownUi()) {
            return;
        }

        const baseTable = iframeDoc.querySelector(TABLE_SELECTOR);
        if (!baseTable) {
            setMeta(new Date().toLocaleString(), `${reason} (no base table)`);
            setBodyHtml('<div class="an-empty">Base schedule table not found.</div>');
            return;
        }

        const summary = buildSummary(iframeDoc);
        const snapshotKey = buildSnapshotKey(summary);

        if (snapshotKey === STATE.lastSnapshotKey && iframeDoc === STATE.lastDoc) {
            setMeta(new Date().toLocaleString(), `${reason} (no changes)`);
            return;
        }

        STATE.lastSnapshotKey = snapshotKey;
        STATE.lastDoc = iframeDoc;

        setMeta(new Date().toLocaleString(), reason);
        setBodyHtml(buildDropdownTableHtml(summary));

        log('Rendered dropdown summary:', reason);
    }

    async function onIframeLoad() {
        const iframe = getIframe();
        if (!iframe) return;

        STATE.iframe = iframe;
        STATE.iframeDoc = null;
        STATE.lastSnapshotKey = '';
        STATE.lastDoc = null;

        const doc = await waitForIframeReady(iframe);
        if (!doc) {
            setMeta(new Date().toLocaleString(), 'iframe load (not ready)');
            setBodyHtml('<div class="an-empty">Schedule not ready yet.</div>');
            return;
        }

        STATE.iframeDoc = doc;
        renderFromIframeDoc(doc, 'iframe load');
    }

    function bindIframeLoad(iframe) {
        if (iframe.dataset.anBound === '1') {
            return;
        }

        iframe.dataset.anBound = '1';
        iframe.addEventListener('load', onIframeLoad);

        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            onIframeLoad();
        }
    }

    function ensureIframeBound() {
        const iframe = getIframe();
        if (!iframe) {
            return;
        }
        bindIframeLoad(iframe);
    }

    function startTopWatcher() {
        if (STATE.tickTimer) {
            clearInterval(STATE.tickTimer);
        }

        STATE.tickTimer = setInterval(() => {
            try {
                ensureDropdownUi();
                ensureIframeBound();

                const iframe = STATE.iframe || getIframe();
                if (!iframe) return;

                const doc = getIframeDocument(iframe);
                if (!doc || !doc.body) return;

                if (doc !== STATE.iframeDoc) {
                    STATE.iframeDoc = doc;
                    STATE.lastSnapshotKey = '';
                    STATE.lastDoc = null;
                    renderFromIframeDoc(doc, 'doc swap');
                    return;
                }

                if (!doc.querySelector(TABLE_SELECTOR)) {
                    return;
                }

                renderFromIframeDoc(doc, 'watcher');
            } catch (_) {
                /* iframe may be in transition */
            }
        }, CHECK_INTERVAL_MS);
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                ensureDropdownUi();
                ensureIframeBound();
                startTopWatcher();
            });
            return;
        }

        ensureDropdownUi();
        ensureIframeBound();
        startTopWatcher();
    }

    init();
})();
