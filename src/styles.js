import { UI } from './config.js';

export function ensureStyles() {
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
            content: '▸';
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
