// ==UserScript==
// @name         Actually NICE – My Schedule Summary
// @version      0.3.3
// @description  Builds a dropdown summary table in the main document.
// @author       Guilherme Calderaro <guilhermecald96@gmail.com>
// @source       https://github.com/guilhermecalderaro/Actually-Nice
// @match        https://equiti-wfm.nicecloudsvc.com/wfm/webstation/my-schedule*
// @noframes
// @grant        none
// ==/UserScript==

(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/config.js
  var IFRAME_SELECTOR, TABLE_SELECTOR, CHECK_INTERVAL_MS, READY_TIMEOUT_MS, READY_POLL_MS, UI;
  var init_config = __esm({
    "src/config.js"() {
      IFRAME_SELECTOR = "iframe.legacy-wrapper";
      TABLE_SELECTOR = "#scheduleDetailTableDiv > table";
      CHECK_INTERVAL_MS = 5e3;
      READY_TIMEOUT_MS = 15e3;
      READY_POLL_MS = 250;
      UI = {
        rootId: "an-root",
        toggleId: "an-toggle",
        panelId: "an-panel",
        tableId: "an-summary-table",
        anchorSelector: "body > app-root > div > main > app-home-page > h1.page-title",
        containerSelector: "body > app-root > div > main > app-home-page"
      };
    }
  });

  // src/utils.js
  function log(...args) {
    console.log("[Actually NICE]", ...args);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function parseTimeToMinutes(timeStr) {
    const date = /* @__PURE__ */ new Date(`1970-01-01 ${timeStr}`);
    return date.getHours() * 60 + date.getMinutes();
  }
  function minutesToHHMM(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  function parseDayDate(dayText) {
    const [, datePart] = dayText.split(" ");
    if (!datePart) return /* @__PURE__ */ new Date();
    return new Date(datePart);
  }
  function isFutureDay(dayText) {
    const dayDate = parseDayDate(dayText);
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    return dayDate > today;
  }
  function sortActivitiesDesc(activities) {
    return Object.entries(activities).sort((a, b) => b[1].minutes - a[1].minutes);
  }
  function sortDaysDesc(byDay) {
    return Object.keys(byDay).sort((a, b) => parseDayDate(b) - parseDayDate(a));
  }
  function escapeHtml(text) {
    return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  var init_utils = __esm({
    "src/utils.js"() {
    }
  });

  // src/parser.js
  function buildSummary(iframeDoc) {
    const table = iframeDoc.querySelector(TABLE_SELECTOR);
    if (!table) {
      return { byDay: {}, byActivity: {} };
    }
    const rows = Array.from(table.querySelectorAll("tr")).filter((row) => !row.classList.contains("schedTableHdr"));
    const byDay = {};
    const byActivity = {};
    let currentDay = null;
    rows.forEach((row) => {
      const cells = row.querySelectorAll("td, th");
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
      const img = activityCell.querySelector("img");
      const imgSrc = img ? img.getAttribute("src") : null;
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
  var init_parser = __esm({
    "src/parser.js"() {
      init_config();
      init_utils();
    }
  });

  // src/styles.js
  function ensureStyles() {
    const styleId = "an-styles";
    if (document.getElementById(styleId)) {
      return;
    }
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        /* Container anchored to app-home-page (relative) */
        #${UI.rootId} {
            position: absolute;
            bottom: 10px;
            right: 30px;
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
            bottom: calc(100% + 8px);
            right: 0;
            width: 350px;
            max-width: min(calc(100vw - 24px), 720px);
            max-height: calc(50vh - 140px);
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

        /* --- Groups / Details --- */
        .an-group {
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 6px;
            margin-bottom: 8px;
            background: #fff;
            overflow: hidden;
        }
        .an-group[open] {
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .an-summary {
            padding: 8px 12px;
            background: rgba(0,0,0,0.02);
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            user-select: none;
            display: flex; /* or block */
            align-items: center;
            list-style: none; /* hide default triangle in some browsers */
        }
        .an-summary::-webkit-details-marker {
            display: none;
        }
        /* Custom arrow */
        .an-summary::before {
            content: '\u25B8';
            display: inline-block;
            width: 16px;
            margin-right: 4px;
            transition: transform 0.15s;
        }
        .an-group[open] > .an-summary::before {
            transform: rotate(90deg);
        }

        .an-group-content {
            padding: 0;
        }

        .an-week-group {
            border: 1px solid rgba(0,0,0,0.15);
        }
        .an-week-group > .an-summary {
            background: rgba(0,0,0,0.05);
            font-size: 13px;
        }
        
        .an-days-container {
            padding: 8px;
            background: rgba(0,0,0,0.01);
        }
        
        .an-day-group {
            margin-bottom: 6px;
        }
        .an-day-group:last-child {
            margin-bottom: 0;
        }
    `;
    document.head.appendChild(style);
  }
  var init_styles = __esm({
    "src/styles.js"() {
      init_config();
    }
  });

  // src/ui.js
  function buildDropdownTableHtml(summary) {
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
      striped = false;
      return items.map(([activity, data], index) => {
        striped = !striped;
        const imgHtml = data.imgSrc ? `
                <img src="${escapeHtml(data.imgSrc)}" alt="" class="an-ico">
            ` : "";
        const total = minutesToHHMM(data.minutes);
        const isTotal = groupKey === "WEEK";
        return `
                <tr class="${striped ? "an-row an-striped" : "an-row"}">
                    <td class="an-td" title="${escapeHtml(activity)}">
                        <span class="an-activity">
                            ${imgHtml}
                            <span class="an-activity-text">${escapeHtml(activity)}</span>
                        </span>
                    </td>
                    <td class="an-td an-center ${isTotal ? "an-bold" : ""}"
                        title="${escapeHtml(total)} (${escapeHtml(String(data.minutes))} min)">
                        ${escapeHtml(total)}
                    </td>
                </tr>
            `;
      }).join("");
    }
    const weekRowsHtml = generateRowsHtml(weekRows, "WEEK", "WEEK");
    const weekTableHtml = buildTable(weekRowsHtml);
    const daySectionsHtml = dayKeys.map((day) => {
      const activities = sortActivitiesDesc(summary.byDay[day]);
      const rowsHtml = generateRowsHtml(activities, "DAY", day);
      const tableHtml = buildTable(rowsHtml);
      return `
            <details class="an-group an-day-group">
                <summary class="an-summary">${escapeHtml(day)}</summary>
                <div class="an-group-content">
                    ${tableHtml}
                </div>
            </details>
        `;
    }).join("");
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
    if (cs.position === "static") {
      container.style.position = "relative";
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
      if (!root.isConnected) {
        container.appendChild(root);
      }
      return root;
    }
    root = document.createElement("div");
    root.id = UI.rootId;
    const btn = document.createElement("button");
    btn.id = UI.toggleId;
    btn.type = "button";
    btn.innerHTML = '<span>Actually NICE</span><span style="opacity:.8">\u25BE</span>';
    const panel = document.createElement("div");
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
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      isOpen = !isOpen;
      panel.classList.toggle("an-open", isOpen);
    });
    document.addEventListener("click", (e) => {
      if (!isOpen) {
        return;
      }
      if (!root.contains(e.target)) {
        isOpen = false;
        panel.classList.remove("an-open");
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
    const body = root.querySelector(".an-panel-body");
    if (body) body.innerHTML = html;
  }
  var isOpen;
  var init_ui = __esm({
    "src/ui.js"() {
      init_config();
      init_utils();
      init_styles();
      isOpen = false;
    }
  });

  // src/app.js
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
  function buildSnapshotKey(summary) {
    const days = sortDaysDesc(summary.byDay);
    const activities = sortActivitiesDesc(summary.byActivity);
    const dayHead = days.slice(0, 5).join("|");
    const actHead = activities.slice(0, 8).map(([name, data]) => `${name}:${data.minutes}`).join("|");
    return `${days.length}/${activities.length}::${dayHead}::${actHead}`;
  }
  function renderFromIframeDoc(iframeDoc, reason) {
    if (!ensureDropdownUi()) {
      return;
    }
    const baseTable = iframeDoc.querySelector(TABLE_SELECTOR);
    if (!baseTable) {
      setMeta((/* @__PURE__ */ new Date()).toLocaleString(), `${reason} (no base table)`);
      setBodyHtml('<div class="an-empty">Base schedule table not found.</div>');
      return;
    }
    const summary = buildSummary(iframeDoc);
    const snapshotKey = buildSnapshotKey(summary);
    if (snapshotKey === STATE.lastSnapshotKey && iframeDoc === STATE.lastDoc) {
      setMeta((/* @__PURE__ */ new Date()).toLocaleString(), `${reason} (no changes)`);
      return;
    }
    STATE.lastSnapshotKey = snapshotKey;
    STATE.lastDoc = iframeDoc;
    setMeta((/* @__PURE__ */ new Date()).toLocaleString(), reason);
    setBodyHtml(buildDropdownTableHtml(summary));
    log("Rendered dropdown summary:", reason);
  }
  async function onIframeLoad() {
    const iframe = getIframe();
    if (!iframe) return;
    STATE.iframe = iframe;
    STATE.iframeDoc = null;
    STATE.lastSnapshotKey = "";
    STATE.lastDoc = null;
    const doc = await waitForIframeReady(iframe);
    if (!doc) {
      setMeta((/* @__PURE__ */ new Date()).toLocaleString(), "iframe load (not ready)");
      setBodyHtml('<div class="an-empty">Schedule not ready yet.</div>');
      return;
    }
    STATE.iframeDoc = doc;
    renderFromIframeDoc(doc, "iframe load");
  }
  function bindIframeLoad(iframe) {
    if (iframe.dataset.anBound === "1") {
      return;
    }
    iframe.dataset.anBound = "1";
    iframe.addEventListener("load", onIframeLoad);
    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
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
          STATE.lastSnapshotKey = "";
          STATE.lastDoc = null;
          renderFromIframeDoc(doc, "doc swap");
          return;
        }
        if (!doc.querySelector(TABLE_SELECTOR)) {
          return;
        }
        renderFromIframeDoc(doc, "watcher");
      } catch (_) {
      }
    }, CHECK_INTERVAL_MS);
  }
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
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
  var STATE;
  var init_app = __esm({
    "src/app.js"() {
      init_config();
      init_utils();
      init_parser();
      init_ui();
      STATE = {
        iframe: null,
        iframeDoc: null,
        lastDoc: null,
        lastSnapshotKey: "",
        tickTimer: null
      };
    }
  });

  // src/index.js
  var require_index = __commonJS({
    "src/index.js"() {
      init_app();
      init();
    }
  });
  require_index();
})();
