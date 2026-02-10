import { UI } from './config.js';
import { 
    escapeHtml, 
    minutesToHHMM, 
    sortActivitiesDesc, 
    sortDaysDesc 
} from './utils.js';
import { ensureStyles } from './styles.js';

let isOpen = false;

export function buildDropdownTableHtml(summary) {
    const weekRows = sortActivitiesDesc(summary.byActivity);
    const dayKeys = sortDaysDesc(summary.byDay);

    function buildTable(rowsHtml) {
        return `
            <table class="an-table">
                <thead>
                    <tr class="an-hdr">
                        <th class="an-th">Activity</th>
                        <th class="an-th an-center" style="width: 80px;">Total</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;
    }

    let striped = false;
    
    function generateRowsHtml(items, groupKey, dayTextForLabel) {
        striped = false; // reset for each table
        
        return items.map(([activity, data], index) => {
            striped = !striped; // toggle
            
            const imgHtml = data.imgSrc ? `
                <img src="${escapeHtml(data.imgSrc)}" alt="" class="an-ico">
            ` : '';

            const total = minutesToHHMM(data.minutes);
            const isTotal = (groupKey === 'WEEK');

            return `
                <tr class="${striped ? 'an-row an-striped' : 'an-row'}">
                    <td class="an-td" title="${escapeHtml(activity)}">
                        <span class="an-activity">
                            ${imgHtml}
                            <span class="an-activity-text">${escapeHtml(activity)}</span>
                        </span>
                    </td>
                    <td class="an-td an-center ${isTotal ? 'an-bold' : ''}"
                        title="${escapeHtml(total)} (${escapeHtml(String(data.minutes))} min)">
                        ${escapeHtml(total)}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // -- Build Week Section --

    const weekRowsHtml = generateRowsHtml(weekRows, 'WEEK', 'WEEK');
    const weekTableHtml = buildTable(weekRowsHtml);

    // -- Build Day Sections --

    const daySectionsHtml = dayKeys.map((day) => {
        const activities = sortActivitiesDesc(summary.byDay[day]);
        const rowsHtml = generateRowsHtml(activities, 'DAY', day);
        const tableHtml = buildTable(rowsHtml);
        
        return `
            <details class="an-group an-day-group">
                <summary class="an-summary">${escapeHtml(day)}</summary>
                <div class="an-group-content">
                    ${tableHtml}
                </div>
            </details>
        `;
    }).join('');

    // -- Wrap everything in a top-level Week details --

    return `
        <details class="an-group an-week-group" open>
            <summary class="an-summary">Week Overview</summary>
            <div class="an-group-content">
                ${weekTableHtml}
                <div class="an-days-container">
                    ${daySectionsHtml}
                </div>
            </div>
        </details>
    `;
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

export function ensureDropdownUi() {
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
        isOpen = !isOpen;
        panel.classList.toggle('an-open', isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!isOpen) {
            return;
        }
        if (!root.contains(e.target)) {
            isOpen = false;
            panel.classList.remove('an-open');
        }
    });

    root.appendChild(btn);
    root.appendChild(panel);
    container.appendChild(root);

    return root;
}

export function setMeta(updated, source) {
    const root = ensureDropdownUi();
    if (!root) {
        return;
    }

    const updatedEl = root.querySelector('[data-an-meta="updated"]');
    const sourceEl = root.querySelector('[data-an-meta="source"]');

    if (updatedEl) updatedEl.textContent = `Updated: ${updated}`;
    if (sourceEl) sourceEl.textContent = `Source: ${source}`;
}

export function setBodyHtml(html) {
    const root = ensureDropdownUi();
    if (!root) {
        return;
    }

    const body = root.querySelector('.an-panel-body');
    if (body) body.innerHTML = html;
}
