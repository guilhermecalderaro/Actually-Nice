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

(()=>{var b=(t,e)=>()=>(t&&(e=t(t=0)),e);var X=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var R,x,r,w=b(()=>{R="iframe.legacy-wrapper",x="#scheduleDetailTableDiv > table",r={rootId:"an-root",toggleId:"an-toggle",panelId:"an-panel",tableId:"an-summary-table",anchorSelector:"body > app-root > div > main > app-home-page > h1.page-title",containerSelector:"body > app-root > div > main > app-home-page"}});function q(...t){console.log("[Actually NICE]",...t)}function O(t){return new Promise(e=>setTimeout(e,t))}function k(t){let e=new Date(`1970-01-01 ${t}`);return e.getHours()*60+e.getMinutes()}function K(t){let e=Math.floor(t/60),n=t%60;return`${String(e).padStart(2,"0")}:${String(n).padStart(2,"0")}`}function L(t){let[,e]=t.split(" ");return e?new Date(e):new Date}function B(t){let e=L(t),n=new Date;return n.setHours(0,0,0,0),e>n}function S(t){return Object.entries(t).sort((e,n)=>n[1].minutes-e[1].minutes)}function E(t){return Object.keys(t).sort((e,n)=>L(n)-L(e))}function d(t){return String(t).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}var I=b(()=>{});function U(t){let e=t.querySelector(x);if(!e)return{byDay:{},byActivity:{}};let n=Array.from(e.querySelectorAll("tr")).filter(p=>!p.classList.contains("schedTableHdr")),o={},a={},s=null;return n.forEach(p=>{let u=p.querySelectorAll("td, th");if(u.length<7)return;let T=u[1]?.innerText.trim(),l=u[4],y=u[5]?.innerText.trim(),h=u[6]?.innerText.trim();if(T&&(s=T),!s||B(s)||!l||!y||!h)return;let c=l.innerText.trim(),m=l.querySelector("img"),A=m?m.getAttribute("src"):null,g=k(h)-k(y);!Number.isFinite(g)||g<=0||(o[s]=o[s]||{},o[s][c]=o[s][c]||{minutes:0,imgSrc:A},o[s][c].minutes+=g,a[c]=a[c]||{minutes:0,imgSrc:A},a[c].minutes+=g)}),{byDay:o,byActivity:a}}var F=b(()=>{w();I()});function j(){let t="an-styles";if(document.getElementById(t))return;let e=document.createElement("style");e.id=t,e.textContent=`
        /* Container anchored to app-home-page (relative) */
        #${r.rootId} {
            position: absolute;
            bottom: 10px;
            right: 30px;
            display: inline-flex;
            align-items: center;
            z-index: 2147483646;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        #${r.toggleId} {
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

        #${r.toggleId}:hover {
            background: rgba(255, 255, 255, 0.98);
        }

        #${r.panelId} {
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

        #${r.panelId}.an-open {
            display: block;
        }

        #${r.panelId} .an-panel-header {
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

        #${r.panelId} .an-title {
            font-size: 13px;
            font-weight: 600;
            margin: 0;
        }

        #${r.panelId} .an-meta {
            font-size: 11px;
            color: #555;
            display: inline-flex;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        #${r.panelId} .an-panel-body {
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
    `,document.head.appendChild(e)}var z=b(()=>{w()});function W(t){let e=S(t.byActivity),n=E(t.byDay);function o(l){return`
            <table class="an-table">
                <thead>
                    <tr class="an-hdr">
                        <th class="an-th">Activity</th>
                        <th class="an-th an-center" style="width: 80px;">Total</th>
                    </tr>
                </thead>
                <tbody>${l}</tbody>
            </table>
        `}let a=!1;function s(l,y,h){return a=!1,l.map(([c,m],A)=>{a=!a;let g=m.imgSrc?`
                <img src="${d(m.imgSrc)}" alt="" class="an-ico">
            `:"",_=K(m.minutes),Q=y==="WEEK";return`
                <tr class="${a?"an-row an-striped":"an-row"}">
                    <td class="an-td" title="${d(c)}">
                        <span class="an-activity">
                            ${g}
                            <span class="an-activity-text">${d(c)}</span>
                        </span>
                    </td>
                    <td class="an-td an-center ${Q?"an-bold":""}"
                        title="${d(_)} (${d(String(m.minutes))} min)">
                        ${d(_)}
                    </td>
                </tr>
            `}).join("")}let p=s(e,"WEEK","WEEK"),u=o(p),T=n.map(l=>{let y=S(t.byDay[l]),h=s(y,"DAY",l),c=o(h);return`
            <details class="an-group an-day-group">
                <summary class="an-summary">${d(l)}</summary>
                <div class="an-group-content">
                    ${c}
                </div>
            </details>
        `}).join("");return`
        <details class="an-group an-week-group" open>
            <summary class="an-summary">Week Overview</summary>
            <div class="an-group-content">
                ${u}
                <div class="an-days-container">
                    ${T}
                </div>
            </div>
        </details>
    `}function Z(){let t=document.querySelector(r.containerSelector),e=document.querySelector(r.anchorSelector);return!t||!e?null:(window.getComputedStyle(t).position==="static"&&(t.style.position="relative"),t)}function f(){j();let t=Z();if(!t)return null;let e=document.getElementById(r.rootId);if(e)return e.isConnected||t.appendChild(e),e;e=document.createElement("div"),e.id=r.rootId;let n=document.createElement("button");n.id=r.toggleId,n.type="button",n.innerHTML='<span>Actually NICE</span><span style="opacity:.8">\u25BE</span>';let o=document.createElement("div");return o.id=r.panelId,o.innerHTML=`
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
    `,n.addEventListener("click",a=>{a.preventDefault(),a.stopPropagation(),v=!v,o.classList.toggle("an-open",v)}),document.addEventListener("click",a=>{v&&(e.contains(a.target)||(v=!1,o.classList.remove("an-open")))}),e.appendChild(n),e.appendChild(o),t.appendChild(e),e}function D(t,e){let n=f();if(!n)return;let o=n.querySelector('[data-an-meta="updated"]'),a=n.querySelector('[data-an-meta="source"]');o&&(o.textContent=`Updated: ${t}`),a&&(a.textContent=`Source: ${e}`)}function $(t){let e=f();if(!e)return;let n=e.querySelector(".an-panel-body");n&&(n.innerHTML=t)}var v,N=b(()=>{w();I();z();v=!1});function M(){return document.querySelector(R)}function V(t){try{return t.contentDocument||t.contentWindow.document}catch{return null}}async function ot(t){let e=Date.now();for(;Date.now()-e<=15e3;){let n=V(t);if(n&&n.body&&n.querySelector(x))return n;await O(250)}return null}function at(t){let e=E(t.byDay),n=S(t.byActivity),o=e.slice(0,5).join("|"),a=n.slice(0,8).map(([s,p])=>`${s}:${p.minutes}`).join("|");return`${e.length}/${n.length}::${o}::${a}`}function H(t,e){if(!f())return;if(!t.querySelector(x)){D(new Date().toLocaleString(),`${e} (no base table)`),$('<div class="an-empty">Base schedule table not found.</div>');return}let o=U(t),a=at(o);if(a===i.lastSnapshotKey&&t===i.lastDoc){D(new Date().toLocaleString(),`${e} (no changes)`);return}i.lastSnapshotKey=a,i.lastDoc=t,D(new Date().toLocaleString(),e),$(W(o)),q("Rendered dropdown summary:",e)}async function P(){let t=M();if(!t)return;i.iframe=t,i.iframeDoc=null,i.lastSnapshotKey="",i.lastDoc=null;let e=await ot(t);if(!e){D(new Date().toLocaleString(),"iframe load (not ready)"),$('<div class="an-empty">Schedule not ready yet.</div>');return}i.iframeDoc=e,H(e,"iframe load")}function rt(t){t.dataset.anBound!=="1"&&(t.dataset.anBound="1",t.addEventListener("load",P),t.contentDocument&&t.contentDocument.readyState==="complete"&&P())}function C(){let t=M();t&&rt(t)}function Y(){i.tickTimer&&clearInterval(i.tickTimer),i.tickTimer=setInterval(()=>{try{f(),C();let t=i.iframe||M();if(!t)return;let e=V(t);if(!e||!e.body)return;if(e!==i.iframeDoc){i.iframeDoc=e,i.lastSnapshotKey="",i.lastDoc=null,H(e,"doc swap");return}if(!e.querySelector(x))return;H(e,"watcher")}catch{}},5e3)}function G(){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>{f(),C(),Y()});return}f(),C(),Y()}var i,J=b(()=>{w();I();F();N();i={iframe:null,iframeDoc:null,lastDoc:null,lastSnapshotKey:"",tickTimer:null}});var it=X(()=>{J();G()});it();})();
