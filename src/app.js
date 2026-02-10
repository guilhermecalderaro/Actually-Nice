import { 
    IFRAME_SELECTOR, 
    TABLE_SELECTOR, 
    CHECK_INTERVAL_MS, 
    READY_TIMEOUT_MS, 
    READY_POLL_MS 
} from './config.js';
import { log, sleep, sortDaysDesc, sortActivitiesDesc } from './utils.js';
import { buildSummary } from './parser.js';
import { 
    ensureDropdownUi, 
    setMeta, 
    setBodyHtml, 
    buildDropdownTableHtml 
} from './ui.js';

const STATE = {
    iframe: null,
    iframeDoc: null,
    lastDoc: null,
    lastSnapshotKey: '',
    tickTimer: null
};

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

    const dayHead = days.slice(0, 5).join('|');
    const actHead = activities.slice(0, 8)
        .map(([name, data]) => `${name}:${data.minutes}`)
        .join('|');

    return `${days.length}/${activities.length}::${dayHead}::${actHead}`;
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

export function init() {
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
