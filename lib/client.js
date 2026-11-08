window.__ModuleLoader__.load({
	id: "dsh-session-gallery",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/ui/styles.ts
var PANEL_CSS = `
.dshsg-root {
  position: relative; /* \u4F9B\u300C\u4FA7\u8FB9\u680F\u5185\u5D4C\u5927\u56FE\u300Dabsolute \u5B9A\u4F4D */
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary, #e6e6e6);
  background: transparent;
  font-size: 12px;
}
/* \u9519\u8BEF\u8FB9\u754C\uFF1A\u9762\u677F\u6E32\u67D3\u629B\u9519\u65F6\u663E\u793A\uFF0C\u522B\u518D\u767D\u5C4F */
.dshsg-crash {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  color: var(--dsw-alias-label-primary, #e6e6e6);
  font-size: 12px;
}
.dshsg-crash-title {
  font-weight: 600;
  color: #ef7f74;
}
.dshsg-crash-msg {
  color: #ef7f74;
  word-break: break-word;
}
.dshsg-crash-stack {
  margin: 0;
  padding: 8px;
  overflow: auto;
  max-height: 220px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--dsw-alias-label-secondary, #9a9a9a);
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.dshsg-crash-hint {
  color: var(--dsw-alias-label-secondary, #9a9a9a);
  line-height: 1.6;
}

/* ---------- \u4FA7\u8FB9\u680F\u5185\u5D4C\u5927\u56FE\uFF08\u9F20\u6807\u4E2D\u952E\u5F00\u5173\uFF09 ---------- */
.dshsg-pane {
  position: absolute;
  inset: 0;
  z-index: 2147482000;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(12, 14, 18, .97);
}
.dshsg-pane-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  flex: 0 0 auto;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.dshsg-pane-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  opacity: .85;
}
.dshsg-pane-stage {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
}
.dshsg-pane-stage:has(img[data-dragging="true"]) {
  cursor: grabbing;
}
.dshsg-pane img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
}
.dshsg-pane-hint {
  flex: 0 0 auto;
  padding: 5px 8px;
  font-size: 11px;
  opacity: .55;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,.08);
}

/* ---------- \u9876\u90E8\u5B50\u6807\u7B7E ---------- */
.dshsg-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px 6px;
  flex: 0 0 auto;
}
.dshsg-tab {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #9a9a9a);
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
}
.dshsg-tab:hover { background: var(--dsw-alias-bg-hover, rgba(255,255,255,.06)); }
.dshsg-tab[data-active="true"] {
  color: var(--dsw-alias-label-primary, #fff);
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.1));
  font-weight: 600;
}
.dshsg-count {
  margin-left: auto;
  color: var(--dsw-alias-label-tertiary, #7a7a7a);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

/* ---------- \u6765\u6E90\u5207\u6362\uFF08\u4F1A\u8BDD\u56FE\u7247 / \u56FE\u7247\u5E93\uFF09 ---------- */
.dshsg-sourcebar {
  display: flex;
  gap: 4px;
  padding: 0 10px 8px;
  flex: 0 0 auto;
}
.dshsg-source {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-weak, rgba(255,255,255,.12));
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8a8a8a);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
}
.dshsg-source[data-active="true"] {
  color: var(--dsw-alias-label-primary, #fff);
  border-color: var(--dsw-alias-accent, #5b8cff);
  background: var(--dsw-alias-bg-layer-2, rgba(91,140,255,.16));
}
.dshsg-select,
.dshsg-search {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-weak, rgba(255,255,255,.12));
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.04));
  color: var(--dsw-alias-label-primary, #ddd);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  min-width: 0;
}
.dshsg-search { flex: 1 1 auto; }
.dshsg-lib-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #777);
  word-break: break-all;
}
.dshsg-lib {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
/* ---------- \u67E5\u770B\u5668\u5DE6\u53F3\u6D6E\u6761\uFF08\u9F20\u6807\u79FB\u5F00\u6DE1\u51FA\uFF0C\u6587\u5B57\u53EF\u62D6\u9009\u590D\u5236\uFF09 ---------- */
.dshsg-lb-rail {
  position: absolute;
  /* \u8BA9\u5F00\u300C\u684C\u9762\u7248\u6807\u9898\u680F\u300D(--dshsg-titlebar) + \u9876\u90E8\u6761 */
  top: calc(var(--dshsg-titlebar, 38px) + 60px);
  bottom: 58px;
  width: min(238px, 20vw);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(18, 18, 18, .78);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, .1);
  color: #e8e8e8;
  overflow: auto;
  scrollbar-width: thin;
  /* \u9ED8\u8BA4\u534A\u900F\u660E\uFF0C\u9F20\u6807\u79FB\u4E0A\u6765\u624D\u5B9E\u5FC3 \u2014\u2014 \u4E0D\u6321\u56FE */
  opacity: .32;
  transition: opacity .18s ease;
  z-index: 3;
  /* \u5916\u5C42 lightbox \u662F user-select: none\uFF0C\u6D6E\u6761\u5FC5\u987B\u653E\u5F00\uFF0C\u624D\u80FD\u62D6\u9009\u590D\u5236 */
  user-select: text;
}
.dshsg-lb-rail:hover { opacity: 1; }
.dshsg-lb-rail[data-side="left"] { left: 14px; }
.dshsg-lb-rail[data-side="right"] { right: 14px; }
.dshsg-lb-rail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: .04em;
  color: #8f8f8f;
}
.dshsg-lb-rail-head > span { margin-right: auto; }
.dshsg-lb-rail-copy {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .2);
  background: rgba(255, 255, 255, .08);
  color: #e8e8e8;
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 11px;
  cursor: pointer;
}
.dshsg-lb-rail-copy:hover { background: rgba(255, 255, 255, .18); }
.dshsg-lb-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dshsg-lb-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  line-height: 1.5;
}
.dshsg-lb-row > i {
  flex: 0 0 auto;
  min-width: 48px;
  font-style: normal;
  color: #8f8f8f;
}
.dshsg-lb-row > b {
  flex: 1 1 auto;
  font-weight: 600;
  color: #f2f2f2;
  word-break: break-word;
}
.dshsg-lb-row-empty { color: #777; }
.dshsg-lb-rail-prompt {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;
}
.dshsg-lb-rail-prompt-body {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .07);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 34vh;
  overflow: auto;
}
.dshsg-lb-rail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}
.dshsg-lb-rail-actions button {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .07);
  color: #f0f0f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 12.5px;
  cursor: pointer;
}
.dshsg-lb-rail-actions button:hover { background: rgba(255, 255, 255, .16); }
.dshsg-lb-rail-actions button[data-tone="primary"] {
  background: var(--dsw-alias-accent, #5b8cff);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
.dshsg-lb-rail-actions button[data-tone="danger"] {
  color: #ff9b9b;
  border-color: rgba(255, 120, 120, .4);
}

/* ---------- \u5DE5\u5177\u6761 ---------- */
.dshsg-toolbar {
  display: flex;
  align-items: center;
  /* \u5143\u7D20\u591A\u4E86\u8981\u80FD\u6362\u884C\uFF1A\u5206\u7EC4 + \u65F6\u95F4 + \u641C\u7D22 + \u4E00\u6392\u6309\u94AE\uFF0C\u7A84\u4FA7\u680F\u653E\u4E0D\u4E0B */
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 10px 8px;
  flex: 0 0 auto;
}
.dshsg-chip {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-weak, rgba(255,255,255,.12));
  background: transparent;
  color: var(--dsw-alias-label-secondary, #b0b0b0);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  line-height: 1.2;
}
.dshsg-chip:hover { background: var(--dsw-alias-bg-hover, rgba(255,255,255,.06)); }

/* \u6765\u6E90\u7B5B\u9009\uFF1A\u591A\u9009\u6807\u7B7E\u884C\uFF08\u539F\u5148\u662F\u5355\u9009\u4E0B\u62C9\uFF0C2026-11-05 \u6539\u591A\u9009\uFF09 */
.dshsg-origin-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 0 10px 8px;
  flex: 0 0 auto;
}
.dshsg-origin-bar-label {
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #7a7a7a);
  margin-right: 2px;
}
/* \u7F29\u7565\u56FE\u5927\u5C0F\u6ED1\u5757 */
.dshsg-zoom {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, #7a7a7a);
}
.dshsg-zoom input[type="range"] {
  width: 64px;
  height: 14px;
  accent-color: var(--dsw-alias-accent, #5b8cff);
  cursor: pointer;
}
.dshsg-chip[data-on="true"] {
  border-color: var(--dsw-alias-accent, #5b8cff);
  color: var(--dsw-alias-accent, #7aa2ff);
}

/* ---------- \u56FE\u5E93\u7F51\u683C ---------- */
.dshsg-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 10px 12px;
}
.dshsg-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.dshsg-card {
  position: relative;
  appearance: none;
  border: 1px solid var(--dsw-alias-border-weak, rgba(255,255,255,.1));
  border-radius: 10px;
  padding: 0;
  overflow: hidden;
  background: var(--dsw-alias-bg-layer-2, #1b1b1b);
  cursor: zoom-in;
  aspect-ratio: 1 / 1;
}
.dshsg-card:hover { border-color: var(--dsw-alias-accent, #5b8cff); }
.dshsg-card[data-selected="true"] {
  border-color: var(--dsw-alias-accent, #5b8cff);
  box-shadow: 0 0 0 2px rgba(91, 140, 255, .35);
}

/* \u5DE6\u4E0A\u89D2\u52FE\u9009 */
.dshsg-check {
  position: absolute;
  left: 6px;
  top: 6px;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, .65);
  background: rgba(0, 0, 0, .45);
  color: #fff;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  cursor: pointer;
  backdrop-filter: blur(2px);
}
.dshsg-check[data-checked="true"] {
  background: var(--dsw-alias-accent, #5b8cff);
  border-color: var(--dsw-alias-accent, #5b8cff);
}

/* \u52FE\u9009\u540E\u7684\u64CD\u4F5C\u6761 */
.dshsg-actionbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  margin: 0 10px 8px;
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2, rgba(91, 140, 255, .12));
  border: 1px solid var(--dsw-alias-border-weak, rgba(91, 140, 255, .3));
  flex-wrap: wrap;
  flex: 0 0 auto;
}
.dshsg-actionbar-count {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #bbb);
  margin-right: 2px;
}
.dshsg-action {
  appearance: none;
  border: 1px solid var(--dsw-alias-accent, #5b8cff);
  background: var(--dsw-alias-accent, #5b8cff);
  color: #fff;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  line-height: 1.4;
}
.dshsg-action:disabled { opacity: .5; cursor: default; }
.dshsg-action-danger {
  background: #c0392b;
  border-color: #c0392b;
  color: #fff;
}
.dshsg-action-danger:hover { background: #d14534; }

/* ---------- \u5220\u9664\u786E\u8BA4\u5C42 ---------- */
.dshsg-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483200;
  background: rgba(0, 0, 0, .6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.dshsg-confirm {
  width: min(420px, 100%);
  background: #1c1c1c;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 14px;
  padding: 18px 18px 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, .5);
  color: #eaeaea;
}
.dshsg-confirm-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}
.dshsg-confirm-list {
  margin: 0 0 10px;
  padding-left: 18px;
  max-height: 120px;
  overflow: auto;
  font-size: 11px;
  color: #b9b9b9;
  line-height: 1.7;
}
.dshsg-confirm-list li { word-break: break-all; }
.dshsg-confirm-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #e6e6e6;
  cursor: pointer;
  margin-bottom: 6px;
}
.dshsg-confirm-check input { accent-color: #c0392b; }

/* ---------- \u672A\u5F52\u6863\u533A\uFF08\u53EA\u5728\u5BF9\u8BDD\u91CC\u53EF\u89C1\u3001\u672A\u5165\u56FE\u7247\u5E93\u7684\u56FE\uFF09 ---------- */
.dshsg-pending {
  flex: 0 0 auto;
  border: 1px dashed var(--dsw-alias-border-weak, rgba(255, 255, 255, .2));
  border-radius: 10px;
  padding: 8px 10px 10px;
  margin-bottom: 10px;
}
.dshsg-pending-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.dshsg-pending-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #9aa0ad);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshsg-pending-list {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.dshsg-pending-thumb {
  position: relative;
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, .06);
  cursor: pointer;
}
.dshsg-pending-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dshsg-pending-thumb[data-selected="true"] {
  border-color: var(--dsw-alias-accent, #5b8cff);
}
.dshsg-pending-check {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--dsw-alias-accent, #5b8cff);
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
}


/* ---------- \u8BBE\u7F6E\u9875\uFF08\u4FA7\u680F\u5185\u8054\uFF0C\u4E0D\u662F\u6D6E\u7A97\uFF09 ---------- */
.dshsg-settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #eaeaea;
}
.dshsg-settings-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 10px;
  border-bottom: 1px solid var(--dsw-alias-border-weak, rgba(255, 255, 255, .1));
}
.dshsg-settings-back {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-weak, rgba(255, 255, 255, .16));
  background: transparent;
  color: #ddd;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.dshsg-settings-back:hover { background: rgba(255, 255, 255, .08); }
.dshsg-settings-title {
  font-size: 13px;
  font-weight: 600;
}
.dshsg-settings-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 12px 12px;
}
.dshsg-settings-actions {
  flex: 0 0 auto;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--dsw-alias-border-weak, rgba(255, 255, 255, .1));
}
.dshsg-settings-section {
  margin: 26px 0 12px;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,.06);
  border-left: 3px solid rgba(122, 170, 255, .55);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .03em;
}
.dshsg-settings-section:first-of-type {
  margin-top: 6px;
}
.dshsg-gen-models {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 260px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 8px;
  background: rgba(255,255,255,.02);
}
.dshsg-gen-model {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-radius: 6px;
}
.dshsg-gen-model:hover { background: rgba(255,255,255,.05); }
.dshsg-gen-model-id {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11.5px;
}
.dshsg-gen-model-note {
  flex: 0 0 136px;
  padding: 3px 6px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(0,0,0,.25);
  color: inherit;
  font-size: 11px;
}
.dshsg-settings-label {
  display: block;
  margin: 14px 0 6px;
  font-size: 12px;
  color: #cfcfcf;
  font-weight: 600;
}
.dshsg-settings-input {
  width: 100%;
  box-sizing: border-box;
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .16);
  background: #141414;
  color: #eee;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-family: inherit;
}
.dshsg-settings-textarea {
  resize: vertical;
  min-height: 60px;
  line-height: 1.6;
}
.dshsg-settings-hint {
  margin-top: 6px;
  font-size: 11px;
  color: #8f8f8f;
  line-height: 1.75;
}
.dshsg-settings-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 12px;
  color: #e6e6e6;
  cursor: pointer;
}
.dshsg-settings-check input { accent-color: var(--dsw-alias-accent, #5b8cff); }
.dshsg-confirm-hint {
  font-size: 11px;
  color: #8f8f8f;
  line-height: 1.7;
  margin-bottom: 14px;
}
.dshsg-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.dshsg-action-ghost {
  background: transparent;
  color: var(--dsw-alias-label-secondary, #bbb);
  border-color: var(--dsw-alias-border-weak, rgba(255, 255, 255, .2));
}
.dshsg-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dshsg-card-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--dsw-alias-label-tertiary, #666);
  font-size: 11px;
}
.dshsg-badge {
  position: absolute;
  left: 6px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.3;
  color: #fff;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(4px);
  max-width: calc(100% - 12px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshsg-empty {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--dsw-alias-label-tertiary, #777);
  text-align: center;
  line-height: 1.7;
}
.dshsg-empty strong { color: var(--dsw-alias-label-secondary, #aaa); font-weight: 600; }

/* ---------- \u6D6E\u7A97\uFF08\u706F\u7BB1\uFF09 ---------- */
.dshsg-lightbox {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  background: rgba(0,0,0,.82);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  user-select: none;
  /* \u684C\u9762\u7248\u628A\u300C\u6700\u5C0F\u5316/\u6700\u5927\u5316/\u5173\u95ED\u300D\u6D6E\u5728\u9875\u9762\u6700\u4E0A\u5C42\uFF0C\u4F1A\u538B\u4F4F\u9876\u90E8\u6761\u3002
     \u8FD9\u91CC\u7ED9\u6807\u9898\u680F\u8BA9\u51FA\u9AD8\u5EA6\uFF1B\u5B9E\u9645\u503C\u7531\u7EC4\u4EF6\u7528 windowControlsOverlay \u63A2\u6D4B\u540E\u8986\u76D6\u3002 */
  --dshsg-titlebar: 38px;
  padding-top: var(--dshsg-titlebar);
}
.dshsg-lb-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  cursor: grab;
}
.dshsg-lb-stage[data-dragging="true"] { cursor: grabbing; }
/* \u9876\u90E8\u6761\uFF1A\u4E0A\u4E00\u5F20 / \u6587\u4EF6\u540D / \u8BA1\u6570 / \u4E0B\u4E00\u5F20 / \u5173\u95ED\uFF08\u6574\u7A97\u552F\u4E00\u7684\u5173\u95ED\u6309\u94AE\uFF09
   \u53F3\u4FA7\u7559\u51FA\u7A97\u53E3\u63A7\u5236\u6309\u94AE\uFF08\u6700\u5C0F\u5316/\u6700\u5927\u5316/\u5173\u95ED\uFF09\u7684\u5BBD\u5EA6\uFF0C\u907F\u514D\u4E92\u76F8\u906E\u6321 */
.dshsg-lb-top {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 170px 10px 16px;
  background: #141414;
  border-bottom: 1px solid rgba(255, 255, 255, .14);
  position: relative;
  z-index: 5;
}
.dshsg-lb-title {
  flex: 1 1 auto;
  min-width: 0;
  color: #f0f0f0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshsg-lb-count {
  flex: 0 0 auto;
  color: #9a9a9a;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.dshsg-lb-nav-group {
  flex: 0 0 auto;
  display: flex;
  gap: 0;
}
.dshsg-lb-nav-group .dshsg-lb-nav-inline:first-child {
  border-radius: 7px 0 0 7px;
}
.dshsg-lb-nav-group .dshsg-lb-nav-inline:last-child {
  border-radius: 0 7px 7px 0;
  margin-left: -1px; /* \u4E24\u6761\u8FB9\u6846\u91CD\u53E0\u6210\u4E00\u6761 */
}
.dshsg-lb-nav-inline {
  flex: 0 0 auto;
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .18);
  background: rgba(255, 255, 255, .06);
  color: #fff;
  border-radius: 7px;
  width: 28px;
  height: 28px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.dshsg-lb-nav-inline:hover:not(:disabled) { background: rgba(255, 255, 255, .18); }
.dshsg-lb-nav-inline:disabled { opacity: .25; cursor: default; }
.dshsg-lb-close-button {
  flex: 0 0 auto;
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .08);
  color: #fff;
  border-radius: 7px;
  width: 28px;
  height: 28px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.dshsg-lb-close-button:hover { background: rgba(255, 255, 255, .22); }

/* ---------- \u706F\u7BB1\uFF1A\u5BF9\u6BD4\u5165\u53E3\u4E0E\u6311\u56FE\u6761\uFF082026-11-08\uFF09 ---------- */
.dshsg-lb-compare {
  flex: 0 0 auto;
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .18);
  background: rgba(255, 255, 255, .06);
  color: #fff;
  border-radius: 7px;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.dshsg-lb-compare:hover { background: rgba(255, 255, 255, .18); }
.dshsg-lb-compare[data-on="true"] {
  background: var(--dsw-alias-accent, #5b8cff);
  border-color: transparent;
  font-weight: 600;
}
.dshsg-lb-pick {
  flex: 0 0 auto;
  max-height: 34vh;
  display: flex;
  flex-direction: column;
  background: #141414;
  border-top: 1px solid rgba(255, 255, 255, .14);
  z-index: 6;
}
.dshsg-lb-pick-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  color: #cfcfcf;
  font-size: 12px;
}
.dshsg-lb-pick-cancel {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .18);
  background: transparent;
  color: #fff;
  border-radius: 7px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
}
.dshsg-lb-pick-cancel:hover { background: rgba(255, 255, 255, .14); }
.dshsg-lb-pick-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 12px;
}
.dshsg-lb-pick-item {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .14);
  background: rgba(255, 255, 255, .04);
  border-radius: 8px;
  padding: 0;
  width: 104px;
  height: 104px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dshsg-lb-pick-item:hover { border-color: var(--dsw-alias-accent, #5b8cff); }
.dshsg-lb-pick-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
.dshsg-lb-pick-ph { color: #666; font-size: 16px; }
.dshsg-lb-pick-name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2px 6px;
  font-size: 10px;
  color: #ddd;
  background: linear-gradient(transparent, rgba(0, 0, 0, .75));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshsg-lb-pick-empty { color: #888; font-size: 12px; padding: 8px 0; }

/* ---------- \u5E76\u6392\u5BF9\u6BD4\u89C6\u56FE ---------- */
.dshsg-cmp-mask {
  position: fixed;
  inset: 0;
  z-index: 2147483100; /* \u76D6\u5728\u706F\u7BB1\u4E4B\u4E0A */
  background: rgba(0, 0, 0, .9);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  padding-top: 38px; /* \u8BA9\u5F00\u7A97\u53E3\u63A7\u5236\u6309\u94AE */
  user-select: none;
}
.dshsg-cmp {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.dshsg-cmp-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  color: #f0f0f0;
  font-size: 12px;
}
.dshsg-cmp-close {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .08);
  color: #fff;
  border-radius: 7px;
  width: 28px;
  height: 28px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
.dshsg-cmp-close:hover { background: rgba(255, 255, 255, .22); }
/* \u540C\u6B65\u7F29\u653E\u63A7\u4EF6\uFF082026-11-08\uFF09\uFF1A\u6EDA\u8F6E\u4E5F\u80FD\u7528\uFF0C\u8FD9\u91CC\u7ED9\u4E0D\u60F3\u6EDA\u7684\u4EBA */
.dshsg-cmp-zoom {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  margin-right: 12px;
}
.dshsg-cmp-zoom button {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, .18);
  background: rgba(255, 255, 255, .06);
  color: #fff;
  border-radius: 7px;
  height: 24px;
  min-width: 26px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.dshsg-cmp-zoom button:hover { background: rgba(255, 255, 255, .18); }
.dshsg-cmp-pct {
  color: #cfcfcf;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  min-width: 42px;
  text-align: center;
}
.dshsg-cmp-stage {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: 10px;
  padding: 0 16px 10px;
}
.dshsg-cmp-cell {
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* Pointer \u62D6\u62FD\uFF1A\u4E0D\u8BBE\u8FD9\u4E2A\u7684\u8BDD\u6D4F\u89C8\u5668\u4F1A\u628A\u624B\u52BF\u5224\u6210\u9875\u9762\u6EDA\u52A8 / \u957F\u6309\u9009\u62E9 */
  touch-action: none;
}
.dshsg-cmp-stage[data-dragging="true"],
.dshsg-cmp-stage[data-dragging="true"] .dshsg-cmp-cell { cursor: grabbing; }
.dshsg-cmp-frame {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, .03);
  border-radius: 8px;
  overflow: hidden;
}
.dshsg-cmp-frame img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}
.dshsg-cmp-loading { color: #777; font-size: 12px; }
.dshsg-cmp-cap {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #b9b9b9;
  font-size: 11px;
}
.dshsg-cmp-name {
  color: #7d7d7d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dshsg-cmp-table-wrap {
  flex: 0 0 auto;
  max-height: 32vh;
  overflow: auto;
  padding: 0 16px 14px;
}
.dshsg-cmp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.dshsg-cmp-table th {
  text-align: left;
  font-weight: 500;
  color: #8f8f8f;
  padding: 4px 12px 4px 0;
  white-space: nowrap;
  width: 72px;
}
.dshsg-cmp-table td {
  color: #e6e6e6;
  padding: 4px 12px 4px 0;
  font-variant-numeric: tabular-nums;
  word-break: break-all;
}
.dshsg-cmp-table tr + tr th,
.dshsg-cmp-table tr + tr td { border-top: 1px solid rgba(255, 255, 255, .06); }
.dshsg-lb-img {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  max-width: none;
  max-height: none;
  will-change: transform;
  pointer-events: none;
}
.dshsg-lb-zoom {
  position: absolute;
  right: 16px;
  bottom: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(0,0,0,.45);
}
.dshsg-lb-zoom button {
  appearance: none;
  border: 0;
  background: rgba(255,255,255,.1);
  color: #fff;
  border-radius: 6px;
  min-width: 28px;
  height: 26px;
  padding: 0 8px;
  font-size: 12px;
  cursor: pointer;
}
.dshsg-lb-zoom button:hover { background: rgba(255,255,255,.22); }
.dshsg-lb-zoom span {
  color: #ddd;
  font-size: 11px;
  min-width: 44px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* ---------- \u5DE5\u4F5C\u53F0\u753B\u5E03 ---------- */
.dshsg-workbench {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 24px 18px;
  color: var(--dsw-alias-label-tertiary, #888);
  text-align: center;
  line-height: 1.8;
}
.dshsg-wb {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.dshsg-wb-bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-divider, rgba(255, 255, 255, .08));
}
.dshsg-wb-tools,
.dshsg-wb-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dshsg-wb-actions { margin-left: auto; }
.dshsg-wb-bar button {
  appearance: none;
  border: 1px solid var(--dsw-alias-border, rgba(255, 255, 255, .14));
  background: transparent;
  color: var(--dsw-alias-label-secondary, #c9c9c9);
  border-radius: 7px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.dshsg-wb-bar button:hover:not(:disabled) { background: var(--dsw-alias-bg-elevated, rgba(255, 255, 255, .08)); }
.dshsg-wb-bar button:disabled { opacity: .4; cursor: default; }
.dshsg-wb-bar button[data-active="true"] {
  background: var(--dsw-alias-accent, #5b8cff);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
.dshsg-wb-bar button[data-tone="primary"] {
  background: var(--dsw-alias-accent, #5b8cff);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
.dshsg-wb-hint {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8a);
  font-variant-numeric: tabular-nums;
}
.dshsg-wb-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(0deg, rgba(255, 255, 255, .02), rgba(255, 255, 255, .02)),
    repeating-linear-gradient(0deg, transparent 0 23px, rgba(255, 255, 255, .045) 23px 24px),
    repeating-linear-gradient(90deg, transparent 0 23px, rgba(255, 255, 255, .045) 23px 24px);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.dshsg-wb-stage[data-tool="pan"] { cursor: grab; }
.dshsg-wb-stage[data-tool="pan"]:active { cursor: grabbing; }
.dshsg-wb-stage[data-tool="rect"] { cursor: crosshair; }
.dshsg-wb-stage[data-tool="pen"] { cursor: crosshair; }
.dshsg-wb-world {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}
.dshsg-wb-image {
  position: absolute;
  box-shadow: 0 2px 14px rgba(0, 0, 0, .35);
}
.dshsg-wb-image[data-selected="true"] {
  outline: 2px solid var(--dsw-alias-accent, #5b8cff);
  outline-offset: 1px;
}
/* \u9009\u4E2D\u67D0\u5F20\u56FE\u540E\u51FA\u73B0\u7684\u5BF9\u6BD4\u63A7\u5236\u6761 */
.dshsg-wb-selbar {
  border-top: 1px solid var(--dsw-alias-divider, rgba(255, 255, 255, .08));
  border-bottom: 1px solid var(--dsw-alias-divider, rgba(255, 255, 255, .08));
  background: rgba(91, 140, 255, .08);
}
.dshsg-wb-opacity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, #c9c9c9);
}
.dshsg-wb-opacity input[type="range"] {
  width: 120px;
  accent-color: var(--dsw-alias-accent, #5b8cff);
}
.dshsg-wb-opacity b {
  min-width: 34px;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-primary, #fff);
}
.dshsg-wb-image img {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  pointer-events: none;
  /* Chromium \u7684\u539F\u751F\u56FE\u7247\u62D6\u62FD\u5FC5\u987B\u4E24\u5C42\u90FD\u7981\uFF1Adraggable=false + \u8FD9\u91CC\uFF0C
     \u5426\u5219\u4F1A\u62D6\u51FA\u4E00\u4E2A\u534A\u900F\u660E ghost \u5E76\u62A2\u8D70 pointermove */
  -webkit-user-drag: none;
  -webkit-user-select: none;
}
.dshsg-wb-remove {
  position: absolute;
  right: -10px;
  top: -10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 0;
  background: rgba(0, 0, 0, .72);
  color: #fff;
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity .15s ease;
}
.dshsg-wb-image:hover .dshsg-wb-remove { opacity: 1; }
.dshsg-wb-ink {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}
.dshsg-wb-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  color: var(--dsw-alias-label-tertiary, #8a8a8a);
  text-align: center;
  line-height: 1.9;
  font-size: 12.5px;
}
.dshsg-wb-empty strong { color: var(--dsw-alias-label-secondary, #b9b9b9); font-size: 14px; }
.dshsg-toast {
  position: fixed;
  left: 50%;
  bottom: 40px;
  transform: translateX(-50%);
  z-index: 2147483600;
  background: rgba(30,30,30,.95);
  color: #fff;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 12px;
  pointer-events: none;
}

/* \u7F29\u7565\u56FE\u53F3\u952E\u83DC\u5355\uFF1A\u6BD4\u5927\u56FE\u4F4E\u4E00\u5C42\u3001\u6BD4\u666E\u901A\u5185\u5BB9\u9AD8\u5F97\u591A */
.dshsg-ctx {
  position: fixed;
  z-index: 2147483300;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 10px;
  background: rgba(34, 37, 43, .98);
  border: 1px solid rgba(255,255,255,.14);
  box-shadow: 0 14px 34px rgba(0,0,0,.5);
  user-select: none;
}
.dshsg-ctx-item {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: rgba(255,255,255,.9);
  font: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
}
.dshsg-ctx-item:hover { background: rgba(255,255,255,.09); }
.dshsg-ctx-item[data-tone="danger"] { color: #ef7f74; }
.dshsg-ctx-item[data-tone="danger"]:hover { background: rgba(239,127,116,.14); }
/* ---------- \u51FA\u56FE\u65E5\u5FD7\u9762\u677F ---------- */
.dshsg-genlog {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
}
.dshsg-genlog-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 2px 0 4px;
}
.dshsg-genlog-title { font-size: 13px; font-weight: 600; }
.dshsg-genlog-stats {
  margin-left: auto;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8a8a8a);
}
.dshsg-genlog-filter {
  display: flex;
  gap: 6px;
  align-items: center;
  flex: 0 0 auto;
}
.dshsg-genlog-body {
  display: flex;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
}
.dshsg-genlog-list {
  flex: 0 0 46%;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dshsg-genlog-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  text-align: left;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--dsw-alias-bg-layer-2, rgba(255,255,255,.04));
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.dshsg-genlog-row:hover { background: rgba(255,255,255,.08); }
.dshsg-genlog-row[data-active="true"] {
  border-color: var(--dsw-alias-accent, #5b8cff);
}
.dshsg-genlog-icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 700;
}
.dshsg-tone-ok { background: rgba(90,200,140,.18); color: #6fdc9f; }
.dshsg-tone-warn { background: rgba(240,190,80,.18); color: #f0be50; }
.dshsg-tone-bad { background: rgba(235,110,100,.18); color: #ef7f74; }
.dshsg-tone-muted { background: rgba(160,160,160,.16); color: #bbb; }
.dshsg-genlog-row-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dshsg-genlog-row-title {
  font-size: 12px;
  color: var(--dsw-alias-label-primary, #eaeaea);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dshsg-genlog-row-sub {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8f8f8f);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dshsg-genlog-detail {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-weak, rgba(255,255,255,.1));
  background: rgba(255,255,255,.03);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dshsg-genlog-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}
.dshsg-genlog-kv {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 12px;
  color: #ddd;
}
.dshsg-genlog-kv i {
  font-style: normal;
  color: #8f8f8f;
  margin-right: 4px;
}
.dshsg-genlog-block { display: flex; flex-direction: column; gap: 4px; }
.dshsg-genlog-block-title {
  font-size: 12px;
  font-weight: 600;
  color: #cfcfcf;
}
.dshsg-genlog-prompt {
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow: auto;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255,255,255,.05);
  user-select: text;
}
.dshsg-genlog-error {
  font-size: 12px;
  line-height: 1.6;
  color: #f0a09a;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
}
.dshsg-genlog-mono {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #9fb0c8;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 160px;
  overflow: auto;
  user-select: text;
}
.dshsg-genlog-list-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: #bbb;
}.dshsg-genlog-dir {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  color: var(--dsw-alias-label-tertiary, #7f8899);
  background: transparent;
  border: 0;
  padding: 0 2px;
  cursor: pointer;
  direction: rtl;
}
.dshsg-genlog-dir:hover { color: var(--dsw-alias-label-secondary, #b9c2d0); }

/* ---------- \u6536\u85CF\u6807\u8BB0\uFF08\u7F29\u7565\u56FE\u53F3\u4E0A\u89D2\u7EA2\u5FC3\uFF09 ---------- */
.dshsg-fav-mark {
  position: absolute;
  right: 4px;
  top: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: rgba(220, 60, 60, .92);
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .35);
}
`;

// src/client/ui/ErrorBoundary.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var CLIENT_LOG_ROUTE = "/plugins/dsh-session-gallery/client-log";
function describe(cause) {
  const err = cause;
  return {
    message: typeof err?.message === "string" ? err.message : String(cause),
    stack: typeof err?.stack === "string" ? err.stack : ""
  };
}
var PanelErrorBoundary = class extends import_react.Component {
  state = { message: "", stack: "" };
  static getDerivedStateFromError(cause) {
    return describe(cause);
  }
  componentDidCatch(cause, info) {
    const { message, stack } = describe(cause);
    try {
      void fetch(CLIENT_LOG_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, stack, componentStack: info?.componentStack ?? "" })
      }).catch(() => {
      });
    } catch {
    }
  }
  render() {
    if (this.state.message !== "") {
      const stackLines = this.state.stack.split("\n").slice(0, 10).join("\n");
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsg-crash", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsg-crash-title", children: "\u9762\u677F\u6E32\u67D3\u51FA\u9519" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dshsg-crash-msg", children: this.state.message }),
        stackLines !== "" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { className: "dshsg-crash-stack", children: stackLines }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dshsg-crash-hint", children: [
          "\u8FD9\u884C\u4FE1\u606F\u4E5F\u5199\u8FDB\u4E86 ",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "~/.dsh/cache/session-gallery/boot-diag.log" }),
          "\u3002 \u70B9\u300C\u91CD\u8BD5\u300D\u53EF\u4EE5\u91CD\u65B0\u6302\u8F7D\u9762\u677F\u3002"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            className: "dshsg-chip",
            onClick: () => this.setState({ message: "", stack: "" }),
            children: "\u91CD\u8BD5"
          }
        )
      ] });
    }
    return this.props.children;
  }
};

// src/client/ui/Panel.tsx
var import_react10 = require("react");

// src/client/data/session-images.ts
var INTERNAL_IMAGE_TOOLS = /* @__PURE__ */ new Set(["read_image", "view_image", "read"]);
var GEN_OUTPUT_RE = /session-gallery[\\/]gen[\\/]/i;
function pathOfArguments(raw) {
  if (typeof raw !== "string" || raw === "") return "";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.file_path === "string") return parsed.file_path;
    if (typeof parsed.path === "string") return parsed.path;
  } catch {
  }
  return "";
}
function pushImages(blocks, out) {
  if (!Array.isArray(blocks)) return;
  for (const block of blocks) {
    if (block === null || typeof block !== "object") continue;
    const b = block;
    if (b.type === "image") {
      const a = b.attachment;
      if (a !== void 0 && typeof a.attachmentId === "string") out.push(a);
      continue;
    }
    if (b.type === "tool-result") pushImages(b.content, out);
  }
}
function collectSessionImages(entries) {
  const toolNames = /* @__PURE__ */ new Map();
  const toolPaths = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const event = entry?.event;
    if (event?.type !== "tool/call") continue;
    const data = event.data;
    if (typeof data?.callId !== "string" || typeof data?.name !== "string") continue;
    toolNames.set(data.callId, data.name);
    const path = pathOfArguments(data.arguments);
    if (path !== "") toolPaths.set(data.callId, path);
  }
  const shouldSkip = (callId) => {
    if (!INTERNAL_IMAGE_TOOLS.has(toolNames.get(callId) ?? "")) return false;
    return !GEN_OUTPUT_RE.test(toolPaths.get(callId) ?? "");
  };
  const map = /* @__PURE__ */ new Map();
  const add = (attachment, origin, time) => {
    const id = attachment.attachmentId;
    const prev = map.get(id);
    if (prev === void 0 || prev.time > time) {
      map.set(id, { id, attachment, time, origin, mediaType: attachment.mediaType });
    }
  };
  for (const entry of entries) {
    const event = entry?.event;
    const data = event?.data;
    if (event === void 0 || data === void 0) continue;
    const time = typeof event.time === "number" ? event.time : 0;
    if (event.type === "user/message" || event.type === "assistant/message") {
      const out = [];
      pushImages(data.content, out);
      for (const attachment of out) add(attachment, "user", time);
      continue;
    }
    if (event.type === "tool/result") {
      const message = data.message;
      const messageCallId = typeof message?.toolCallId === "string" ? message.toolCallId : typeof message?.source?.callId === "string" ? message.source.callId : "";
      const results = Array.isArray(message?.content) ? message.content : [];
      for (const raw of results) {
        if (raw === null || typeof raw !== "object") continue;
        const block = raw;
        const out = [];
        if (block.type === "tool-result") {
          const callId = typeof block.toolCallId === "string" ? block.toolCallId : messageCallId;
          if (shouldSkip(callId)) continue;
          pushImages(block.content, out);
        } else {
          if (shouldSkip(messageCallId)) continue;
          pushImages([block], out);
        }
        for (const attachment of out) add(attachment, "tool", time);
      }
      continue;
    }
    if (event.type === "tool/ptc-dispatch") {
      const out = [];
      pushImages(data.content, out);
      for (const attachment of out) add(attachment, "tool", time);
    }
  }
  return [...map.values()].sort((a, b) => b.time - a.time);
}
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "\u2014";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatRelative(time) {
  if (!Number.isFinite(time) || time <= 0) return "";
  const diff = Date.now() - time;
  const min = Math.round(diff / 6e4);
  if (min < 1) return "\u521A\u521A";
  if (min < 60) return `${min} \u5206\u949F\u524D`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `${hour} \u5C0F\u65F6\u524D`;
  const day = Math.round(hour / 24);
  if (day < 30) return `${day} \u5929\u524D`;
  return new Date(time).toLocaleDateString("zh-CN");
}

// src/client/ui/Lightbox.tsx
var import_react3 = require("react");

// src/client/ui/ConfirmDelete.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function ConfirmDelete(props) {
  const { names, onCancel, onConfirm } = props;
  const [permanent, setPermanent] = (0, import_react2.useState)(false);
  const count = names.length;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "div",
    {
      className: "dshsg-confirm-backdrop",
      onClick: onCancel,
      children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsg-confirm", onClick: (event) => event.stopPropagation(), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsg-confirm-title", children: count === 1 ? permanent ? "\u6C38\u4E45\u5220\u9664\u8FD9\u5F20\u56FE\uFF1F" : "\u5220\u9664\u8FD9\u5F20\u56FE\uFF1F" : permanent ? `\u6C38\u4E45\u5220\u9664 ${count} \u5F20\u56FE\u7247\uFF1F` : `\u5220\u9664 ${count} \u5F20\u56FE\u7247\uFF1F` }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("ul", { className: "dshsg-confirm-list", children: [
          names.slice(0, 6).map((name, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { title: name, children: name }, `${name}-${index}`)),
          count > 6 && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
            "\u2026\u2026 \u53E6\u6709 ",
            count - 6,
            " \u5F20"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "dshsg-confirm-check", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "checkbox",
              checked: permanent,
              onChange: (event) => setPermanent(event.currentTarget.checked)
            }
          ),
          "\u6C38\u4E45\u5220\u9664\uFF08\u4E0D\u53EF\u6062\u590D\uFF09"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "dshsg-confirm-hint", children: permanent ? "\u8FD9\u4E9B\u6587\u4EF6\u4F1A\u88AB\u76F4\u63A5\u4ECE\u78C1\u76D8\u5220\u9664\uFF0C\u65E0\u6CD5\u6062\u590D\u3002" : "\u9ED8\u8BA4\u9001\u8FDB Windows \u56DE\u6536\u7AD9\uFF0C\u53EF\u4EE5\u5728\u7CFB\u7EDF\u56DE\u6536\u7AD9\u91CC\u627E\u56DE\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "dshsg-confirm-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "dshsg-action dshsg-action-ghost",
              onClick: onCancel,
              children: "\u53D6\u6D88"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              className: "dshsg-action dshsg-action-danger",
              onClick: () => onConfirm(permanent),
              children: "\u5220\u9664"
            }
          )
        ] })
      ] })
    }
  );
}

// src/client/ui/Lightbox.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function originLabel(origin) {
  switch (origin) {
    case "user":
      return "\u4F60\u53D1\u7684";
    case "tool":
      return "\u5DE5\u5177\u4EA7\u7269";
    case "script":
      return "\u811A\u672C\u4EA7\u7269";
    case "manual":
      return "\u624B\u52A8\u5BFC\u5165";
    case "site":
      return "\u7AD9\u70B9\u4E0A\u4F20";
    case "folder":
      return "\u6587\u4EF6\u5939\u653E\u5165";
    default:
      return "\u672A\u77E5\u6765\u6E90";
  }
}
function textOf(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}
function numberOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function effectivePrompt(item) {
  const own = item.prompt;
  if (own !== void 0 && own !== "") return own;
  return textOf(item.meta?.prompt);
}
function paramRows(item) {
  const meta = item.meta ?? {};
  const rows = [];
  const channel = textOf(meta.channel);
  if (channel !== void 0) rows.push({ label: "\u6E20\u9053", value: channel });
  const model = textOf(meta.model);
  if (model !== void 0) rows.push({ label: "\u6A21\u578B", value: model });
  const size = textOf(meta.size);
  if (size !== void 0) rows.push({ label: "\u5C3A\u5BF8", value: size });
  const quality = textOf(meta.quality);
  if (quality !== void 0) rows.push({ label: "\u8D28\u91CF", value: quality });
  const resolution = textOf(meta.resolution);
  if (resolution !== void 0) rows.push({ label: "\u5206\u8FA8\u7387", value: resolution.toUpperCase() });
  const width = item.width ?? numberOf(meta.width);
  const height = item.height ?? numberOf(meta.height);
  if (width !== void 0 && height !== void 0) rows.push({ label: "\u50CF\u7D20", value: `${width} \xD7 ${height}` });
  if (item.bytes !== void 0) rows.push({ label: "\u4F53\u79EF", value: formatBytes(item.bytes) });
  const cost = numberOf(meta.costUsd);
  if (cost !== void 0) rows.push({ label: "\u6210\u672C", value: `$${cost.toFixed(4)}\uFF08\u7EA6 \xA5${(cost * 7.1).toFixed(3)}\uFF09` });
  return rows;
}
function timeRows(item) {
  const meta = item.meta ?? {};
  const rows = [];
  const createdAt = textOf(meta.createdAt);
  if (createdAt !== void 0) rows.push({ label: "\u751F\u6210\u65F6\u95F4", value: createdAt.replace("T", " ").slice(0, 19) });
  const importedAt = textOf(meta.importedAt);
  if (importedAt !== void 0) rows.push({ label: "\u5F52\u6863\u65F6\u95F4", value: importedAt.replace("T", " ").slice(0, 19) });
  if (item.time !== void 0) rows.push({ label: "\u65F6\u95F4", value: formatRelative(item.time) });
  const mediaType = item.mediaType;
  if (mediaType !== void 0) rows.push({ label: "\u683C\u5F0F", value: mediaType });
  return rows;
}
function paramsText(item) {
  const lines = paramRows(item).map((row) => `${row.label}\uFF1A${row.value}`);
  const prompt = effectivePrompt(item);
  if (prompt !== void 0 && prompt !== "") {
    lines.push("", prompt);
  }
  return lines.join("\n");
}
function compareFacts(item) {
  const meta = item.meta ?? {};
  const out = /* @__PURE__ */ new Map();
  const put = (label, value) => {
    if (value !== void 0 && value !== "") out.set(label, value);
  };
  put("\u6A21\u578B", textOf(meta.model));
  put("\u5C3A\u5BF8", textOf(meta.size));
  const resolution = textOf(meta.resolution);
  put("\u5206\u8FA8\u7387", resolution === void 0 ? void 0 : resolution.toUpperCase());
  put("\u8D28\u91CF", textOf(meta.quality));
  const width = item.width ?? numberOf(meta.width);
  const height = item.height ?? numberOf(meta.height);
  put("\u50CF\u7D20", width !== void 0 && height !== void 0 ? `${width} \xD7 ${height}` : void 0);
  put("\u4F53\u79EF", item.bytes !== void 0 ? formatBytes(item.bytes) : void 0);
  const refs = numberOf(meta.referenceCount);
  put("\u53C2\u8003\u56FE", refs === void 0 ? void 0 : `${refs} \u5F20`);
  const cost = numberOf(meta.costUsd);
  put("\u82B1\u8D39", cost === void 0 ? void 0 : `$${cost.toFixed(4)}`);
  const createdAt = textOf(meta.createdAt);
  put("\u751F\u6210\u65F6\u95F4", createdAt === void 0 ? void 0 : createdAt.replace("T", " ").slice(0, 16));
  return out;
}
var MIN_ZOOM = 0.05;
var MAX_ZOOM = 16;
function GalleryLightbox(props) {
  const { items, index, resolveUrl, onClose, onIndexChange, onCopy, onToggleFavorite, onArchive, onIgnore, onPutToWorkbench, onPutToDialog, onReveal, onDelete, onCompare, favorites } = props;
  const item = items[index];
  const itemKey = item === void 0 ? "" : item.id;
  const resolveRef = (0, import_react3.useRef)(resolveUrl);
  resolveRef.current = resolveUrl;
  const itemRef = (0, import_react3.useRef)(item);
  itemRef.current = item;
  const stageRef = (0, import_react3.useRef)(null);
  const [url, setUrl] = (0, import_react3.useState)(void 0);
  const [natural, setNatural] = (0, import_react3.useState)({ width: 0, height: 0 });
  const [stage, setStage] = (0, import_react3.useState)({ width: 0, height: 0 });
  const [zoom, setZoom] = (0, import_react3.useState)(1);
  const [offset, setOffset] = (0, import_react3.useState)({ x: 0, y: 0 });
  const viewRef = (0, import_react3.useRef)({ zoom: 1, offset: { x: 0, y: 0 } });
  viewRef.current = { zoom, offset };
  const dragRef = (0, import_react3.useRef)(null);
  const downPointRef = (0, import_react3.useRef)(null);
  const [dragging, setDragging] = (0, import_react3.useState)(false);
  const [toast, setToast] = (0, import_react3.useState)(null);
  const [deleteConfirm, setDeleteConfirm] = (0, import_react3.useState)(false);
  const [comparePick, setComparePick] = (0, import_react3.useState)(false);
  const [thumbUrls, setThumbUrls] = (0, import_react3.useState)({});
  const itemsRef = (0, import_react3.useRef)(items);
  itemsRef.current = items;
  const flash = (0, import_react3.useCallback)((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => cur === msg ? null : cur), 1600);
  }, []);
  (0, import_react3.useEffect)(() => {
    if (itemKey === "") return;
    const target = itemRef.current;
    if (target === void 0) return;
    let alive = true;
    setUrl(void 0);
    resolveRef.current(target).then((value) => {
      if (alive) setUrl(value);
    }).catch(() => {
      if (alive) setUrl(void 0);
    });
    return () => {
      alive = false;
    };
  }, [itemKey]);
  const fit = (0, import_react3.useMemo)(() => {
    if (natural.width <= 0 || natural.height <= 0 || stage.width <= 0 || stage.height <= 0) return 1;
    return Math.min(stage.width / natural.width, stage.height / natural.height) * 0.94;
  }, [natural.width, natural.height, stage.width, stage.height]);
  (0, import_react3.useEffect)(() => {
    if (!comparePick) return;
    let alive = true;
    const current = itemRef.current?.id;
    for (const target of itemsRef.current.slice(0, 60)) {
      if (target.id === current) continue;
      void resolveRef.current(target).then((value) => {
        if (alive) setThumbUrls((prev) => ({ ...prev, [target.id]: value }));
      }).catch(() => void 0);
    }
    return () => {
      alive = false;
    };
  }, [comparePick]);
  (0, import_react3.useEffect)(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural({ width: 0, height: 0 });
  }, [index]);
  (0, import_react3.useEffect)(() => {
    const el = stageRef.current;
    if (el === null) return;
    const update = () => setStage({ width: el.clientWidth, height: el.clientHeight });
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  (0, import_react3.useEffect)(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (index > 0) onIndexChange(index - 1);
      } else if (e.key === "ArrowRight") {
        if (index < items.length - 1) onIndexChange(index + 1);
      } else if (e.key === "0" || e.key === "+") {
        setZoom((z) => Math.min(MAX_ZOOM, z * 1.25));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(MIN_ZOOM, z / 1.25));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);
  (0, import_react3.useEffect)(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (d === null) return;
      setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
    };
    const onUp = () => {
      if (dragRef.current !== null) {
        dragRef.current = null;
        setDragging(false);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);
  const onWheel = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    const { zoom: currentZoom, offset: currentOffset } = viewRef.current;
    const factor = Math.exp(-e.deltaY * 15e-4);
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * factor));
    const k = next / currentZoom;
    setZoom(next);
    setOffset({
      x: px - k * (px - currentOffset.x),
      y: py - k * (py - currentOffset.y)
    });
  };
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };
  const fitOnce = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };
  const actualSize = () => {
    if (fit <= 0) return;
    setZoom(1 / fit);
    setOffset({ x: 0, y: 0 });
  };
  const displayW = natural.width * fit * zoom;
  const displayH = natural.height * fit * zoom;
  const zoomPct = Math.round(zoom * 100);
  const copyText = (0, import_react3.useCallback)((text, okMessage) => {
    void navigator.clipboard.writeText(text).then(
      () => flash(okMessage),
      () => flash("\u590D\u5236\u5931\u8D25")
    );
  }, [flash]);
  const titlebarPx = (0, import_react3.useMemo)(() => {
    const overlay = navigator.windowControlsOverlay;
    if (overlay?.visible === true && typeof overlay.getTitlebarAreaRect === "function") {
      try {
        const rect = overlay.getTitlebarAreaRect();
        if (typeof rect?.height === "number" && rect.height > 0) return Math.round(rect.height);
      } catch {
      }
    }
    return /Electron/i.test(navigator.userAgent) ? 38 : 0;
  }, []);
  if (item === void 0) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, {});
  const favorite = props.favoriteOf !== void 0 ? props.favoriteOf(item) : favorites.has(item.id);
  const paramList = paramRows(item);
  const timeList = timeRows(item);
  const promptText = effectivePrompt(item);
  const hasPrompt = promptText !== void 0 && promptText !== "";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: "dshsg-lightbox",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "\u56FE\u7247\u67E5\u770B\u5668",
      style: { "--dshsg-titlebar": `${titlebarPx}px` },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-top", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsg-lb-title", children: item.name ?? "\u56FE\u7247" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "dshsg-lb-count", children: [
            index + 1,
            " / ",
            items.length
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-nav-group", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                className: "dshsg-lb-nav-inline",
                title: "\u4E0A\u4E00\u5F20 (\u2190)",
                disabled: index <= 0,
                onClick: () => onIndexChange(index - 1),
                children: "\u2039"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                className: "dshsg-lb-nav-inline",
                title: "\u4E0B\u4E00\u5F20 (\u2192)",
                disabled: index >= items.length - 1,
                onClick: () => onIndexChange(index + 1),
                children: "\u203A"
              }
            )
          ] }),
          onCompare !== void 0 && items.length >= 2 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "button",
            {
              className: "dshsg-lb-compare",
              "data-on": comparePick ? "true" : "false",
              title: "\u6311\u4E00\u5F20\u548C\u5F53\u524D\u56FE\u5E76\u6392\u5BF9\u6BD4",
              onClick: () => setComparePick((value) => !value),
              children: "\u5BF9\u6BD4"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "dshsg-lb-close-button", title: "\u5173\u95ED (Esc)", onClick: onClose, children: "\u2715" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            className: "dshsg-lb-stage",
            ref: stageRef,
            "data-dragging": dragging ? "true" : "false",
            onWheel,
            onMouseDown: (e) => {
              downPointRef.current = { x: e.clientX, y: e.clientY };
              onMouseDown(e);
            },
            onClick: (e) => {
              const start = downPointRef.current;
              downPointRef.current = null;
              if (start === null) return;
              const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
              const target = e.target;
              if (moved >= 5) return;
              if (target.tagName === "IMG") return;
              if (target.closest("button") !== null) return;
              if (target.closest("[data-rail]") !== null) return;
              onClose();
            },
            onDoubleClick: (e) => {
              e.preventDefault();
              fitOnce();
            },
            children: [
              url !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "img",
                {
                  className: "dshsg-lb-img",
                  src: url,
                  alt: "",
                  draggable: false,
                  style: {
                    width: displayW > 0 ? `${displayW}px` : "auto",
                    height: displayH > 0 ? `${displayH}px` : "auto",
                    maxWidth: displayW > 0 ? "none" : "90vw",
                    maxHeight: displayH > 0 ? "none" : "90vh",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`
                  },
                  onLoad: (e) => {
                    const el = e.currentTarget;
                    setNatural({ width: el.naturalWidth, height: el.naturalHeight });
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-zoom", children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { title: "\u7F29\u5C0F (-)", onClick: () => setZoom((z) => Math.max(MIN_ZOOM, z / 1.25)), children: "\u2212" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
                  zoomPct,
                  "%"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { title: "\u653E\u5927 (+)", onClick: () => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25)), children: "+" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { title: "\u9002\u5E94\u7A97\u53E3 (\u53CC\u51FB\u56FE\u7247)", onClick: fitOnce, children: "\u9002\u5E94" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { title: "\u5B9E\u9645\u50CF\u7D20 (100%)", onClick: actualSize, children: "1:1" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "dshsg-lb-rail", "data-side": "left", "data-rail": "params", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-rail-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u53C2\u6570" }),
            paramList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                className: "dshsg-lb-rail-copy",
                title: "\u590D\u5236\u4E0A\u9762\u8FD9\u4E9B\u53C2\u6570\uFF08\u6709\u63D0\u793A\u8BCD\u5219\u4E00\u5E76\u590D\u5236\uFF09",
                onClick: () => copyText(paramsText(item), hasPrompt ? "\u5DF2\u590D\u5236\uFF1A\u53C2\u6570 + \u63D0\u793A\u8BCD" : "\u5DF2\u590D\u5236\u53C2\u6570"),
                children: "\u590D\u5236\u5168\u90E8"
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-rows", children: [
            paramList.map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-row", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { children: row.label }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: row.value })
            ] }, row.label)),
            paramList.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsg-lb-row dshsg-lb-row-empty", children: "\u8FD9\u5F20\u56FE\u6CA1\u6709\u53C2\u6570\u4FE1\u606F" })
          ] }),
          hasPrompt && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-rail-prompt", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-rail-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u63D0\u793A\u8BCD" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "button",
                {
                  className: "dshsg-lb-rail-copy",
                  title: "\u53EA\u590D\u5236\u63D0\u793A\u8BCD",
                  onClick: () => copyText(promptText ?? "", "\u5DF2\u590D\u5236\u63D0\u793A\u8BCD"),
                  children: "\u590D\u5236\u63D0\u793A\u8BCD"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsg-lb-rail-prompt-body", children: promptText })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "dshsg-lb-rail", "data-side": "right", "data-rail": "actions", children: [
          timeList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsg-lb-rows", children: timeList.map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-row", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("i", { children: row.label }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: row.value })
          ] }, row.label)) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-rail-actions", children: [
            onArchive !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                "data-tone": "primary",
                onClick: () => {
                  onArchive(item);
                  flash("\u5DF2\u5B58\u5165\u56FE\u7247\u5E93");
                },
                title: "\u628A\u8FD9\u5F20\u56FE\u5B58\u8FDB\u56FE\u7247\u5E93\uFF08\u5199 \u4F1A\u8BDD\u5BFC\u5165 + sidecar\uFF09",
                children: "\u5B58\u5165\u56FE\u7247\u5E93"
              }
            ),
            onIgnore !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                onClick: () => {
                  onIgnore(item);
                  flash("\u5DF2\u5FFD\u7565\uFF1A\u4E0D\u518D\u51FA\u73B0\u5728\u672A\u5F52\u6863\u533A");
                },
                title: "\u5FFD\u7565\u8FD9\u5F20\u56FE\uFF08\u4E0D\u518D\u51FA\u73B0\u5728\u672A\u5F52\u6863\u533A\uFF1B\u53EF\u5728\u8BBE\u7F6E\u91CC\u6E05\u7A7A\u5FFD\u7565\u8BB0\u5F55\uFF09",
                children: "\u5FFD\u7565\u6B64\u56FE"
              }
            ),
            onToggleFavorite !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { onClick: () => onToggleFavorite(item.id), title: "\u6536\u85CF", children: favorite ? "\u2605 \u5DF2\u6536\u85CF" : "\u2606 \u6536\u85CF" }),
            onPutToWorkbench !== void 0 && item.path !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                onClick: () => {
                  onPutToWorkbench(item);
                  flash("\u5DF2\u653E\u5165\u5DE5\u4F5C\u53F0");
                },
                title: "\u628A\u8FD9\u5F20\u56FE\u653E\u8FDB\u5DE5\u4F5C\u53F0\u753B\u5E03",
                children: "\u653E\u5165\u5DE5\u4F5C\u53F0"
              }
            ),
            onPutToDialog !== void 0 && item.path !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                onClick: () => onPutToDialog(item),
                title: "\u628A\u8FD9\u5F20\u56FE\u7684\u78C1\u76D8\u8DEF\u5F84\u5199\u8FDB\u8F93\u5165\u6846",
                children: "\u653E\u5165\u5BF9\u8BDD"
              }
            ),
            onReveal !== void 0 && item.path !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                onClick: () => onReveal(item),
                title: "\u5728\u8D44\u6E90\u7BA1\u7406\u5668\u91CC\u6253\u5F00\u8FD9\u5F20\u56FE\u6240\u5728\u7684\u6587\u4EF6\u5939",
                children: "\u6253\u5F00\u6587\u4EF6\u5939"
              }
            ),
            onDelete !== void 0 && item.path !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                "data-tone": "danger",
                onClick: () => setDeleteConfirm(true),
                title: "\u5220\u9664\u8FD9\u5F20\u56FE\uFF08\u9ED8\u8BA4\u8FDB Windows \u56DE\u6536\u7AD9\uFF09",
                children: "\u5220\u9664"
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "button",
              {
                onClick: () => {
                  if (url === void 0) return;
                  onCopy(url);
                  flash("\u5DF2\u590D\u5236\u56FE\u7247");
                },
                children: "\u590D\u5236\u56FE\u7247"
              }
            )
          ] })
        ] }),
        deleteConfirm && onDelete !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          ConfirmDelete,
          {
            names: [item.name ?? "\u56FE\u7247"],
            onCancel: () => setDeleteConfirm(false),
            onConfirm: (permanent) => {
              onDelete(item, permanent);
              setDeleteConfirm(false);
            }
          }
        ),
        comparePick && onCompare !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-pick", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-pick-head", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u9009\u4E00\u5F20\u548C\u5F53\u524D\u56FE\u5E76\u6392\u5BF9\u6BD4" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { className: "dshsg-lb-pick-cancel", onClick: () => setComparePick(false), children: "\u53D6\u6D88" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "dshsg-lb-pick-list", children: [
            items.filter((target) => target.id !== item.id).slice(0, 60).map((target) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              "button",
              {
                className: "dshsg-lb-pick-item",
                title: target.name ?? "",
                onClick: () => {
                  setComparePick(false);
                  onCompare([item, target]);
                },
                children: [
                  thumbUrls[target.id] === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsg-lb-pick-ph", children: "\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("img", { src: thumbUrls[target.id], alt: "", draggable: false }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "dshsg-lb-pick-name", children: target.name ?? "" })
                ]
              },
              target.id
            )),
            items.length <= 1 && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsg-lb-pick-empty", children: "\u8FD9\u7EC4\u56FE\u91CC\u6CA1\u6709\u522B\u7684\u56FE\u53EF\u9009" })
          ] })
        ] }),
        toast !== null && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "dshsg-toast", children: toast })
      ]
    }
  );
}

// src/client/ui/CompareView.tsx
var import_react4 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var ROW_ORDER = ["\u6A21\u578B", "\u5C3A\u5BF8", "\u5206\u8FA8\u7387", "\u8D28\u91CF", "\u50CF\u7D20", "\u4F53\u79EF", "\u53C2\u8003\u56FE", "\u82B1\u8D39", "\u751F\u6210\u65F6\u95F4"];
var MIN_ZOOM2 = 0.5;
var MAX_ZOOM2 = 8;
var WHEEL_STEP = 1.15;
function clampZoom(value) {
  return Math.min(MAX_ZOOM2, Math.max(MIN_ZOOM2, value));
}
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
function CompareView(props) {
  const { items, resolveUrl, onClose } = props;
  const [urls, setUrls] = (0, import_react4.useState)({});
  const resolveRef = (0, import_react4.useRef)(resolveUrl);
  resolveRef.current = resolveUrl;
  const groupKey = items.map((item) => item.id).join("|");
  const [zoom, setZoom] = (0, import_react4.useState)(1);
  const [origin, setOrigin] = (0, import_react4.useState)({ x: 0.5, y: 0.5 });
  const [shift, setShift] = (0, import_react4.useState)({ x: 0, y: 0 });
  const [dragging, setDragging] = (0, import_react4.useState)(false);
  const stageRef = (0, import_react4.useRef)(null);
  const dragRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    let alive = true;
    setUrls({});
    for (const item of items) {
      void resolveRef.current(item).then((url) => {
        if (!alive) return;
        setUrls((prev) => ({ ...prev, [item.id]: url }));
      }).catch(() => {
        if (!alive) return;
        setUrls((prev) => ({ ...prev, [item.id]: void 0 }));
      });
    }
    return () => {
      alive = false;
    };
  }, [groupKey]);
  const reset = (0, import_react4.useCallback)(() => {
    setZoom(1);
    setOrigin({ x: 0.5, y: 0.5 });
    setShift({ x: 0, y: 0 });
  }, []);
  (0, import_react4.useEffect)(() => {
    reset();
  }, [groupKey, reset]);
  (0, import_react4.useEffect)(() => {
    const stage = stageRef.current;
    if (stage === null) return;
    const onWheel = (event) => {
      const cell = event.target?.closest("[data-cmp-cell]");
      if (cell === null || cell === void 0) return;
      const img = cell.querySelector("img");
      if (img === null) return;
      event.preventDefault();
      const rect = img.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setOrigin({
        x: clamp01((event.clientX - rect.left) / rect.width),
        y: clamp01((event.clientY - rect.top) / rect.height)
      });
      const factor = event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
      setZoom((prev) => clampZoom(prev * factor));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);
  (0, import_react4.useEffect)(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  const onPointerDown = (0, import_react4.useCallback)((event) => {
    if (zoom <= 1) return;
    const img = event.currentTarget.querySelector("img");
    if (img === null) return;
    const rect = img.getBoundingClientRect();
    const width = rect.width / zoom;
    const height = rect.height / zoom;
    if (width <= 0 || height <= 0) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      sx: shift.x,
      sy: shift.y,
      w: width,
      h: height
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [zoom, shift]);
  const onPointerMove = (0, import_react4.useCallback)((event) => {
    const drag = dragRef.current;
    if (drag === null) return;
    setShift({
      x: drag.sx + (event.clientX - drag.x) / drag.w,
      y: drag.sy + (event.clientY - drag.y) / drag.h
    });
  }, []);
  const endDrag = (0, import_react4.useCallback)(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);
  const facts = (0, import_react4.useMemo)(() => items.map((item) => compareFacts(item)), [groupKey]);
  const rows = (0, import_react4.useMemo)(() => {
    return ROW_ORDER.filter((label) => facts.some((fact) => fact.has(label)));
  }, [facts]);
  const close = (0, import_react4.useCallback)(() => onClose(), [onClose]);
  const imageStyle = {
    transform: `translate(${shift.x * 100}%, ${shift.y * 100}%) scale(${zoom})`,
    transformOrigin: `${origin.x * 100}% ${origin.y * 100}%`
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsg-cmp-mask", onClick: close, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsg-cmp", onClick: (event) => event.stopPropagation(), children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsg-cmp-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dshsg-cmp-title", children: [
        "\u5E76\u6392\u5BF9\u6BD4 \xB7 ",
        items.length,
        " \u5F20"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "dshsg-cmp-zoom", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { title: "\u7F29\u5C0F", onClick: () => setZoom((value) => clampZoom(value / 1.25)), children: "\u2212" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "dshsg-cmp-pct", children: [
          Math.round(zoom * 100),
          "%"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { title: "\u653E\u5927", onClick: () => setZoom((value) => clampZoom(value * 1.25)), children: "+" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { title: "\u590D\u4F4D\uFF08\u53CC\u51FB\u56FE\u7247\u4E5F\u884C\uFF09", onClick: reset, children: "\u590D\u4F4D" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { className: "dshsg-cmp-close", title: "\u5173\u95ED\uFF08Esc\uFF09", onClick: close, children: "\u2715" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        className: "dshsg-cmp-stage",
        ref: stageRef,
        "data-dragging": dragging ? "true" : "false",
        children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "figure",
          {
            className: "dshsg-cmp-cell",
            "data-cmp-cell": "true",
            style: { cursor: zoom > 1 ? dragging ? "grabbing" : "grab" : "default" },
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onDoubleClick: reset,
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsg-cmp-frame", children: urls[item.id] === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsg-cmp-loading", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "img",
                {
                  src: urls[item.id],
                  alt: item.name ?? `\u56FE ${index + 1}`,
                  draggable: false,
                  style: imageStyle
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("figcaption", { className: "dshsg-cmp-cap", children: [
                items.length === 2 ? index === 0 ? "\u5DE6\u56FE" : "\u53F3\u56FE" : `\u56FE ${index + 1}`,
                item.name !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "dshsg-cmp-name", children: item.name })
              ] })
            ]
          },
          item.id
        ))
      }
    ),
    rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "dshsg-cmp-table-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("table", { className: "dshsg-cmp-table", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("tbody", { children: rows.map((label) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { children: label }),
      facts.map((fact, index) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { children: fact.get(label) ?? "\u2014" }, items[index]?.id ?? index))
    ] }, label)) }) }) })
  ] }) });
}

// src/client/ui/ImageContextMenu.tsx
var import_react5 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var MENU_WIDTH = 172;
var ITEM_HEIGHT = 34;
function ImageContextMenu(props) {
  const { x, y, items, onClose } = props;
  (0, import_react5.useEffect)(() => {
    const close = () => onClose();
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  const left = Math.max(8, Math.min(x, window.innerWidth - MENU_WIDTH - 8));
  const estimated = items.length * ITEM_HEIGHT + 12;
  const top = y + estimated > window.innerHeight ? Math.max(8, y - estimated) : y;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      className: "dshsg-ctx",
      style: { left, top, width: MENU_WIDTH },
      onMouseDown: (event) => event.stopPropagation(),
      onContextMenu: (event) => event.preventDefault(),
      children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "button",
        {
          className: "dshsg-ctx-item",
          "data-tone": item.tone ?? "",
          onClick: () => {
            item.onSelect();
            onClose();
          },
          children: item.label
        },
        item.label
      ))
    }
  );
}

// src/client/ui/Workbench.tsx
var import_react6 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var IMAGE_ROUTE = "/plugins/dsh-session-gallery/image";
var SAVE_ROUTE = "/plugins/dsh-session-gallery/workbench-save";
function imageUrl(path) {
  return `${IMAGE_ROUTE}?path=${encodeURIComponent(path)}`;
}
async function loadHtmlImage(url) {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = url;
  });
}
function traceShape(context, mark, points, begin = true) {
  if (begin) context.beginPath();
  if (mark.kind === "rect") {
    const first = points[0];
    const second = points[1];
    if (first === void 0 || second === void 0) return;
    context.rect(
      Math.min(first.x, second.x),
      Math.min(first.y, second.y),
      Math.abs(second.x - first.x),
      Math.abs(second.y - first.y)
    );
    return;
  }
  const head = points[0];
  if (head === void 0) return;
  context.moveTo(head.x, head.y);
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (point !== void 0) context.lineTo(point.x, point.y);
  }
  context.closePath();
}
async function saveCanvasImage(canvas, name, mime = "image/png", quality) {
  const dataUrl = canvas.toDataURL(mime, quality);
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return void 0;
  try {
    const response = await fetch(SAVE_ROUTE, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, dataBase64: dataUrl.slice(comma + 1) })
    });
    if (!response.ok) return void 0;
    const payload = await response.json();
    return typeof payload.path === "string" ? payload.path : void 0;
  } catch {
    return void 0;
  }
}
async function exportMask(image, marks, locales) {
  let source;
  try {
    source = await loadHtmlImage(image.url);
  } catch {
    return {};
  }
  const width = Math.max(1, Math.round(image.width));
  const height = Math.max(1, Math.round(image.height));
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const base = image.name.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "image";
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskContext = maskCanvas.getContext("2d");
  if (maskContext === null) return {};
  maskContext.fillStyle = "#ffffff";
  maskContext.fillRect(0, 0, width, height);
  maskContext.globalCompositeOperation = "destination-out";
  marks.forEach((mark, index) => {
    const points = locales[index];
    if (points !== void 0) traceShape(maskContext, mark, points, index === 0);
  });
  maskContext.fill();
  maskContext.globalCompositeOperation = "source-over";
  const mask = await saveCanvasImage(maskCanvas, `${base}-mask-${stamp}.png`, "image/png");
  return mask === void 0 ? {} : { mask };
}
function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
function boundsOf(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
function Workbench(props) {
  const { items, onRemove, onClear, onRequestEdit } = props;
  const hostRef = (0, import_react6.useRef)(null);
  const inkRef = (0, import_react6.useRef)(null);
  const [placed, setPlaced] = (0, import_react6.useState)([]);
  const [view, setView] = (0, import_react6.useState)({ panX: 40, panY: 40, zoom: 0.5 });
  const [tool, setTool] = (0, import_react6.useState)("pan");
  const [marks, setMarks] = (0, import_react6.useState)([]);
  const [draft, setDraft] = (0, import_react6.useState)(null);
  const [hostSize, setHostSize] = (0, import_react6.useState)({ width: 0, height: 0 });
  const [toast, setToast] = (0, import_react6.useState)(null);
  const [busy, setBusy] = (0, import_react6.useState)(false);
  const [layout, setLayout] = (0, import_react6.useState)("grid");
  const [selectedPath, setSelectedPath] = (0, import_react6.useState)(null);
  const flash = (0, import_react6.useCallback)((message) => {
    setToast(message);
    window.setTimeout(() => setToast((cur) => cur === message ? null : cur), 1600);
  }, []);
  const sizesRef = (0, import_react6.useRef)(/* @__PURE__ */ new Map());
  (0, import_react6.useEffect)(() => {
    let cancelled = false;
    const wanted = items.map((item) => item.path);
    setPlaced((prev) => {
      const existing = new Map(prev.map((image) => [image.path, image]));
      const next = [];
      let cursorX = 0;
      const gap = 40;
      for (const item of items) {
        const known = existing.get(item.path);
        if (known !== void 0) {
          next.push(known);
          cursorX = Math.max(cursorX, known.x + known.width + gap);
          continue;
        }
        next.push({
          path: item.path,
          name: item.name,
          x: cursorX,
          y: 0,
          width: 0,
          height: 0,
          url: imageUrl(item.path),
          opacity: 1
        });
        cursorX += gap;
      }
      for (const image of next) {
        if (image.width > 0) continue;
        const cached = sizesRef.current.get(image.path);
        if (cached !== void 0) {
          image.width = cached.width;
          image.height = cached.height;
          continue;
        }
        const probe = new Image();
        probe.onload = () => {
          if (cancelled) return;
          const size = { width: probe.naturalWidth, height: probe.naturalHeight };
          sizesRef.current.set(image.path, size);
          setPlaced((cur) => cur.map((entry) => entry.path === image.path ? { ...entry, ...size } : entry));
        };
        probe.src = image.url;
      }
      return next;
    });
    setPlaced((prev) => prev.filter((image) => wanted.includes(image.path)));
    return () => {
      cancelled = true;
    };
  }, [items]);
  const arrange = (0, import_react6.useCallback)((images, mode) => {
    const gap = 40;
    if (mode === "stack") {
      return images.map((image) => ({ ...image, x: 0, y: 0 }));
    }
    if (mode === "row") {
      let x2 = 0;
      return images.map((image) => {
        const next = { ...image, x: x2, y: 0 };
        x2 += (image.width || 1) + gap;
        return next;
      });
    }
    if (mode === "column") {
      let y2 = 0;
      return images.map((image) => {
        const next = { ...image, x: 0, y: y2 };
        y2 += (image.height || 1) + gap;
        return next;
      });
    }
    const limit = images.length <= 4 ? Number.POSITIVE_INFINITY : 2200;
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    return images.map((image) => {
      const width = image.width || 1;
      if (x > 0 && x + width > limit) {
        x = 0;
        y += rowHeight + gap;
        rowHeight = 0;
      }
      const next = { ...image, x, y };
      x += width + gap;
      rowHeight = Math.max(rowHeight, image.height || 1);
      return next;
    });
  }, []);
  (0, import_react6.useEffect)(() => {
    if (layout !== "grid") return;
    setPlaced((prev) => {
      if (prev.length === 0 || prev.some((image) => image.width === 0)) return prev;
      const next = arrange(prev, "grid");
      const same = next.every((image, index) => image.x === prev[index]?.x && image.y === prev[index]?.y);
      return same ? prev : next;
    });
  }, [placed, layout, arrange]);
  const laidOut = placed;
  (0, import_react6.useEffect)(() => {
    const host = hostRef.current;
    if (host === null) return;
    const measure = () => setHostSize({ width: host.clientWidth, height: host.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const fittedRef = (0, import_react6.useRef)(false);
  (0, import_react6.useEffect)(() => {
    if (fittedRef.current) return;
    if (hostSize.width === 0 || laidOut.length === 0) return;
    if (laidOut.some((image) => image.width === 0)) return;
    const box = boundsOf(laidOut.flatMap((image) => [
      { x: image.x, y: image.y },
      { x: image.x + image.width, y: image.y + image.height }
    ]));
    if (box.w === 0 || box.h === 0) return;
    const zoom = Math.min(hostSize.width / (box.w + 120), hostSize.height / (box.h + 120), 1);
    setView({
      zoom,
      panX: (hostSize.width - box.w * zoom) / 2 - box.x * zoom,
      panY: (hostSize.height - box.h * zoom) / 2 - box.y * zoom
    });
    fittedRef.current = true;
  }, [hostSize, laidOut]);
  const toWorld = (0, import_react6.useCallback)((screenX, screenY) => ({
    x: (screenX - view.panX) / view.zoom,
    y: (screenY - view.panY) / view.zoom
  }), [view]);
  const toScreen = (0, import_react6.useCallback)((worldX, worldY) => ({
    x: worldX * view.zoom + view.panX,
    y: worldY * view.zoom + view.panY
  }), [view]);
  const imageAt = (0, import_react6.useCallback)((point) => {
    for (let index = laidOut.length - 1; index >= 0; index -= 1) {
      const image = laidOut[index];
      if (image === void 0 || image.width === 0) continue;
      if (point.x >= image.x && point.x <= image.x + image.width && point.y >= image.y && point.y <= image.y + image.height) return image;
    }
    return void 0;
  }, [laidOut]);
  const panRef = (0, import_react6.useRef)(null);
  const drawRef = (0, import_react6.useRef)(null);
  const dragImageRef = (0, import_react6.useRef)(null);
  const onWheel = (event) => {
    event.preventDefault();
    const host = hostRef.current;
    if (host === null) return;
    const rect = host.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const factor = Math.exp(-event.deltaY * 15e-4);
    setView((prev) => {
      const zoom = Math.min(8, Math.max(0.05, prev.zoom * factor));
      const worldX = (cursorX - prev.panX) / prev.zoom;
      const worldY = (cursorY - prev.panY) / prev.zoom;
      return { zoom, panX: cursorX - worldX * zoom, panY: cursorY - worldY * zoom };
    });
  };
  const onPointerDown = (event) => {
    const host = hostRef.current;
    if (host === null) return;
    event.preventDefault();
    const rect = host.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const wantsPan = tool === "pan" || event.button === 1 || event.shiftKey;
    if (wantsPan) {
      const world2 = toWorld(screenX, screenY);
      const hit = event.button === 1 ? void 0 : imageAt(world2);
      if (hit !== void 0 && hit.width > 0) {
        setSelectedPath(hit.path);
        dragImageRef.current = {
          path: hit.path,
          screenX,
          screenY,
          originX: hit.x,
          originY: hit.y
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      setSelectedPath(null);
      panRef.current = { screenX, screenY, panX: view.panX, panY: view.panY };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const world = toWorld(screenX, screenY);
    drawRef.current = { points: [world] };
    setDraft(tool === "rect" ? { kind: "rect", box: { x: world.x, y: world.y, w: 0, h: 0 } } : { kind: "pen", points: [world] });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    const host = hostRef.current;
    if (host === null) return;
    const rect = host.getBoundingClientRect();
    const moving = dragImageRef.current;
    if (moving !== null) {
      const dx = (event.clientX - rect.left - moving.screenX) / view.zoom;
      const dy = (event.clientY - rect.top - moving.screenY) / view.zoom;
      setLayout("free");
      setPlaced((prev) => prev.map((image) => image.path === moving.path ? { ...image, x: moving.originX + dx, y: moving.originY + dy } : image));
      return;
    }
    const pan = panRef.current;
    if (pan !== null) {
      setView((prev) => ({
        ...prev,
        panX: pan.panX + (event.clientX - rect.left - pan.screenX),
        panY: pan.panY + (event.clientY - rect.top - pan.screenY)
      }));
      return;
    }
    const drawing = drawRef.current;
    if (drawing === null) return;
    const world = toWorld(event.clientX - rect.left, event.clientY - rect.top);
    drawing.points.push(world);
    if (tool === "rect") {
      const first = drawing.points[0];
      if (first === void 0) return;
      setDraft({
        kind: "rect",
        box: {
          x: Math.min(first.x, world.x),
          y: Math.min(first.y, world.y),
          w: Math.abs(world.x - first.x),
          h: Math.abs(world.y - first.y)
        }
      });
    } else {
      setDraft({ kind: "pen", points: [...drawing.points] });
    }
  };
  const onPointerUp = () => {
    panRef.current = null;
    dragImageRef.current = null;
    const drawing = drawRef.current;
    drawRef.current = null;
    if (drawing === null || draft === null) return;
    if (draft.kind === "rect" && (draft.box.w < 4 || draft.box.h < 4)) {
      setDraft(null);
      return;
    }
    if (draft.kind === "pen" && draft.points.length < 3) {
      setDraft(null);
      return;
    }
    setMarks((prev) => [...prev, draft]);
    setDraft(null);
  };
  (0, import_react6.useEffect)(() => {
    const canvas = inkRef.current;
    if (canvas === null) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(hostSize.width * ratio));
    canvas.height = Math.max(1, Math.floor(hostSize.height * ratio));
    canvas.style.width = `${hostSize.width}px`;
    canvas.style.height = `${hostSize.height}px`;
    const context = canvas.getContext("2d");
    if (context === null) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, hostSize.width, hostSize.height);
    const paint = (mark, color) => {
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.lineJoin = "round";
      context.lineCap = "round";
      if (mark.kind === "rect") {
        const topLeft = toScreen(mark.box.x, mark.box.y);
        context.strokeRect(topLeft.x, topLeft.y, mark.box.w * view.zoom, mark.box.h * view.zoom);
        return;
      }
      if (mark.points.length === 0) return;
      const head = mark.points[0];
      if (head === void 0) return;
      context.beginPath();
      const first = toScreen(head.x, head.y);
      context.moveTo(first.x, first.y);
      for (let index = 1; index < mark.points.length; index += 1) {
        const point = mark.points[index];
        if (point === void 0) continue;
        const screen = toScreen(point.x, point.y);
        context.lineTo(screen.x, screen.y);
      }
      context.stroke();
    };
    for (const mark of marks) paint(mark, "rgba(91, 140, 255, .95)");
    if (draft !== null) paint(draft, "rgba(255, 196, 0, .95)");
  }, [marks, draft, view, hostSize, toScreen]);
  const buildRequest = (0, import_react6.useCallback)(async () => {
    if (marks.length === 0) {
      flash("\u5148\u7528\u6846\u9009\u6216\u753B\u7B14\u5708\u51FA\u8981\u6539\u7684\u4F4D\u7F6E");
      return void 0;
    }
    const clamp = (value, max) => Math.min(max, Math.max(0, value));
    const groups = /* @__PURE__ */ new Map();
    for (const mark of marks) {
      const worldPoints = mark.kind === "rect" ? [
        { x: mark.box.x, y: mark.box.y },
        { x: mark.box.x + mark.box.w, y: mark.box.y + mark.box.h }
      ] : mark.points;
      const probe = mark.kind === "rect" ? { x: mark.box.x + mark.box.w / 2, y: mark.box.y + mark.box.h / 2 } : mark.points[0];
      if (probe === void 0) continue;
      const image = imageAt(probe);
      if (image === void 0) continue;
      const local = worldPoints.map((point) => ({
        x: clamp(point.x - image.x, image.width),
        y: clamp(point.y - image.y, image.height)
      }));
      const box = boundsOf(local);
      if (box.w < 2 || box.h < 2) continue;
      const group = groups.get(image.path) ?? { image, marks: [], locales: [] };
      group.marks.push(mark);
      group.locales.push(local);
      groups.set(image.path, group);
    }
    if (groups.size === 0) {
      flash("\u5708\u9009\u6CA1\u843D\u5728\u8FD9\u5F20\u56FE\u4E0A\uFF0C\u6216\u8303\u56F4\u592A\u5C0F");
      return void 0;
    }
    const blocks = [];
    for (const group of groups.values()) {
      const { image } = group;
      const exported = await exportMask(image, group.marks, group.locales);
      const lines = [];
      lines.push(`\u56FE\uFF1A${image.path}`);
      lines.push(`\u5C3A\u5BF8\uFF1A${Math.round(image.width)} \xD7 ${Math.round(image.height)}`);
      if (exported.mask !== void 0) {
        lines.push(`\u8499\u7248\u56FE\uFF1A${exported.mask}\uFF08\u900F\u660E\u5904 = \u5141\u8BB8\u91CD\u7ED8\uFF1B\u4F20\u7ED9 generate_image \u7684 mask \u53C2\u6570\uFF09`);
      } else {
        lines.push("\u8499\u7248\u56FE\uFF1A\u5BFC\u51FA\u5931\u8D25\uFF0C\u53EA\u80FD\u7528\u4E0B\u9762\u7684\u533A\u57DF\u5750\u6807\u63CF\u8FF0");
      }
      group.locales.forEach((points, index) => {
        const box = boundsOf(points);
        lines.push(
          `\u533A\u57DF${index + 1}\uFF1A\u50CF\u7D20 (x=${Math.round(box.x)}, y=${Math.round(box.y)}, w=${Math.round(box.w)}, h=${Math.round(box.h)})\uFF5C\u5F52\u4E00\u5316 (x=${round(box.x / image.width, 3)}, y=${round(box.y / image.height, 3)}, w=${round(box.w / image.width, 3)}, h=${round(box.h / image.height, 3)})`
        );
      });
      blocks.push(lines.join("\n"));
    }
    return ["\u3010\u6539\u56FE\u8BF7\u6C42\u3011", "", ...blocks, "", "\u8981\u6C42\uFF1A"].join("\n");
  }, [marks, imageAt, flash]);
  const emit = (0, import_react6.useCallback)(() => {
    if (busy) return;
    setBusy(true);
    void buildRequest().then((text) => {
      if (text === void 0) return;
      onRequestEdit(text);
      flash("\u5DF2\u586B\u5165\u5BF9\u8BDD\u6846");
    }).finally(() => setBusy(false));
  }, [busy, buildRequest, onRequestEdit, flash]);
  const empty = laidOut.length === 0;
  const selectedImage = laidOut.find((image) => image.path === selectedPath);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsg-wb", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsg-wb-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsg-wb-tools", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { "data-active": tool === "pan" ? "true" : "false", onClick: () => setTool("pan"), title: "\u6309\u56FE\u62D6\u52A8\u5355\u5F20\uFF1B\u6309\u7A7A\u767D\u62D6\u52A8\u5E73\u79FB\uFF08\u4E5F\u53EF\u6309\u4F4F Shift \u6216\u9F20\u6807\u4E2D\u952E\uFF09", children: "\u79FB\u52A8" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { "data-active": tool === "rect" ? "true" : "false", onClick: () => setTool("rect"), title: "\u62D6\u51FA\u77E9\u5F62\u9009\u533A", children: "\u6846\u9009" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { "data-active": tool === "pen" ? "true" : "false", onClick: () => setTool("pen"), title: "\u6309\u4F4F\u81EA\u7531\u5708\u753B", children: "\u753B\u7B14" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsg-wb-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "dshsg-wb-hint", children: [
          Math.round(view.zoom * 100),
          "% \xB7 ",
          laidOut.length,
          " \u5F20"
        ] }),
        laidOut.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => {
            setPlaced((prev) => arrange(prev, "row"));
            setLayout("free");
          }, title: "\u6C34\u5E73\u5E76\u6392", children: "\u6A2A\u6392" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => {
            setPlaced((prev) => arrange(prev, "column"));
            setLayout("free");
          }, title: "\u5782\u76F4\u5806\u53E0", children: "\u7AD6\u6392" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => {
            setPlaced((prev) => arrange(prev, "stack"));
            setLayout("free");
          }, title: "\u5DE6\u4E0A\u89D2\u5BF9\u9F50\u53E0\u5728\u4E00\u8D77\uFF1B\u9009\u4E2D\u540E\u8C03\u4F4E\u4E0D\u900F\u660E\u5EA6\u5373\u53EF\u900F\u770B\u4E0B\u4E00\u5F20", children: "\u91CD\u53E0" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => setMarks([]), disabled: marks.length === 0, children: "\u6E05\u9664\u5708\u9009" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { "data-tone": "primary", onClick: emit, disabled: busy, children: busy ? "\u6B63\u5728\u5BFC\u51FA\u2026" : "\u751F\u6210\u6539\u56FE\u8BF7\u6C42" }),
        onClear !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => {
          setMarks([]);
          onClear();
        }, disabled: empty, children: "\u6E05\u7A7A" })
      ] })
    ] }),
    selectedImage !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsg-wb-bar dshsg-wb-selbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "dshsg-wb-hint", children: [
        "\u9009\u4E2D\uFF1A",
        selectedImage.name
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("label", { className: "dshsg-wb-opacity", children: [
        "\u4E0D\u900F\u660E\u5EA6",
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          "input",
          {
            type: "range",
            min: 10,
            max: 100,
            value: Math.round(selectedImage.opacity * 100),
            onChange: (event) => {
              const value = Number(event.currentTarget.value) / 100;
              setPlaced((prev) => prev.map((image) => image.path === selectedImage.path ? { ...image, opacity: value } : image));
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("b", { children: [
          Math.round(selectedImage.opacity * 100),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          onClick: () => setPlaced((prev) => {
            const target = prev.find((image) => image.path === selectedImage.path);
            if (target === void 0) return prev;
            return [...prev.filter((image) => image.path !== target.path), target];
          }),
          title: "\u653E\u5230\u6700\u4E0A\u5C42\uFF0C\u65B9\u4FBF\u53E0\u5728\u53E6\u4E00\u5F20\u4E0A\u5BF9\u6BD4",
          children: "\u7F6E\u9876"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          onClick: () => setPlaced((prev) => {
            const target = prev.find((image) => image.path === selectedImage.path);
            if (target === void 0) return prev;
            return [target, ...prev.filter((image) => image.path !== target.path)];
          }),
          title: "\u653E\u5230\u6700\u4E0B\u5C42",
          children: "\u7F6E\u5E95"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => {
        setPlaced((prev) => prev.map((image) => image.path === selectedImage.path ? { ...image, opacity: 1 } : image));
        setSelectedPath(null);
      }, children: "\u53D6\u6D88\u9009\u4E2D" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
      "div",
      {
        className: "dshsg-wb-stage",
        ref: hostRef,
        "data-tool": tool,
        onWheel,
        onDragStart: (event) => event.preventDefault(),
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: onPointerUp,
        children: [
          empty && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "dshsg-wb-empty", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: "\u5DE5\u4F5C\u53F0" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { marginTop: 8 }, children: [
              "\u5728\u300C\u56FE\u7247\u5E93\u300D\u52FE\u9009\u56FE\u7247\u540E\u70B9\u300C\u653E\u5165\u5DE5\u4F5C\u53F0\u300D\uFF0C\u56FE\u7247\u4F1A\u843D\u5728\u8FD9\u91CC\u3002",
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("br", {}),
              "\u7528\u300C\u6846\u9009\u300D\u6216\u300C\u753B\u7B14\u300D\u5708\u51FA\u8981\u6539\u7684\u4F4D\u7F6E\uFF0C\u518D\u70B9\u300C\u751F\u6210\u6539\u56FE\u8BF7\u6C42\u300D\u3002"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "div",
            {
              className: "dshsg-wb-world",
              style: { transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` },
              children: laidOut.map((image) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "div",
                {
                  className: "dshsg-wb-image",
                  "data-selected": selectedPath === image.path ? "true" : "false",
                  style: {
                    left: image.x,
                    top: image.y,
                    width: image.width || 1,
                    height: image.height || 1,
                    opacity: image.opacity
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("img", { src: image.url, alt: image.name, draggable: false }),
                    onRemove !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                      "button",
                      {
                        className: "dshsg-wb-remove",
                        title: "\u4ECE\u5DE5\u4F5C\u53F0\u79FB\u9664",
                        onPointerDown: (event) => event.stopPropagation(),
                        onClick: (event) => {
                          event.stopPropagation();
                          onRemove(image.path);
                        },
                        children: "\u2715"
                      }
                    )
                  ]
                },
                image.path
              ))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("canvas", { className: "dshsg-wb-ink", ref: inkRef })
        ]
      }
    ),
    toast !== null && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "dshsg-toast", children: toast })
  ] });
}

// src/client/ui/LibraryView.tsx
var import_react8 = require("react");

// src/client/ui/import-images.ts
var IMPORT_ROUTE = "/plugins/dsh-session-gallery/import";
var MAX_FILE_BYTES = 32 * 1024 * 1024;
var MAX_FILES = 20;
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("\u8BFB\u53D6\u6587\u4EF6\u5931\u8D25"));
    reader.readAsDataURL(file);
  });
}
async function pickAndImport(sessionId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  const files = await new Promise((resolve) => {
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.click();
  });
  if (files.length === 0) return null;
  const tooBig = files.filter((file) => file.size > MAX_FILE_BYTES);
  const usable = files.filter((file) => file.size <= MAX_FILE_BYTES).slice(0, MAX_FILES);
  if (usable.length === 0) {
    return { saved: 0, failed: files.length, message: `\u6587\u4EF6\u8D85\u8FC7 ${MAX_FILE_BYTES / 1024 / 1024} MB\uFF0C\u672A\u5BFC\u5165` };
  }
  const payload = await Promise.all(usable.map(async (file) => ({
    name: file.name,
    mediaType: file.type,
    dataBase64: await toBase64(file)
  })));
  const response = await fetch(IMPORT_ROUTE, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, files: payload })
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { saved: 0, failed: files.length, message: `\u5BFC\u5165\u5931\u8D25\uFF1AHTTP ${response.status}\uFF08\u54CD\u5E94\u4E3A\u7A7A\uFF0C\u53EF\u80FD\u672A\u91CD\u542F\uFF09` };
  }
  if (!response.ok) {
    return { saved: 0, failed: files.length, message: `\u5BFC\u5165\u5931\u8D25\uFF1A${String(body.error ?? response.status)}` };
  }
  const saved = Array.isArray(body.files) ? body.files.length : 0;
  const failed = (Array.isArray(body.failed) ? body.failed.length : 0) + tooBig.length + (files.length - usable.length);
  const message = failed > 0 ? `\u5DF2\u5BFC\u5165 ${saved} \u5F20\uFF0C${failed} \u5F20\u5931\u8D25` : `\u5DF2\u5BFC\u5165 ${saved} \u5F20\u5230\u56FE\u7247\u5E93`;
  return { saved, failed, message };
}

// src/client/ui/GenLogPanel.tsx
var import_react7 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var LOGS_ROUTE = "/plugins/dsh-session-gallery/gen-logs";
function statusOf(record) {
  if (record.status === "completed") return { icon: "\u2713", tone: "ok", text: "\u6210\u529F" };
  if (record.status === "partial") return { icon: "!", tone: "warn", text: "\u90E8\u5206\u5931\u8D25" };
  if (record.status === "running") return { icon: "\u2026", tone: "muted", text: "\u8FDB\u884C\u4E2D" };
  return { icon: "\u2717", tone: "bad", text: "\u5931\u8D25" };
}
function formatTime(iso) {
  if (iso === void 0) return "";
  return iso.replace("T", " ").slice(5, 19);
}
function formatBytes2(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function shortError(record) {
  if (record.error !== void 0 && record.error !== "") return record.error;
  const first = record.failures?.[0];
  return first ?? "";
}
function GenLogPanel(props) {
  const { onClose, onFlash } = props;
  const [loading, setLoading] = (0, import_react7.useState)(true);
  const [records, setRecords] = (0, import_react7.useState)([]);
  const [stats, setStats] = (0, import_react7.useState)(
    { days: 0, bytes: 0, records: 0 }
  );
  const [onlyFailed, setOnlyFailed] = (0, import_react7.useState)(false);
  const [query, setQuery] = (0, import_react7.useState)("");
  const [selectedId, setSelectedId] = (0, import_react7.useState)(null);
  const [error, setError] = (0, import_react7.useState)(null);
  const load = (0, import_react7.useCallback)(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(LOGS_ROUTE, { credentials: "same-origin" });
      const payload = await response.json();
      if (!response.ok) {
        setError(String(payload.error ?? response.status));
        return;
      }
      setRecords(Array.isArray(payload.records) ? payload.records : []);
      setStats({
        days: payload.stats?.days ?? 0,
        bytes: payload.stats?.bytes ?? 0,
        records: payload.stats?.records ?? 0,
        ...typeof payload.stats?.dir === "string" ? { dir: payload.stats.dir } : {}
      });
      setError(null);
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);
  (0, import_react7.useEffect)(() => {
    void load();
  }, [load]);
  const filtered = (0, import_react7.useMemo)(() => {
    const keyword = query.trim().toLowerCase();
    return records.filter((record) => {
      if (onlyFailed && record.status !== "failed" && record.status !== "partial") return false;
      if (keyword === "") return true;
      const haystack = [
        record.request?.prompt ?? "",
        record.request?.model ?? "",
        record.error ?? "",
        ...record.failures ?? []
      ].join("\n").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [onlyFailed, query, records]);
  const selected = (0, import_react7.useMemo)(
    () => filtered.find((record) => record.id === selectedId) ?? filtered[0],
    [filtered, selectedId]
  );
  const clearAll = (0, import_react7.useCallback)(async () => {
    if (!window.confirm("\u6E05\u7A7A\u5168\u90E8\u51FA\u56FE\u65E5\u5FD7\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002")) return;
    try {
      const response = await fetch(LOGS_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const payload = await response.json();
      if (!response.ok) {
        onFlash(`\u6E05\u7A7A\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
        return;
      }
      onFlash(`\u5DF2\u6E05\u7A7A ${payload.removed ?? 0} \u4E2A\u65E5\u5FD7\u6587\u4EF6`);
      setSelectedId(null);
      void load();
    } catch (cause) {
      onFlash(`\u6E05\u7A7A\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }, [load, onFlash]);
  const copyJson = (0, import_react7.useCallback)((record) => {
    void navigator.clipboard.writeText(JSON.stringify(record, null, 2)).then(
      () => onFlash("\u5DF2\u590D\u5236\u8FD9\u6761\u4EFB\u52A1 JSON"),
      () => onFlash("\u590D\u5236\u5931\u8D25")
    );
  }, [onFlash]);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "dshsg-settings-back", onClick: onClose, children: "\u2190 \u8FD4\u56DE" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "dshsg-genlog-title", children: "\u51FA\u56FE\u65E5\u5FD7" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "dshsg-genlog-stats", children: [
        stats.records,
        " \u6761 \xB7 ",
        stats.days,
        " \u5929 \xB7 ",
        formatBytes2(stats.bytes)
      ] }),
      stats.dir !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          className: "dshsg-genlog-dir",
          title: `\u65E5\u5FD7\u76EE\u5F55\uFF08\u70B9\u51FB\u590D\u5236\uFF09\uFF1A${stats.dir}`,
          onClick: () => {
            void navigator.clipboard.writeText(stats.dir ?? "").then(
              () => onFlash("\u5DF2\u590D\u5236\u65E5\u5FD7\u76EE\u5F55\u8DEF\u5F84"),
              () => onFlash("\u590D\u5236\u5931\u8D25")
            );
          },
          children: stats.dir
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "dshsg-chip", onClick: () => {
        void load();
      }, children: "\u5237\u65B0" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "dshsg-chip", onClick: () => {
        void clearAll();
      }, children: "\u6E05\u7A7A" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-filter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          className: "dshsg-chip",
          "data-on": onlyFailed ? "true" : "false",
          onClick: () => setOnlyFailed((value) => !value),
          children: "\u4EC5\u5931\u8D25"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "input",
        {
          className: "dshsg-search",
          placeholder: "\u641C\u7D22 prompt / \u6A21\u578B / \u9519\u8BEF",
          value: query,
          onChange: (e) => {
            const value = e.currentTarget.value;
            setQuery(value);
          }
        }
      )
    ] }),
    loading && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-empty", children: "\u6B63\u5728\u8BFB\u53D6\u65E5\u5FD7\u2026" }),
    !loading && error !== null && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-empty", children: [
      "\u8BFB\u53D6\u5931\u8D25\uFF1A",
      error
    ] }),
    !loading && error === null && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-empty", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("strong", { children: "\u8FD8\u6CA1\u6709\u51FA\u56FE\u65E5\u5FD7" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "\u7528\u300C\u51FA\u56FE\u300D\u5DE5\u5177\u751F\u6210\u56FE\u7247\u540E\uFF0C\u8FD9\u91CC\u4F1A\u8BB0\u5F55\u6BCF\u6B21\u4EFB\u52A1\u7684\u5B8C\u6574\u8FC7\u7A0B\u3002" })
    ] }),
    filtered.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-body", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-list", children: filtered.map((record) => {
        const status = statusOf(record);
        const params = [record.request?.size, record.request?.resolution, record.request?.quality].filter((value) => typeof value === "string" && value !== "");
        return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "button",
          {
            className: "dshsg-genlog-row",
            "data-active": selected?.id === record.id ? "true" : "false",
            onClick: () => setSelectedId(record.id),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `dshsg-genlog-icon dshsg-tone-${status.tone}`, children: status.icon }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "dshsg-genlog-row-main", children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "dshsg-genlog-row-title", children: [
                  formatTime(record.startedAt),
                  " \xB7 ",
                  record.request?.model ?? "?",
                  params.length > 0 ? ` \xB7 ${params.join(" / ")}` : ""
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: "dshsg-genlog-row-sub", children: [
                  status.text,
                  record.elapsedMs !== void 0 ? ` \xB7 ${(record.elapsedMs / 1e3).toFixed(1)}s` : "",
                  record.result?.costUsd !== void 0 ? ` \xB7 $${record.result.costUsd.toFixed(4)}` : "",
                  shortError(record) !== "" ? ` \xB7 ${shortError(record).slice(0, 60)}` : ""
                ] })
              ] })
            ]
          },
          record.id
        );
      }) }),
      selected !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-detail", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-detail-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("b", { children: statusOf(selected).text }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: "dshsg-chip", onClick: () => copyJson(selected), children: "\u590D\u5236 JSON" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-kv", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u5F00\u59CB" }),
            formatTime(selected.startedAt)
          ] }),
          selected.elapsedMs !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u8017\u65F6" }),
            (selected.elapsedMs / 1e3).toFixed(1),
            "s"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u6A21\u578B" }),
            selected.request?.model ?? "-"
          ] }),
          selected.request?.size !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u6BD4\u4F8B" }),
            selected.request.size
          ] }),
          selected.request?.resolution !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u5206\u8FA8\u7387" }),
            selected.request.resolution
          ] }),
          selected.request?.quality !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u8D28\u91CF" }),
            selected.request.quality
          ] }),
          selected.request?.n !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u5F20\u6570" }),
            selected.request.n
          ] }),
          selected.request?.protocol !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u534F\u8BAE" }),
            selected.request.protocol
          ] }),
          selected.request?.baseURL !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u4E2D\u8F6C\u7AD9" }),
            selected.request.baseURL
          ] }),
          selected.result?.costUsd !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u6210\u672C" }),
            "$",
            selected.result.costUsd.toFixed(4)
          ] }),
          selected.machine !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u673A\u5668" }),
            selected.machine
          ] }),
          selected.source !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u6765\u6E90" }),
            selected.source === "sidecar" ? "\u5386\u53F2\u53CD\u63A8\uFF08sidecar\uFF09" : selected.source === "apimart" ? "\u5386\u53F2\u53CD\u63A8\uFF08\u4EFB\u52A1\u63A5\u53E3\uFF09" : "\u8FD0\u884C\u8BB0\u5F55"
          ] }),
          selected.sessionId !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("i", { children: "\u4F1A\u8BDD" }),
            selected.sessionId.slice(0, 18),
            "\u2026"
          ] })
        ] }),
        selected.request?.prompt !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-block-title", children: "\u63D0\u793A\u8BCD" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-prompt", children: selected.request.prompt })
        ] }),
        selected.request?.references !== void 0 && selected.request.references.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block-title", children: [
            "\u53C2\u8003\u56FE\uFF08",
            selected.request.references.length,
            " \u5F20\uFF09"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-list-inline", children: selected.request.references.map((ref, index) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            ref.name,
            "\uFF08",
            formatBytes2(ref.bytes),
            "\uFF09"
          ] }, `${ref.name}-${index}`)) })
        ] }),
        selected.error !== void 0 && selected.error !== "" && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-block-title", children: "\u9519\u8BEF" }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-error", children: selected.error })
        ] }),
        selected.result?.files !== void 0 && selected.result.files.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block-title", children: [
            "\u4EA7\u7269\uFF08",
            selected.result.files.length,
            " \u5F20\uFF09"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-list-inline", children: selected.result.files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
            file.hash,
            " \xB7 ",
            file.width,
            "\xD7",
            file.height,
            " \xB7 ",
            formatBytes2(file.bytes)
          ] }, file.hash)) })
        ] }),
        (selected.children ?? []).map((child) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-block-title", children: [
            "\u5B50\u4EFB\u52A1 #",
            child.index + 1,
            " \xB7 ",
            child.status,
            child.taskId !== void 0 ? ` \xB7 ${child.taskId}` : ""
          ] }),
          child.submitHttpStatus !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-mono", children: [
            "\u63D0\u4EA4 HTTP ",
            child.submitHttpStatus
          ] }),
          child.submitRaw !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-mono", children: [
            "\u63D0\u4EA4\uFF1A",
            child.submitRaw
          ] }),
          child.failRaw !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "dshsg-genlog-mono", children: [
            "\u5931\u8D25\u54CD\u5E94\uFF1A",
            child.failRaw
          ] }),
          child.polls !== void 0 && child.polls.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-mono", children: child.polls.map((poll, pollIndex) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
            formatTime(poll.at),
            " \xB7 ",
            poll.status,
            poll.progress !== void 0 ? ` ${poll.progress}%` : "",
            (poll.repeat ?? 1) > 1 ? ` \xD7${poll.repeat}` : ""
          ] }, pollIndex)) }),
          child.error !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "dshsg-genlog-error", children: child.error })
        ] }, child.index))
      ] })
    ] })
  ] });
}

// src/client/data/favorites.ts
var KEY = "dshsg:favorites:v2";
var LEGACY_KEY = "dshsg:favorites:v1";
var EVENT = "dshsg:favorites-changed";
function favoriteKeyOf(item) {
  if (typeof item.hash === "string" && item.hash !== "") return `hash:${item.hash}`;
  if (typeof item.attachmentId === "string" && item.attachmentId !== "") return `att:${item.attachmentId}`;
  return void 0;
}
function loadFavorites() {
  const set = /* @__PURE__ */ new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const value of parsed) {
          if (typeof value === "string") set.add(value);
        }
      }
      return set;
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        for (const value of parsed) {
          if (typeof value === "string" && value !== "") set.add(`att:${value}`);
        }
      }
      localStorage.setItem(KEY, JSON.stringify([...set]));
    }
  } catch {
  }
  return set;
}
function saveFavorites(set) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
  }
}
function toggleFavorite(set, key) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  saveFavorites(next);
  return next;
}
function subscribeFavorites(handler) {
  const listener = () => handler();
  window.addEventListener(EVENT, listener);
  const storageListener = (event) => {
    if (event.key === KEY) handler();
  };
  window.addEventListener("storage", storageListener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", storageListener);
  };
}

// src/client/ui/LibraryView.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var SCAN_ROUTE = "/plugins/dsh-session-gallery/scan";
var IMAGE_ROUTE2 = "/plugins/dsh-session-gallery/image";
var DELETE_ROUTE = "/plugins/dsh-session-gallery/delete";
var REVEAL_ROUTE = "/plugins/dsh-session-gallery/reveal";
var ORIGIN_OPTIONS = [
  { value: "user", label: "\u7528\u6237\u53D1\u7684" },
  { value: "tool", label: "\u5DE5\u5177\u4EA7\u7269" },
  { value: "script", label: "\u811A\u672C\u4EA7\u7269" },
  { value: "manual", label: "\u624B\u52A8\u5BFC\u5165" },
  { value: "library", label: "\u7D20\u6750\u5E93" },
  { value: "unknown", label: "\u672A\u77E5\uFF08\u65E7\u56FE\uFF09" }
];
function originOf(item) {
  const origin = item.meta?.origin;
  if (origin === "site" || origin === "folder") return "library";
  if (origin === "user" || origin === "tool" || origin === "script" || origin === "manual") return origin;
  return "unknown";
}
var DAY_MS = 24 * 60 * 60 * 1e3;
function timeOf(item) {
  const created = item.meta?.createdAt;
  if (typeof created === "string") {
    const parsed = Date.parse(created);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return item.mtime;
}
function startOfDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
function monthOf(time) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function matchesDate(item, filter) {
  if (filter === "all") return true;
  const time = timeOf(item);
  if (!Number.isFinite(time) || time <= 0) return false;
  const today = startOfDay(Date.now());
  if (filter === "today") return time >= today;
  if (filter === "7d") return time >= today - 6 * DAY_MS;
  if (filter === "30d") return time >= today - 29 * DAY_MS;
  const wanted = filter.slice("month:".length);
  return monthOf(time) === wanted;
}
function imageUrlOf(item) {
  return `${IMAGE_ROUTE2}?path=${encodeURIComponent(item.path)}`;
}
function groupOf(item) {
  const parts = item.rel.split(/[\\/]/);
  if (parts.length <= 1) return "\uFF08\u6839\u76EE\u5F55\uFF09";
  return parts[0] ?? "\uFF08\u6839\u76EE\u5F55\uFF09";
}
function numberOf2(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function stringOf(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}
function LibraryView(props) {
  const { inputActions, onFlash, onPutToWorkbench, sizeLevel, onSizeLevelChange, sessionId } = props;
  const cols = 7 - sizeLevel;
  const [items, setItems] = (0, import_react8.useState)([]);
  const [loading, setLoading] = (0, import_react8.useState)(true);
  const [error, setError] = (0, import_react8.useState)(null);
  const [root, setRoot] = (0, import_react8.useState)("");
  const [truncated, setTruncated] = (0, import_react8.useState)(false);
  const [group, setGroup] = (0, import_react8.useState)("\u5168\u90E8");
  const [query, setQuery] = (0, import_react8.useState)("");
  const [originFilter, setOriginFilter] = (0, import_react8.useState)(() => /* @__PURE__ */ new Set());
  const [dateFilter, setDateFilter] = (0, import_react8.useState)("all");
  const [onlyFavorite, setOnlyFavorite] = (0, import_react8.useState)(false);
  const [favorites, setFavorites] = (0, import_react8.useState)(() => loadFavorites());
  (0, import_react8.useEffect)(() => subscribeFavorites(() => setFavorites(loadFavorites())), []);
  const isFavoriteOf = (0, import_react8.useCallback)((item) => {
    const key = favoriteKeyOf({ hash: typeof item.hash === "string" ? item.hash : void 0 });
    return key !== void 0 && favorites.has(key);
  }, [favorites]);
  const toggleFavoriteOf = (0, import_react8.useCallback)((item) => {
    const key = favoriteKeyOf({ hash: typeof item.hash === "string" ? item.hash : void 0 });
    if (key === void 0) {
      onFlash("\u8FD9\u5F20\u56FE\u6CA1\u6709\u5185\u5BB9\u54C8\u5E0C\uFF0C\u6682\u4E0D\u652F\u6301\u6536\u85CF\uFF08\u65E7\u56FE\uFF09");
      return;
    }
    setFavorites(toggleFavorite(favorites, key));
  }, [favorites, onFlash]);
  const [selected, setSelected] = (0, import_react8.useState)(() => /* @__PURE__ */ new Set());
  const [viewerIndex, setViewerIndex] = (0, import_react8.useState)(null);
  const [compareItems, setCompareItems] = (0, import_react8.useState)(null);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [deleteOpen, setDeleteOpen] = (0, import_react8.useState)(false);
  const [logsOpen, setLogsOpen] = (0, import_react8.useState)(false);
  const [ctxMenu, setCtxMenu] = (0, import_react8.useState)(null);
  const [paneIndex, setPaneIndex] = (0, import_react8.useState)(null);
  const [paneUrl, setPaneUrl] = (0, import_react8.useState)(void 0);
  const [paneZoom, setPaneZoom] = (0, import_react8.useState)(1);
  const [paneOffset, setPaneOffset] = (0, import_react8.useState)({ x: 0, y: 0 });
  const paneDragRef = (0, import_react8.useRef)(null);
  const [paneDragging, setPaneDragging] = (0, import_react8.useState)(false);
  const paneViewRef = (0, import_react8.useRef)({ zoom: 1, offset: { x: 0, y: 0 } });
  paneViewRef.current = { zoom: paneZoom, offset: paneOffset };
  const scan = (0, import_react8.useCallback)(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(SCAN_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(String(payload.error ?? response.status));
        return;
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setRoot(typeof payload.settings?.root === "string" ? payload.settings.root : "");
      setTruncated(payload.truncated === true);
      setError(null);
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);
  (0, import_react8.useEffect)(() => {
    void scan();
  }, [scan]);
  (0, import_react8.useEffect)(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void scan(true);
    }, 5e3);
    return () => window.clearInterval(timer);
  }, [scan]);
  const deduped = (0, import_react8.useMemo)(() => {
    const byHash = /* @__PURE__ */ new Map();
    const noHash = [];
    for (const item of items) {
      const hash = typeof item.hash === "string" ? item.hash : "";
      if (hash === "") {
        noHash.push(item);
        continue;
      }
      const prev = byHash.get(hash);
      if (prev === void 0) {
        byHash.set(hash, item);
        continue;
      }
      const prevPreferred = prev.path.includes("\u4F1A\u8BDD\u5BFC\u5165");
      const nowPreferred = item.path.includes("\u4F1A\u8BDD\u5BFC\u5165");
      if (!prevPreferred && nowPreferred) byHash.set(hash, item);
    }
    return [...noHash, ...byHash.values()];
  }, [items]);
  const groups = (0, import_react8.useMemo)(() => {
    const set = /* @__PURE__ */ new Set();
    for (const item of deduped) set.add(groupOf(item));
    return ["\u5168\u90E8", ...[...set].sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, [deduped]);
  const months = (0, import_react8.useMemo)(() => {
    const counts = /* @__PURE__ */ new Map();
    for (const item of deduped) {
      const time = timeOf(item);
      if (!Number.isFinite(time) || time <= 0) continue;
      const key = monthOf(time);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [deduped]);
  const filtered = (0, import_react8.useMemo)(() => {
    const keyword = query.trim().toLowerCase();
    return deduped.filter((item) => {
      if (group !== "\u5168\u90E8" && groupOf(item) !== group) return false;
      if (originFilter.size > 0 && !originFilter.has(originOf(item))) return false;
      if (!matchesDate(item, dateFilter)) return false;
      if (onlyFavorite && !isFavoriteOf(item)) return false;
      if (keyword === "") return true;
      const prompt = stringOf(item.meta?.prompt) ?? "";
      const model = stringOf(item.meta?.model) ?? "";
      return item.name.toLowerCase().includes(keyword) || prompt.toLowerCase().includes(keyword) || model.toLowerCase().includes(keyword);
    });
  }, [deduped, group, originFilter, dateFilter, onlyFavorite, isFavoriteOf, query]);
  const favoriteCount = (0, import_react8.useMemo)(
    () => deduped.filter((item) => isFavoriteOf(item)).length,
    [deduped, isFavoriteOf]
  );
  const viewerItems = (0, import_react8.useMemo)(
    () => filtered.map((item) => ({
      id: item.path,
      path: item.path,
      name: item.name,
      width: numberOf2(item.meta?.width),
      height: numberOf2(item.meta?.height),
      bytes: item.bytes,
      time: item.mtime,
      prompt: stringOf(item.meta?.prompt),
      mediaType: stringOf(item.meta?.mediaType),
      meta: item.meta
    })),
    [filtered]
  );
  const resolveViewerUrl = (0, import_react8.useCallback)(
    (item) => {
      const found = filtered.find((x) => x.path === item.id) ?? filtered[0];
      return Promise.resolve(found === void 0 ? "" : imageUrlOf(found));
    },
    [filtered]
  );
  const viewerItemsRef = (0, import_react8.useRef)(viewerItems);
  viewerItemsRef.current = viewerItems;
  const resolveViewerRef = (0, import_react8.useRef)(resolveViewerUrl);
  resolveViewerRef.current = resolveViewerUrl;
  (0, import_react8.useEffect)(() => {
    if (paneIndex === null) {
      setPaneUrl(void 0);
      return;
    }
    const target = viewerItemsRef.current[paneIndex];
    if (target === void 0) {
      setPaneUrl(void 0);
      return;
    }
    setPaneZoom(1);
    setPaneOffset({ x: 0, y: 0 });
    let alive = true;
    resolveViewerRef.current(target).then((value) => {
      if (alive) setPaneUrl(value);
    }).catch(() => {
      if (alive) setPaneUrl(void 0);
    });
    return () => {
      alive = false;
    };
  }, [paneIndex]);
  const toggleSelect = (0, import_react8.useCallback)((path) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);
  const putIntoDialog = (0, import_react8.useCallback)(() => {
    if (selected.size === 0 || busy) return;
    const actions = inputActions;
    if (actions === void 0) {
      onFlash("\u8F93\u5165\u6846\u4E0D\u53EF\u7528\uFF08\u6CA1\u6709 inputActions\uFF09");
      return;
    }
    const paths = [...selected];
    const text = paths.join("\n");
    let wrote = false;
    try {
      wrote = actions.insertText(text, actions.captureInsertion());
    } catch {
      wrote = false;
    }
    if (!wrote) {
      try {
        actions.setDraft(text);
        wrote = true;
      } catch {
        wrote = false;
      }
    }
    onFlash(wrote ? `\u5DF2\u628A ${paths.length} \u6761\u8DEF\u5F84\u5199\u5165\u8F93\u5165\u6846` : "\u5199\u5165\u8F93\u5165\u6846\u5931\u8D25");
    setSelected(/* @__PURE__ */ new Set());
  }, [busy, inputActions, onFlash, selected]);
  const selectedCount = selected.size;
  const libraryItems = filtered.filter((item) => selected.has(item.path));
  const putPathToDialog = (0, import_react8.useCallback)((item) => {
    const actions = inputActions;
    if (actions === void 0) {
      onFlash("\u8F93\u5165\u6846\u4E0D\u53EF\u7528\uFF08\u6CA1\u6709 inputActions\uFF09");
      return false;
    }
    const path = item.path;
    if (path === void 0 || path === "") {
      onFlash("\u8FD9\u5F20\u56FE\u6CA1\u6709\u78C1\u76D8\u8DEF\u5F84");
      return false;
    }
    let wrote = false;
    try {
      wrote = actions.insertText(path, actions.captureInsertion());
    } catch {
      wrote = false;
    }
    if (!wrote) {
      try {
        actions.setDraft(path);
        wrote = true;
      } catch {
        wrote = false;
      }
    }
    onFlash(wrote ? "\u5DF2\u628A\u56FE\u7247\u8DEF\u5F84\u5199\u5165\u8F93\u5165\u6846" : "\u5199\u5165\u8F93\u5165\u6846\u5931\u8D25");
    return wrote;
  }, [inputActions, onFlash]);
  const revealItem = (0, import_react8.useCallback)((item) => {
    const path = item.path;
    if (path === void 0 || path === "") {
      onFlash("\u8FD9\u5F20\u56FE\u6CA1\u6709\u78C1\u76D8\u8DEF\u5F84");
      return;
    }
    void (async () => {
      try {
        const response = await fetch(REVEAL_ROUTE, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path })
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          let detail = "";
          try {
            detail = String(JSON.parse(text).error ?? "");
          } catch {
            detail = text.slice(0, 80);
          }
          onFlash(`\u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25\uFF1A${detail || `HTTP ${response.status}`}`);
          return;
        }
        const payload = await response.json();
        if (payload.ok === false) {
          onFlash(`\u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25\uFF1A${String(payload.detail ?? "\u8D44\u6E90\u7BA1\u7406\u5668\u6CA1\u6709\u542F\u52A8")}`);
          return;
        }
        onFlash(typeof payload.detail === "string" && payload.detail !== "" ? `\u5DF2\u8BF7\u6C42\u8D44\u6E90\u7BA1\u7406\u5668\uFF08${payload.detail}\uFF09` : "\u5DF2\u5728\u8D44\u6E90\u7BA1\u7406\u5668\u4E2D\u5B9A\u4F4D");
      } catch (cause) {
        onFlash(`\u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
      }
    })();
  }, [onFlash]);
  const runDelete = (0, import_react8.useCallback)(async (permanent) => {
    if (selected.size === 0 || busy) return;
    setBusy(true);
    try {
      const response = await fetch(DELETE_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paths: [...selected], permanent })
      });
      const text = await response.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        onFlash(`\u5220\u9664\u5931\u8D25\uFF1AHTTP ${response.status}\uFF0C\u54CD\u5E94\u4E3A\u7A7A\uFF08\u591A\u534A\u662F\u5BBF\u4E3B\u4FA7\u6CA1\u6709\u8FD9\u6761\u8DEF\u7531\uFF0C\u8BF7\u91CD\u542F DSH\uFF09`);
        return;
      }
      if (!response.ok) {
        onFlash(`\u5220\u9664\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
        return;
      }
      const ok = typeof payload.deleted === "number" ? payload.deleted : 0;
      const failed = payload.failed?.length ?? 0;
      const suffix = failed > 0 ? `\uFF0C${failed} \u5F20\u5931\u8D25` : "";
      onFlash(payload.mode === "permanent" ? `\u5DF2\u6C38\u4E45\u5220\u9664 ${ok} \u5F20${suffix}` : payload.mode === "recycle-bin" ? `\u5DF2\u79FB\u5165 Windows \u56DE\u6536\u7AD9 ${ok} \u5F20${suffix}` : `\u5DF2\u79FB\u5230\u63D2\u4EF6\u56DE\u6536\u7AD9 ${ok} \u5F20${suffix}`);
      setSelected(/* @__PURE__ */ new Set());
      setDeleteOpen(false);
      void scan();
    } catch (cause) {
      onFlash(`\u5220\u9664\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setBusy(false);
    }
  }, [busy, onFlash, scan, selected]);
  const deleteOne = (0, import_react8.useCallback)(async (path, permanent = false) => {
    try {
      const response = await fetch(DELETE_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paths: [path], permanent })
      });
      const text = await response.text();
      let payload = {};
      try {
        payload = JSON.parse(text);
      } catch {
        onFlash(`\u5220\u9664\u5931\u8D25\uFF1AHTTP ${response.status}\uFF0C\u54CD\u5E94\u4E3A\u7A7A`);
        return;
      }
      if (!response.ok) {
        onFlash(`\u5220\u9664\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
        return;
      }
      const ok = typeof payload.deleted === "number" ? payload.deleted : 0;
      if (ok > 0) {
        onFlash(payload.mode === "recycle-bin" ? "\u5DF2\u79FB\u5165 Windows \u56DE\u6536\u7AD9" : "\u5DF2\u79FB\u5230\u63D2\u4EF6\u56DE\u6536\u7AD9");
        setViewerIndex(null);
        void scan();
      } else {
        onFlash("\u5220\u9664\u5931\u8D25\uFF1A\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u4E0D\u5728\u56FE\u7247\u5E93\u5185");
      }
    } catch (cause) {
      onFlash(`\u5220\u9664\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }, [onFlash, scan]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshsg-lib", children: logsOpen ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(GenLogPanel, { onClose: () => setLogsOpen(false), onFlash }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-toolbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "select",
        {
          className: "dshsg-select",
          value: group,
          onChange: (e) => setGroup(e.currentTarget.value),
          children: groups.map((name) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: name, children: name }, name))
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "select",
        {
          className: "dshsg-select",
          title: "\u6309\u65F6\u95F4\u7B5B\u9009",
          value: dateFilter,
          onChange: (e) => setDateFilter(e.currentTarget.value),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "all", children: "\u5168\u90E8\u65F6\u95F4" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "today", children: "\u4ECA\u5929" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "7d", children: "\u8FD1 7 \u5929" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("option", { value: "30d", children: "\u8FD1 30 \u5929" }),
            months.map(([key, count]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("option", { value: `month:${key}`, children: [
              key.replace("-", " \u5E74 "),
              " \u6708\uFF08",
              count,
              "\uFF09"
            ] }, key))
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "input",
        {
          className: "dshsg-search",
          type: "search",
          placeholder: "\u641C\u7D22\u6587\u4EF6\u540D / Prompt / \u6A21\u578B",
          value: query,
          onChange: (e) => setQuery(e.currentTarget.value)
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "dshsg-chip", onClick: () => {
        void scan();
      }, title: "\u91CD\u65B0\u626B\u63CF", children: "\u5237\u65B0" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
        "button",
        {
          className: "dshsg-chip",
          "data-on": onlyFavorite ? "true" : "false",
          title: "\u53EA\u770B\u6536\u85CF\uFF08\u2665\uFF09",
          onClick: () => setOnlyFavorite((value) => !value),
          children: [
            "\u2665 \u6536\u85CF",
            favoriteCount > 0 ? ` ${favoriteCount}` : ""
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-chip",
          title: "\u67E5\u770B\u6BCF\u6B21\u51FA\u56FE\u4EFB\u52A1\u7684\u5B8C\u6574\u65E5\u5FD7\uFF08\u6210\u529F\u5931\u8D25\u90FD\u8BB0\uFF09",
          onClick: () => setLogsOpen(true),
          children: "\u51FA\u56FE\u65E5\u5FD7"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-chip",
          title: "\u5BFC\u5165\u672C\u5730\u56FE\u7247\u5230\u56FE\u7247\u5E93\uFF08\u5F52\u5230\u5F53\u524D\u4F1A\u8BDD\uFF09",
          onClick: () => {
            void (async () => {
              try {
                const result = await pickAndImport(sessionId ?? "");
                if (result === null) return;
                onFlash(result.message);
                if (result.saved > 0) void scan();
              } catch (cause) {
                onFlash(`\u5BFC\u5165\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
              }
            })();
          },
          children: "\u5BFC\u5165"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "dshsg-zoom", title: "\u7F29\u7565\u56FE\u5927\u5C0F\uFF08\u5411\u53F3\u62D6 = \u66F4\u5927\uFF09", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u5C0F" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "input",
          {
            type: "range",
            min: 1,
            max: 6,
            step: 1,
            value: sizeLevel,
            onChange: (e) => onSizeLevelChange(Number(e.currentTarget.value))
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u5927" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-origin-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dshsg-origin-bar-label", children: "\u6765\u6E90" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-chip",
          "data-on": originFilter.size === 0 ? "true" : "false",
          title: "\u4E0D\u6309\u6765\u6E90\u7B5B\u9009",
          onClick: () => setOriginFilter(/* @__PURE__ */ new Set()),
          children: "\u5168\u90E8"
        }
      ),
      ORIGIN_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-chip",
          "data-on": originFilter.has(option.value) ? "true" : "false",
          title: `\u53EA\u770B\u300C${option.label}\u300D\uFF0C\u53EF\u4E0E\u5176\u5B83\u6863\u4E00\u8D77\u9009`,
          onClick: () => {
            setOriginFilter((prev) => {
              const next = new Set(prev);
              if (next.has(option.value)) next.delete(option.value);
              else next.add(option.value);
              return next;
            });
          },
          children: option.label
        },
        option.value
      ))
    ] }),
    selectedCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-actionbar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "dshsg-actionbar-count", children: [
        "\u5DF2\u9009 ",
        selectedCount,
        " \u5F20"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "dshsg-action", disabled: busy, onClick: putIntoDialog, children: "\u653E\u5165\u5BF9\u8BDD" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-action",
          onClick: () => {
            onPutToWorkbench(libraryItems.map((item) => item.path));
            setSelected(/* @__PURE__ */ new Set());
          },
          children: "\u653E\u5165\u5DE5\u4F5C\u53F0"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-action",
          disabled: selectedCount < 2,
          title: selectedCount < 2 ? "\u81F3\u5C11\u9009 2 \u5F20\u624D\u80FD\u5BF9\u6BD4" : selectedCount > 4 ? "\u6700\u591A\u5BF9\u6BD4 4 \u5F20\uFF0C\u4F1A\u53D6\u524D 4 \u5F20" : "\u628A\u9009\u4E2D\u7684\u56FE\u5E76\u6392\u5BF9\u6BD4\uFF08\u80FD\u770B\u53C2\u6570\u5BF9\u7167\uFF09",
          onClick: () => {
            const picked = viewerItems.filter((item) => selected.has(item.id)).slice(0, 4);
            if (picked.length < 2) {
              onFlash("\u81F3\u5C11\u9009 2 \u5F20\u624D\u80FD\u5BF9\u6BD4");
              return;
            }
            if (selectedCount > 4) onFlash(`\u6700\u591A\u5BF9\u6BD4 4 \u5F20\uFF0C\u5DF2\u53D6\u524D ${picked.length} \u5F20`);
            setCompareItems(picked);
          },
          children: "\u5E76\u6392\u5BF9\u6BD4"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "dshsg-action dshsg-action-danger",
          disabled: busy,
          onClick: () => setDeleteOpen(true),
          title: "\u5220\u9664\u9009\u4E2D\u7684\u56FE\u7247\uFF08\u9ED8\u8BA4\u79FB\u5230\u56DE\u6536\u7AD9\uFF09",
          children: "\u5220\u9664"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { className: "dshsg-action dshsg-action-ghost", onClick: () => setSelected(/* @__PURE__ */ new Set()), children: "\u6E05\u7A7A" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-scroll", children: [
      loading && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshsg-empty", children: "\u6B63\u5728\u626B\u63CF\u56FE\u7247\u5E93\u2026" }),
      !loading && error !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-empty", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "\u626B\u63CF\u5931\u8D25" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: error })
      ] }),
      !loading && error === null && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-lib-meta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: root === "" ? "\u672A\u914D\u7F6E\u56FE\u7247\u5E93" : root }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
            filtered.length === items.length ? `\u5171 ${items.length} \u5F20` : `\u7B5B\u9009\u540E ${filtered.length} / \u5171 ${items.length} \u5F20`,
            truncated ? "\uFF08\u5DF2\u8FBE\u4E0A\u9650\uFF09" : ""
          ] })
        ] }),
        filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-empty", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: items.length === 0 ? "\u56FE\u7247\u5E93\u8FD8\u662F\u7A7A\u7684" : "\u6CA1\u6709\u5339\u914D\u7684\u56FE" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: items.length === 0 ? "\u5728\u8BBE\u7F6E\u91CC\u6307\u5B9A\u56FE\u7247\u5E93\u76EE\u5F55\uFF0C\u6216\u8BA9\u51FA\u56FE\u811A\u672C\u628A\u56FE\u5199\u5230\u8FD9\u91CC\u3002" : "\u6362\u4E2A\u5206\u7EC4\u6216\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002" })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "div",
          {
            className: "dshsg-grid",
            style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` },
            children: filtered.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
              "button",
              {
                className: "dshsg-card",
                "data-selected": selected.has(item.path) ? "true" : "false",
                title: `${item.name}
${item.path}
\u53F3\u952E\u66F4\u591A\u64CD\u4F5C\uFF1B\u53EF\u76F4\u63A5\u62D6\u8FDB\u8F93\u5165\u6846`,
                onClick: () => setViewerIndex(i),
                onMouseDown: (event) => {
                  if (event.button === 1) event.preventDefault();
                },
                onAuxClick: (event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    setPaneIndex(i);
                  }
                },
                onContextMenu: (event) => {
                  event.preventDefault();
                  setCtxMenu({ x: event.clientX, y: event.clientY, item });
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "img",
                    {
                      src: imageUrlOf(item),
                      alt: "",
                      loading: "lazy",
                      draggable: true,
                      onDragStart: (event) => {
                        event.dataTransfer.setData("text/plain", item.path);
                        event.dataTransfer.effectAllowed = "copy";
                      }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "span",
                    {
                      className: "dshsg-check",
                      "data-checked": selected.has(item.path) ? "true" : "false",
                      onClick: (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        toggleSelect(item.path);
                      },
                      children: selected.has(item.path) ? "\u2713" : ""
                    }
                  ),
                  isFavoriteOf(item) && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dshsg-fav-mark", title: "\u5DF2\u6536\u85CF", children: "\u2665" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "dshsg-badge", children: [
                    originLabel(item.meta?.origin),
                    " \xB7 ",
                    groupOf(item)
                  ] })
                ]
              },
              item.path
            ))
          }
        )
      ] })
    ] }),
    viewerIndex !== null && viewerIndex < viewerItems.length && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      GalleryLightbox,
      {
        items: viewerItems,
        index: viewerIndex,
        resolveUrl: resolveViewerUrl,
        favorites,
        favoriteOf: (viewerItem) => {
          const found = filtered.find((candidate) => candidate.path === viewerItem.id);
          return found === void 0 ? false : isFavoriteOf(found);
        },
        onToggleFavorite: (viewerItemId) => {
          const found = filtered.find((candidate) => candidate.path === viewerItemId);
          if (found !== void 0) toggleFavoriteOf(found);
        },
        onClose: () => setViewerIndex(null),
        onIndexChange: setViewerIndex,
        onCopy: (url) => {
          void navigator.clipboard.writeText(url);
        },
        onPutToDialog: (item) => {
          if (putPathToDialog(item)) setViewerIndex(null);
        },
        onReveal: revealItem,
        onPutToWorkbench: (item) => {
          onPutToWorkbench([item.id]);
          setViewerIndex(null);
        },
        onDelete: (item, permanent) => {
          void deleteOne(item.path ?? item.id, permanent);
        },
        onCompare: (picked) => {
          setViewerIndex(null);
          setCompareItems(picked);
        }
      }
    ),
    compareItems !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      CompareView,
      {
        items: compareItems,
        resolveUrl: resolveViewerUrl,
        onClose: () => setCompareItems(null)
      }
    ),
    deleteOpen && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ConfirmDelete,
      {
        names: libraryItems.map((item) => item.name),
        onCancel: () => setDeleteOpen(false),
        onConfirm: (permanent) => {
          void runDelete(permanent);
        }
      }
    ),
    ctxMenu !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
      ImageContextMenu,
      {
        x: ctxMenu.x,
        y: ctxMenu.y,
        onClose: () => setCtxMenu(null),
        items: [
          {
            label: "\u67E5\u770B\u5927\u56FE",
            onSelect: () => {
              const index = filtered.findIndex((entry) => entry.path === ctxMenu.item.path);
              if (index >= 0) setViewerIndex(index);
            }
          },
          {
            label: "\u653E\u5165\u5BF9\u8BDD",
            onSelect: () => {
              const asItem = {
                id: ctxMenu.item.path,
                path: ctxMenu.item.path,
                name: ctxMenu.item.name
              };
              putPathToDialog(asItem);
            }
          },
          {
            label: "\u653E\u5165\u5DE5\u4F5C\u53F0",
            onSelect: () => {
              onPutToWorkbench([ctxMenu.item.path]);
            }
          },
          {
            label: isFavoriteOf(ctxMenu.item) ? "\u53D6\u6D88\u6536\u85CF" : "\u6536\u85CF",
            onSelect: () => {
              toggleFavoriteOf(ctxMenu.item);
            }
          },
          {
            label: "\u6253\u5F00\u6587\u4EF6\u5939",
            onSelect: () => {
              revealItem({
                id: ctxMenu.item.path,
                path: ctxMenu.item.path,
                name: ctxMenu.item.name
              });
            }
          },
          {
            label: "\u5220\u9664",
            tone: "danger",
            onSelect: () => {
              setSelected(/* @__PURE__ */ new Set([ctxMenu.item.path]));
              setDeleteOpen(true);
            }
          }
        ]
      }
    ),
    paneIndex !== null && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
      "div",
      {
        className: "dshsg-pane",
        onMouseDown: (event) => {
          if (event.button === 1) event.preventDefault();
        },
        onAuxClick: (event) => {
          if (event.button === 1) {
            event.preventDefault();
            setPaneIndex(null);
          }
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-pane-bar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "dshsg-pane-name", children: viewerItems[paneIndex]?.name ?? "\u56FE\u7247" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
              "button",
              {
                className: "dshsg-chip",
                onClick: () => setPaneIndex(null),
                title: "\u9000\u51FA\u5927\u56FE\uFF08\u6216\u518D\u6309\u4E00\u6B21\u9F20\u6807\u4E2D\u952E\uFF09",
                children: "\u2715"
              }
            )
          ] }),
          paneUrl === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "dshsg-empty", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            "div",
            {
              className: "dshsg-pane-stage",
              onWheel: (event) => {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                const px = event.clientX - rect.left - rect.width / 2;
                const py = event.clientY - rect.top - rect.height / 2;
                const { zoom, offset } = paneViewRef.current;
                const next = Math.min(8, Math.max(0.3, zoom * Math.exp(-event.deltaY * 15e-4)));
                const k = next / zoom;
                setPaneZoom(next);
                setPaneOffset({
                  x: px - k * (px - offset.x),
                  y: py - k * (py - offset.y)
                });
              },
              onPointerDown: (event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                paneDragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  ox: paneOffset.x,
                  oy: paneOffset.y
                };
                setPaneDragging(true);
              },
              onPointerMove: (event) => {
                const drag = paneDragRef.current;
                if (drag === null) return;
                setPaneOffset({
                  x: drag.ox + (event.clientX - drag.x),
                  y: drag.oy + (event.clientY - drag.y)
                });
              },
              onPointerUp: (event) => {
                paneDragRef.current = null;
                setPaneDragging(false);
                try {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                } catch {
                }
              },
              onPointerCancel: () => {
                paneDragRef.current = null;
                setPaneDragging(false);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                "img",
                {
                  src: paneUrl,
                  alt: "",
                  draggable: false,
                  "data-dragging": paneDragging ? "true" : "false",
                  style: {
                    transform: `translate(${paneOffset.x}px, ${paneOffset.y}px) scale(${paneZoom})`,
                    transition: paneDragging ? "none" : "transform .12s ease-out"
                  }
                }
              )
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "dshsg-pane-hint", children: [
            Math.round(paneZoom * 100),
            "% \xB7 \u6EDA\u8F6E\u7F29\u653E \xB7 \u5DE6\u952E\u62D6\u52A8 \xB7 \u4E2D\u952E / \u2715 \u9000\u51FA"
          ] })
        ]
      }
    )
  ] }) });
}

// src/client/ui/SettingsPanel.tsx
var import_react9 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var SETTINGS_ROUTE = "/plugins/dsh-session-gallery/settings";
var CACHE_ROUTE = "/plugins/dsh-session-gallery/workbench-cache";
var GEN_CACHE_ROUTE = "/plugins/dsh-session-gallery/gen-cache";
var GEN_CONFIG_ROUTE = "/plugins/dsh-session-gallery/gen-config";
var GEN_PROBE_ROUTE = "/plugins/dsh-session-gallery/gen-probe";
var GEN_DEFAULT = {
  baseURL: "",
  protocol: "apimart-async",
  /** 留空：不替使用者预设代理端口和凭据名，需要时自己填。 */
  proxy: "",
  credentialKey: "",
  defaultModel: ""
};
var DEFAULT = {
  root: "",
  legacyRoots: [],
  workbenchRetentionDays: 3,
  genRetentionDays: 7,
  shareWithSite: false
};
function SettingsPanel(props) {
  const { onClose, onFlash, onSaved } = props;
  const [loading, setLoading] = (0, import_react9.useState)(true);
  const [saving, setSaving] = (0, import_react9.useState)(false);
  const [form, setForm] = (0, import_react9.useState)(DEFAULT);
  const [legacyText, setLegacyText] = (0, import_react9.useState)("");
  const [error, setError] = (0, import_react9.useState)(null);
  const [cache, setCache] = (0, import_react9.useState)(null);
  const [cacheBusy, setCacheBusy] = (0, import_react9.useState)(false);
  const [genCache, setGenCache] = (0, import_react9.useState)(null);
  const [gen, setGen] = (0, import_react9.useState)({ ...GEN_DEFAULT });
  const [genKey, setGenKey] = (0, import_react9.useState)("");
  const [probing, setProbing] = (0, import_react9.useState)(false);
  const [probeMessage, setProbeMessage] = (0, import_react9.useState)("");
  const [probeOk, setProbeOk] = (0, import_react9.useState)(null);
  const [candidates, setCandidates] = (0, import_react9.useState)([]);
  const refreshGenCache = (0, import_react9.useCallback)(async () => {
    try {
      const response = await fetch(GEN_CACHE_ROUTE, { credentials: "same-origin" });
      if (!response.ok) return;
      const payload = await response.json();
      setGenCache({
        files: typeof payload.files === "number" ? payload.files : 0,
        bytes: typeof payload.bytes === "number" ? payload.bytes : 0
      });
    } catch {
      setGenCache(null);
    }
  }, []);
  const sweepGenCache = (0, import_react9.useCallback)(async (clear) => {
    if (cacheBusy) return;
    setCacheBusy(true);
    try {
      const response = await fetch(GEN_CACHE_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(clear ? { clear: true } : {})
      });
      if (!response.ok) {
        onFlash(`\u6E05\u7406\u5931\u8D25\uFF1AHTTP ${response.status}`);
        return;
      }
      const payload = await response.json();
      const removed = typeof payload.removed === "number" ? payload.removed : 0;
      onFlash(clear ? `\u5DF2\u6E05\u7A7A\u51FA\u56FE\u6682\u5B58\uFF08${removed} \u4E2A\u6587\u4EF6\uFF09` : `\u5DF2\u6E05\u7406\u8FC7\u671F\u6587\u4EF6\uFF08${removed} \u4E2A\uFF09`);
      await refreshGenCache();
    } catch (cause) {
      onFlash(`\u6E05\u7406\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setCacheBusy(false);
    }
  }, [cacheBusy, onFlash, refreshGenCache]);
  const refreshCache = (0, import_react9.useCallback)(async () => {
    try {
      const response = await fetch(CACHE_ROUTE, { credentials: "same-origin" });
      if (!response.ok) return;
      const payload = await response.json();
      setCache({
        files: typeof payload.files === "number" ? payload.files : 0,
        bytes: typeof payload.bytes === "number" ? payload.bytes : 0
      });
    } catch {
      setCache(null);
    }
  }, []);
  const sweepCache = (0, import_react9.useCallback)(async (clear) => {
    if (cacheBusy) return;
    setCacheBusy(true);
    try {
      const response = await fetch(CACHE_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(clear ? { clear: true } : {})
      });
      if (!response.ok) {
        onFlash(`\u6E05\u7406\u5931\u8D25\uFF1AHTTP ${response.status}`);
        return;
      }
      const payload = await response.json();
      const removed = typeof payload.removed === "number" ? payload.removed : 0;
      onFlash(clear ? `\u5DF2\u6E05\u7A7A\u5DE5\u4F5C\u53F0\u7F13\u5B58\uFF08${removed} \u4E2A\u6587\u4EF6\uFF09` : `\u5DF2\u6E05\u7406\u8FC7\u671F\u6587\u4EF6\uFF08${removed} \u4E2A\uFF09`);
      await refreshCache();
    } catch (cause) {
      onFlash(`\u6E05\u7406\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setCacheBusy(false);
    }
  }, [cacheBusy, onFlash, refreshCache]);
  const loadGenConfig = (0, import_react9.useCallback)(async () => {
    try {
      const response = await fetch(GEN_CONFIG_ROUTE, { credentials: "same-origin" });
      if (!response.ok) return;
      const data = await response.json();
      setGen({
        baseURL: typeof data.baseURL === "string" ? data.baseURL : "",
        protocol: data.protocol === "openai-compat" ? "openai-compat" : "apimart-async",
        proxy: typeof data.proxy === "string" ? data.proxy : GEN_DEFAULT.proxy,
        credentialKey: typeof data.credentialKey === "string" && data.credentialKey !== "" ? data.credentialKey : GEN_DEFAULT.credentialKey,
        defaultModel: typeof data.defaultModel === "string" ? data.defaultModel : "",
        hasKey: data.hasKey === true
      });
    } catch {
    }
  }, []);
  const probe = (0, import_react9.useCallback)(async () => {
    if (probing) return;
    setProbing(true);
    setProbeMessage("");
    setProbeOk(null);
    try {
      const response = await fetch(GEN_PROBE_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          baseURL: gen.baseURL,
          apiKey: genKey,
          proxy: gen.proxy,
          credentialKey: gen.credentialKey
        })
      });
      const data = await response.json();
      if (data.ok === true) {
        setProbeOk(true);
        setProbeMessage(typeof data.message === "string" ? data.message : "\u8FDE\u63A5\u6B63\u5E38");
        const list = Array.isArray(data.models) ? data.models.filter((m) => typeof m === "string") : [];
        setCandidates(list);
        setGen((prev) => ({
          ...prev,
          protocol: data.protocol === "openai-compat" ? "openai-compat" : "apimart-async",
          // 还没选默认模型时，先拿第一个候选顶上。
          // 没有默认模型的后果很具体：没装「提示词优化」技能的用户说「画只猫」，
          // AI 不知道该用哪个模型，出图会直接报错。
          defaultModel: prev.defaultModel === "" ? list[0] ?? "" : prev.defaultModel
        }));
      } else {
        setProbeOk(false);
        setProbeMessage(typeof data.message === "string" ? data.message : "\u68C0\u6D4B\u5931\u8D25");
      }
    } catch (cause) {
      setProbeOk(false);
      setProbeMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setProbing(false);
    }
  }, [gen.baseURL, gen.credentialKey, gen.proxy, genKey, probing]);
  const setDefaultModel = (0, import_react9.useCallback)((id) => {
    setGen((prev) => ({ ...prev, defaultModel: id }));
  }, []);
  (0, import_react9.useEffect)(() => {
    let alive = true;
    void (async () => {
      try {
        const response = await fetch(SETTINGS_ROUTE, { credentials: "same-origin" });
        const payload = await response.json();
        if (!response.ok) {
          if (alive) setError(String(payload.error ?? response.status));
          return;
        }
        if (!alive) return;
        const next = {
          root: typeof payload.root === "string" ? payload.root : DEFAULT.root,
          legacyRoots: Array.isArray(payload.legacyRoots) ? payload.legacyRoots.filter((p) => typeof p === "string") : [],
          workbenchRetentionDays: typeof payload.workbenchRetentionDays === "number" ? payload.workbenchRetentionDays : DEFAULT.workbenchRetentionDays,
          genRetentionDays: typeof payload.genRetentionDays === "number" ? payload.genRetentionDays : DEFAULT.genRetentionDays,
          shareWithSite: payload.shareWithSite === true
        };
        setForm(next);
        setLegacyText(next.legacyRoots.join("\n"));
        void refreshCache();
        void refreshGenCache();
        void loadGenConfig();
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const save = (0, import_react9.useCallback)(async () => {
    if (saving) return;
    setSaving(true);
    try {
      const legacyRoots = legacyText.split("\n").map((line) => line.trim()).filter((line) => line !== "");
      const response = await fetch(SETTINGS_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, legacyRoots })
      });
      const text = await response.text();
      let payload = {};
      try {
        payload = JSON.parse(text);
      } catch {
        onFlash(`\u4FDD\u5B58\u5931\u8D25\uFF1AHTTP ${response.status}\uFF08\u54CD\u5E94\u4E3A\u7A7A\uFF0C\u53EF\u80FD\u672A\u91CD\u542F\uFF09`);
        return;
      }
      if (!response.ok) {
        onFlash(`\u4FDD\u5B58\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
        return;
      }
      const genResponse = await fetch(GEN_CONFIG_ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...gen, apiKey: genKey })
      });
      if (!genResponse.ok) {
        onFlash("\u56FE\u7247\u5E93\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u51FA\u56FE\u914D\u7F6E\u6CA1\u5B58\u4E0A\uFF08\u5BBF\u4E3B\u53EF\u80FD\u8FD8\u662F\u65E7\u7248\u672C\uFF09");
        return;
      }
      onFlash("\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
      onSaved();
      onClose();
    } catch (cause) {
      onFlash(`\u4FDD\u5B58\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setSaving(false);
    }
  }, [form, legacyText, onClose, onFlash, onSaved, saving]);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-page", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-settings-back", onClick: onClose, title: "\u8FD4\u56DE\u56FE\u5E93", children: "\u2190 \u8FD4\u56DE" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshsg-settings-title", children: "\u56FE\u7247\u5E93\u8BBE\u7F6E" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-scroll", children: [
      loading && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-confirm-hint", children: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" }),
      !loading && error !== null && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-confirm-hint", children: [
        "\u8BFB\u53D6\u5931\u8D25\uFF1A",
        error
      ] }),
      !loading && error === null && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "dshsg-settings-section", children: "\u56FE\u7247\u5E93" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u56FE\u7247\u5E93\u6839\u76EE\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "input",
          {
            className: "dshsg-settings-input",
            value: form.root,
            onChange: (e) => {
              const value = e.currentTarget.value;
              setForm((prev) => ({ ...prev, root: value }));
            },
            placeholder: "\u4F8B\u5982 C:\\Users\\\u4F60\\Pictures\\DSH\u56FE\u7247\u5E93"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-settings-hint", children: "\u6539\u6210\u65B0\u76EE\u5F55\u4E0D\u4F1A\u81EA\u52A8\u79FB\u52A8\u5DF2\u6709\u56FE\u7247\uFF1B\u65E7\u56FE\u53EF\u4EE5\u628A\u539F\u76EE\u5F55\u52A0\u5230\u4E0B\u9762\u300C\u65E7\u56FE\u76EE\u5F55\u300D\u91CC\u7EE7\u7EED\u663E\u793A\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u65E7\u56FE\u76EE\u5F55\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u53EF\u7559\u7A7A\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "textarea",
          {
            className: "dshsg-settings-input dshsg-settings-textarea",
            value: legacyText,
            onChange: (e) => setLegacyText(e.currentTarget.value),
            placeholder: "\u4F8B\u5982 C:\\Users\\\u4F60\\Desktop\\DSH\\...\\\u751F\u6210\u56FE",
            rows: 3
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "dshsg-settings-check", style: { marginTop: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "input",
            {
              type: "checkbox",
              checked: form.shareWithSite,
              onChange: (e) => {
                const value = e.currentTarget.checked;
                setForm((prev) => ({ ...prev, shareWithSite: value }));
              }
            }
          ),
          "\u4E0E AI \u53C2\u8003\u5E93\u7AD9\u70B9\u5171\u7528\u8FD9\u4E2A\u76EE\u5F55"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-hint", children: [
          "\u6253\u5F00\u540E\uFF0C\u51FA\u56FE\u843D\u76D8\u4F1A\u7ED9\u6BCF\u5F20\u56FE\u53D1\u4E00\u4E2A ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { children: "G-" }),
          " \u7F16\u53F7\uFF08\u7AD9\u70B9\u90A3\u8FB9\u7528 ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { children: "U-" }),
          "\uFF0C \u4E24\u5957\u53F7\u4E0D\u51B2\u7A81\uFF09\uFF0Csidecar \u4E5F\u4F1A\u6309\u300C\u4E24\u4E2A\u524D\u7AEF\u5171\u5199\u4E00\u4EFD\u300D\u7684\u65B9\u5F0F\u5408\u5E76\u4FDD\u5B58\uFF0C \u4E0D\u4F1A\u62B9\u6389\u7AD9\u70B9\u5199\u7684\u5206\u7EC4\u548C\u6807\u7B7E\u3002\u5355\u673A\u7528\u63D2\u4EF6\u5EFA\u8BAE\u5173\u7740\u2014\u2014\u7F16\u53F7\u7528\u4E0D\u4E0A\uFF0C\u8FD8\u4F1A\u8BA9\u6BCF\u6B21\u51FA\u56FE\u591A\u626B\u4E00\u904D\u5E93\u3002"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "dshsg-settings-section", children: "\u5F52\u6863\u89C4\u5219" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-settings-hint", style: { marginTop: 0 }, children: "\u4F1A\u8BDD\u91CC\u51FA\u73B0\u7684\u56FE\u4F1A\u5148\u8FDB\u300C\u672A\u5F52\u6863\u300D\u533A\uFF0C\u7531\u4F60\u81EA\u5DF1\u51B3\u5B9A\u5B58\u4E0D\u5B58 \u2014\u2014 \u63D2\u4EF6\u4E0D\u4F1A\u66FF\u4F60\u505A\u4E3B\u3002 \u51FA\u56FE\u5DE5\u5177\u4EA7\u51FA\u7684\u56FE\u4F8B\u5916\uFF1A\u5B83\u4EEC\u76F4\u63A5\u8FDB\u56FE\u7247\u5E93\uFF0C\u4E0D\u7ECF\u8FC7\u672A\u5F52\u6863\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u672A\u5F52\u6863\u533A" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "button",
          {
            className: "dshsg-chip",
            onClick: () => {
              try {
                localStorage.removeItem("dshsg:pending-ignored:v1");
              } catch {
              }
              onFlash("\u5DF2\u6E05\u7A7A\u300C\u5FFD\u7565\u300D\u8BB0\u5F55\uFF0C\u88AB\u5FFD\u7565\u7684\u56FE\u4F1A\u91CD\u65B0\u51FA\u73B0");
              onSaved();
            },
            children: "\u6E05\u7A7A\u300C\u5FFD\u7565\u300D\u8BB0\u5F55"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-settings-hint", children: "\u5728\u672A\u5F52\u6863\u56FE\u7684\u5927\u56FE\u67E5\u770B\u5668\u91CC\u70B9\u300C\u5FFD\u7565\u6B64\u56FE\u300D\u4F1A\u628A\u90A3\u5F20\u9690\u85CF\uFF1B\u8FD9\u91CC\u53EF\u4EE5\u4E00\u6B21\u5168\u90E8\u6062\u590D\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "dshsg-settings-section", children: "\u51FA\u56FE" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-hint", style: { marginTop: 0, marginBottom: 10 }, children: [
          "\u586B\u4E2D\u8F6C\u7AD9\u548C Key \u2192 \u70B9\u300C\u68C0\u6D4B\u300D\u81EA\u52A8\u8BC6\u522B\u534F\u8BAE\u4E0E\u53EF\u7528\u6A21\u578B\u3002\u914D\u597D\u540E",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("b", { children: "\u4EFB\u4F55\u4F1A\u8BDD" }),
          "\u90FD\u80FD\u76F4\u63A5\u8BA9 AI \u51FA\u56FE\uFF0C \u56FE\u4F1A\u81EA\u52A8\u8FDB\u56FE\u7247\u5E93\uFF0C\u4E0D\u9700\u8981\u5199\u811A\u672C\u3001\u4E5F\u4E0D\u7528\u624B\u52A8\u544A\u8BC9\u5B83\u8DEF\u5F84\u3002"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u4E2D\u8F6C\u7AD9\u5730\u5740" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "input",
          {
            className: "dshsg-settings-input",
            value: gen.baseURL,
            onChange: (e) => {
              const value = e.currentTarget.value;
              setGen((prev) => ({ ...prev, baseURL: value }));
            },
            placeholder: "https://api.apimart.ai"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "API Key" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "input",
          {
            className: "dshsg-settings-input",
            type: "password",
            value: genKey,
            onChange: (e) => setGenKey(e.currentTarget.value),
            placeholder: gen.hasKey === true ? "\u5DF2\u4FDD\u5B58 \xB7 \u7559\u7A7A\u8868\u793A\u4E0D\u4FEE\u6539" : "sk-..."
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-hint", children: [
          "\u5B58\u5728 ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { children: "~/.dsh/.credentials.yaml" }),
          " \u7684 ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { children: gen.credentialKey }),
          " \u4E0B\uFF0C\u4E0D\u4F1A\u5199\u8FDB\u63D2\u4EF6\u914D\u7F6E\u3002"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u4EE3\u7406\uFF08\u53EF\u7559\u7A7A\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "input",
          {
            className: "dshsg-settings-input",
            value: gen.proxy,
            onChange: (e) => {
              const value = e.currentTarget.value;
              setGen((prev) => ({ ...prev, proxy: value }));
            },
            placeholder: "http://127.0.0.1:7897"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 10, alignItems: "center", marginTop: 12 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "button",
            {
              className: "dshsg-action",
              disabled: probing || gen.baseURL.trim() === "",
              onClick: () => {
                void probe();
              },
              children: probing ? "\u68C0\u6D4B\u4E2D\u2026" : "\u68C0\u6D4B"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "span",
            {
              className: "dshsg-settings-hint",
              style: {
                marginTop: 0,
                color: probeOk === false ? "#ef7f74" : probeOk === true ? "#6fbf73" : void 0
              },
              children: probeMessage
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", style: { marginTop: 14 }, children: "\u9ED8\u8BA4\u6A21\u578B" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-settings-hint", style: { marginBottom: 6 }, children: "\u7528\u6237\u8BF4\u300C\u753B\u5F20\u56FE\u300D\u800C\u6CA1\u6307\u5B9A\u6A21\u578B\u65F6\uFF0CAI \u7528\u8FD9\u4E2A\u3002 \u88C5\u4E86\u63D0\u793A\u8BCD\u7C7B\u6280\u80FD\u7684\u8BDD\uFF0C\u6280\u80FD\u4F1A\u76F4\u63A5\u6307\u5B9A\u6A21\u578B\uFF0C\u8FD9\u91CC\u53EA\u5F53\u515C\u5E95\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "input",
          {
            className: "dshsg-settings-input",
            value: gen.defaultModel,
            placeholder: "\u5982 gpt-image-2\uFF1B\u4E5F\u53EF\u4EE5\u5148\u70B9\u4E0A\u9762\u7684\u300C\u68C0\u6D4B\u300D\uFF0C\u518D\u4ECE\u4E0B\u9762\u6311",
            onChange: (e) => setDefaultModel(e.currentTarget.value)
          }
        ),
        candidates.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-gen-models", style: { marginTop: 8 }, children: candidates.map((id) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
          "label",
          {
            className: "dshsg-gen-model",
            style: { cursor: "pointer" },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshsg-settings-check", style: { flex: "0 0 auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "input",
                {
                  type: "radio",
                  name: "dshsg-gen-default-model",
                  checked: gen.defaultModel === id,
                  onChange: () => setDefaultModel(id)
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "dshsg-gen-model-id", title: id, children: id })
            ]
          },
          id
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: "dshsg-settings-section", children: "\u7F13\u5B58\u4E0E\u6E05\u7406" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u5DE5\u4F5C\u53F0\u5BFC\u51FA\u7F13\u5B58" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-hint", style: { marginBottom: 8 }, children: [
          "\u6BCF\u6B21\u70B9\u300C\u751F\u6210\u6539\u56FE\u8BF7\u6C42\u300D\u90FD\u4F1A\u5728\u56FE\u7247\u5E93\u7684 ",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { children: ".workbench" }),
          " \u76EE\u5F55\u91CC\u5B58\u4E00\u5F20\u6807\u6CE8\u56FE\u548C\u4E00\u5F20\u8499\u7248\u56FE\uFF0C \u4EA4\u7ED9\u540E\u7EED\u6539\u56FE\u4F7F\u7528\u3002\u5F53\u524D\u5360\u7528\uFF1A",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("b", { style: { marginLeft: 4 }, children: cache === null ? "\u2014" : `${cache.files} \u4E2A\u6587\u4EF6 \xB7 ${formatBytes(cache.bytes)}` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "dshsg-settings-check", children: [
          "\u81EA\u52A8\u6E05\u7406\u8D85\u8FC7",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "input",
            {
              className: "dshsg-settings-input",
              style: { display: "inline-block", width: 56, margin: "0 6px", padding: "2px 6px" },
              type: "number",
              min: 0,
              value: form.workbenchRetentionDays,
              onChange: (e) => {
                const value = Math.max(0, Math.round(Number(e.currentTarget.value) || 0));
                setForm((prev) => ({ ...prev, workbenchRetentionDays: value }));
              }
            }
          ),
          "\u5929\u7684\u6587\u4EF6"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-settings-hint", children: "\u300C0\u300D\u8868\u793A\u4E0D\u81EA\u52A8\u6E05\u7406\u3002\u4FDD\u5B58\u65B0\u6587\u4EF6\u65F6\u4F1A\u987A\u624B\u6E05\u7406\u8FC7\u671F\u7684\uFF1B\u6539\u5B8C\u5929\u6570\u8981\u70B9\u4E0B\u65B9\u300C\u4FDD\u5B58\u300D\u624D\u751F\u6548\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-chip", disabled: cacheBusy, onClick: () => {
            void sweepCache(false);
          }, children: "\u6E05\u7406\u8FC7\u671F" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-chip dshsg-action-danger", disabled: cacheBusy, onClick: () => {
            void sweepCache(true);
          }, children: "\u6E05\u7A7A\u5168\u90E8" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-chip", disabled: cacheBusy, onClick: () => {
            void refreshCache();
          }, children: "\u5237\u65B0\u5360\u7528" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "dshsg-settings-label", children: "\u51FA\u56FE\u6682\u5B58\uFF08\u65E7\u811A\u672C\u4EA7\u51FA\u7684\u56FE\uFF09" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-hint", style: { marginBottom: 8 }, children: [
          "\u53EA\u6709\u5728\u7528\u5916\u90E8\u811A\u672C\u51FA\u56FE\uFF08`--no-archive`\uFF09\u65F6\u624D\u4F1A\u6709\u4E1C\u897F\u843D\u5728",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { children: " ~/.dsh/cache/session-gallery/gen " }),
          "\u8FD9\u91CC\u3002\u8D70\u63D2\u4EF6\u7684\u300C\u51FA\u56FE\u300D\u529F\u80FD\u65F6\uFF0C\u56FE\u76F4\u63A5\u8FDB\u56FE\u7247\u5E93\uFF0C\u4E0D\u7ECF\u8FC7\u8FD9\u91CC\u3002 \u5F53\u524D\u5360\u7528\uFF1A",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("b", { style: { marginLeft: 4 }, children: genCache === null ? "\u2014" : `${genCache.files} \u4E2A\u6587\u4EF6 \xB7 ${formatBytes(genCache.bytes)}` })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { className: "dshsg-settings-check", children: [
          "\u81EA\u52A8\u6E05\u7406\u8D85\u8FC7",
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "input",
            {
              className: "dshsg-settings-input",
              style: { display: "inline-block", width: 56, margin: "0 6px", padding: "2px 6px" },
              type: "number",
              min: 0,
              value: form.genRetentionDays,
              onChange: (e) => {
                const value = Math.max(0, Math.round(Number(e.currentTarget.value) || 0));
                setForm((prev) => ({ ...prev, genRetentionDays: value }));
              }
            }
          ),
          "\u5929\u7684\u6587\u4EF6"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "dshsg-settings-hint", children: "\u56FE\u8FDB\u8FC7\u4F1A\u8BDD\u540E DSH \u53E6\u6709\u526F\u672C\uFF0C\u5220\u8FD9\u91CC\u4E0D\u5F71\u54CD\u4F1A\u8BDD\u91CC\u90A3\u5F20\u56FE\uFF1B\u53EA\u662F\u300C\u672A\u5F52\u6863\u671F\u590D\u5236\u63D0\u793A\u8BCD\u300D\u4F1A\u5C11\u4E00\u4EFD sidecar\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 8 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-chip", disabled: cacheBusy, onClick: () => {
            void sweepGenCache(false);
          }, children: "\u6E05\u7406\u8FC7\u671F" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-chip dshsg-action-danger", disabled: cacheBusy, onClick: () => {
            void sweepGenCache(true);
          }, children: "\u6E05\u7A7A\u5168\u90E8" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-chip", disabled: cacheBusy, onClick: () => {
            void refreshGenCache();
          }, children: "\u5237\u65B0\u5360\u7528" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "dshsg-settings-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-action dshsg-action-ghost", onClick: onClose, children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { className: "dshsg-action", disabled: saving || loading, onClick: () => {
          void save();
        }, children: saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58" })
      ] })
    ] })
  ] });
}

// src/client/ui/Panel.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function hashOfArchivedPath(filePath) {
  const base = filePath.split(/[\\/]/).pop() ?? "";
  const matched = /([0-9a-f]{12})\.(?:png|jpe?g|webp|gif)$/i.exec(base);
  return matched?.[1];
}
var EXPORT_ROUTE = "/plugins/dsh-session-gallery/export";
var CLEAR_ROUTE = "/plugins/dsh-session-gallery/clear-cache";
var SCAN_ROUTE2 = "/plugins/dsh-session-gallery/scan";
var IMAGE_ROUTE3 = "/plugins/dsh-session-gallery/image";
var DELETE_ROUTE2 = "/plugins/dsh-session-gallery/delete";
var REVEAL_ROUTE2 = "/plugins/dsh-session-gallery/reveal";
function fileUrlOf(path) {
  return `${IMAGE_ROUTE3}?path=${encodeURIComponent(path)}`;
}
function numberOf3(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function stringOf2(value) {
  return typeof value === "string" && value !== "" ? value : void 0;
}
var urlCache = /* @__PURE__ */ new Map();
function SessionGalleryPanel(props) {
  const { sessions, uiConversation, sessionId, inputActions } = props;
  const [tab, setTab] = (0, import_react10.useState)(() => {
    try {
      const raw = localStorage.getItem("dshsg:tab:v1");
      return raw === "workbench" || raw === "library" ? raw : "session";
    } catch {
      return "session";
    }
  });
  const switchTab = (0, import_react10.useCallback)((next) => {
    setTab(next);
    try {
      localStorage.setItem("dshsg:tab:v1", next);
    } catch {
    }
  }, []);
  const [workbenchPaths, setWorkbenchPaths] = (0, import_react10.useState)([]);
  const [images, setImages] = (0, import_react10.useState)([]);
  const [onlyFavorite, setOnlyFavorite] = (0, import_react10.useState)(false);
  const [favorites, setFavorites] = (0, import_react10.useState)(() => loadFavorites());
  (0, import_react10.useEffect)(() => subscribeFavorites(() => setFavorites(loadFavorites())), []);
  const [selected, setSelected] = (0, import_react10.useState)(() => /* @__PURE__ */ new Set());
  const [viewerId, setViewerId] = (0, import_react10.useState)(null);
  const [bulkDelete, setBulkDelete] = (0, import_react10.useState)(null);
  const [ctxMenu, setCtxMenu] = (0, import_react10.useState)(null);
  const [paneItem, setPaneItem] = (0, import_react10.useState)(null);
  const [paneUrl, setPaneUrl] = (0, import_react10.useState)(void 0);
  const [paneZoom, setPaneZoom] = (0, import_react10.useState)(1);
  const [paneOffset, setPaneOffset] = (0, import_react10.useState)({ x: 0, y: 0 });
  const paneDragRef = (0, import_react10.useRef)(null);
  const [paneDragging, setPaneDragging] = (0, import_react10.useState)(false);
  const paneViewRef = (0, import_react10.useRef)({ zoom: 1, offset: { x: 0, y: 0 } });
  paneViewRef.current = { zoom: paneZoom, offset: paneOffset };
  const [error, setError] = (0, import_react10.useState)(null);
  const [loading, setLoading] = (0, import_react10.useState)(true);
  const [toast, setToast] = (0, import_react10.useState)(null);
  const [workbenchItems, setWorkbenchItems] = (0, import_react10.useState)([]);
  const flash = (0, import_react10.useCallback)((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => cur === msg ? null : cur), 2200);
  }, []);
  const workbenchSources = (0, import_react10.useMemo)(() => {
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of workbenchItems) {
      const path = item.path;
      if (path === void 0 || path === "" || seen.has(path)) continue;
      seen.add(path);
      out.push({ path, name: item.name });
    }
    for (const path of workbenchPaths) {
      if (seen.has(path)) continue;
      seen.add(path);
      const name = path.split(/[\\/]/).pop() ?? path;
      out.push({ path, name });
    }
    return out;
  }, [workbenchItems, workbenchPaths]);
  const sendToComposer = (0, import_react10.useCallback)((text) => {
    if (inputActions === void 0) {
      flash("\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u7684\u8F93\u5165\u6846");
      return;
    }
    try {
      const span = inputActions.captureInsertion();
      if (inputActions.insertText(text, span)) return;
    } catch {
    }
    try {
      inputActions.setDraft(text);
    } catch {
      flash("\u5199\u5165\u8F93\u5165\u6846\u5931\u8D25");
    }
  }, [inputActions, flash]);
  const [busy, setBusy] = (0, import_react10.useState)(false);
  const [sizeLevel, setSizeLevel] = (0, import_react10.useState)(() => {
    try {
      const raw = Number(localStorage.getItem("dshsg:sizeLevel:v1"));
      return Number.isFinite(raw) && raw >= 1 && raw <= 6 ? Math.round(raw) : 5;
    } catch {
      return 5;
    }
  });
  const [debug, setDebug] = (0, import_react10.useState)("");
  const [settingsOpen, setSettingsOpen] = (0, import_react10.useState)(false);
  const [libraryKey, setLibraryKey] = (0, import_react10.useState)(0);
  const cols = 7 - sizeLevel;
  (0, import_react10.useEffect)(() => {
    if (sessions === void 0 || sessionId === void 0 || sessionId === "") {
      setLoading(false);
      setError("\u6CA1\u6709\u4F1A\u8BDD\u4E0A\u4E0B\u6587");
      return;
    }
    let disposed = false;
    let unsubscribe;
    let binding;
    const accumulated = /* @__PURE__ */ new Map();
    const merge = () => {
      if (disposed || binding === void 0) return;
      try {
        const snapshot = binding.eventSource.getSnapshot();
        const entries = snapshot.entries ?? [];
        const collected = collectSessionImages(entries);
        if (collected.length === 0) {
          const types = {};
          let firstImageBlock = "";
          for (const raw of entries) {
            const entry = raw;
            const event = entry?.event ?? raw;
            const type = String(event?.type ?? "?");
            types[type] = (types[type] ?? 0) + 1;
            if (firstImageBlock === "") {
              const data = event?.data;
              const content = Array.isArray(data?.content) ? data.content : void 0;
              if (content !== void 0) {
                const image = content.find((c) => c?.type === "image");
                if (image !== void 0) firstImageBlock = JSON.stringify(image).slice(0, 200);
              }
            }
          }
          setDebug(
            `entries=${entries.length} hasMore=${String(snapshot.hasMore)} \u56FE\u7247\u5757=${firstImageBlock === "" ? 0 : 1} \u7C7B\u578B=${JSON.stringify(types).slice(0, 160)} ` + (firstImageBlock === "" ? "" : `\u6837\u4F8B=${firstImageBlock}`)
          );
        } else {
          setDebug("");
        }
        for (const item of collected) {
          const prev = accumulated.get(item.id);
          if (prev === void 0 || prev.time !== item.time) accumulated.set(item.id, item);
        }
        setImages([...accumulated.values()].sort((a, b) => b.time - a.time));
        setLoading(false);
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        setLoading(false);
      }
    };
    const fillOlder = async () => {
      for (let page = 0; page < 300; page += 1) {
        if (disposed || binding === void 0) return;
        const snapshot = binding.eventSource.getSnapshot();
        if (snapshot.hasMore !== true) return;
        if (typeof binding.loadOlder !== "function") return;
        try {
          await binding.loadOlder();
        } catch {
          return;
        }
        if (disposed) return;
        merge();
      }
    };
    try {
      binding = sessions.binding(sessionId);
      merge();
      void fillOlder();
      unsubscribe = binding.eventSource.subscribe(merge);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setLoading(false);
    }
    return () => {
      disposed = true;
      try {
        unsubscribe?.();
      } catch {
      }
    };
  }, [sessions, sessionId]);
  const resolveUrl = (0, import_react10.useCallback)(
    (attachment) => {
      if (uiConversation === void 0 || sessionId === void 0) {
        return Promise.reject(new Error("uiConversation \u4E0D\u53EF\u7528"));
      }
      const cacheKey = `${sessionId}:${attachment.attachmentId}`;
      const cached = urlCache.get(cacheKey);
      if (cached !== void 0) return cached;
      const request = uiConversation.imageUrl(sessionId, attachment);
      urlCache.set(cacheKey, request);
      request.catch(() => urlCache.delete(cacheKey));
      return request;
    },
    [uiConversation, sessionId]
  );
  const [sessionFiles, setSessionFiles] = (0, import_react10.useState)([]);
  const [metaByHash, setMetaByHash] = (0, import_react10.useState)(
    () => /* @__PURE__ */ new Map()
  );
  const [fileByHash, setFileByHash] = (0, import_react10.useState)(
    () => /* @__PURE__ */ new Map()
  );
  const refreshSessionFiles = (0, import_react10.useCallback)(async () => {
    if (sessionId === void 0 || sessionId === "") return;
    try {
      const response = await fetch(SCAN_ROUTE2, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      const payload = await response.json();
      const list = Array.isArray(payload.items) ? payload.items : [];
      const mine = [];
      const hashMeta = /* @__PURE__ */ new Map();
      const hashFiles = /* @__PURE__ */ new Map();
      for (const item of list) {
        const path = typeof item.path === "string" ? item.path : "";
        const itemHash = typeof item.hash === "string" ? item.hash : typeof item.meta?.hash === "string" ? item.meta.hash : void 0;
        if (typeof itemHash === "string" && itemHash !== "") {
          const key = itemHash.slice(0, 12).toLowerCase();
          if (item.meta !== void 0) hashMeta.set(key, item.meta);
          if (path !== "") {
            hashFiles.set(key, {
              path,
              name: typeof item.name === "string" ? item.name : "\u56FE\u7247",
              mtime: typeof item.mtime === "number" ? item.mtime : 0,
              bytes: typeof item.bytes === "number" ? item.bytes : 0,
              hash: key,
              ...item.meta === void 0 ? {} : { meta: item.meta }
            });
          }
        }
        const sid = item.meta?.sessionId;
        if (typeof sid !== "string" || sid !== sessionId) continue;
        if (path === "") continue;
        mine.push({
          path,
          name: typeof item.name === "string" ? item.name : "\u56FE\u7247",
          mtime: typeof item.mtime === "number" ? item.mtime : 0,
          bytes: typeof item.bytes === "number" ? item.bytes : 0,
          ...typeof item.hash === "string" ? { hash: item.hash } : {},
          ...item.meta === void 0 ? {} : { meta: item.meta }
        });
      }
      for (const entry of Array.isArray(payload.pendingMeta) ? payload.pendingMeta : []) {
        const hash = typeof entry.hash === "string" ? entry.hash.slice(0, 12).toLowerCase() : "";
        const meta = entry.meta;
        if (hash === "" || meta === null || typeof meta !== "object") continue;
        if (!hashMeta.has(hash)) hashMeta.set(hash, meta);
      }
      setSessionFiles(mine);
      setMetaByHash(hashMeta);
      setFileByHash(hashFiles);
    } catch {
    }
  }, [sessionId]);
  (0, import_react10.useEffect)(() => {
    void refreshSessionFiles();
  }, [refreshSessionFiles]);
  (0, import_react10.useEffect)(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void refreshSessionFiles();
    }, 5e3);
    return () => window.clearInterval(timer);
  }, [refreshSessionFiles]);
  const imageCount = images.length;
  (0, import_react10.useEffect)(() => {
    if (imageCount === 0) return;
    void refreshSessionFiles();
  }, [imageCount, refreshSessionFiles]);
  const merged = (0, import_react10.useMemo)(() => {
    const list = [];
    for (const file of sessionFiles) {
      list.push({
        id: file.path,
        kind: "file",
        name: file.name,
        time: file.mtime,
        bytes: file.bytes,
        path: file.path,
        width: numberOf3(file.meta?.width),
        height: numberOf3(file.meta?.height),
        mediaType: stringOf2(file.meta?.mediaType),
        prompt: stringOf2(file.meta?.prompt),
        meta: file.meta
      });
    }
    return list.sort((a, b) => b.time - a.time);
  }, [sessionFiles]);
  const archivedIds = (0, import_react10.useMemo)(() => {
    const set = /* @__PURE__ */ new Set();
    for (const file of sessionFiles) {
      const source = file.meta?.sourceAttachmentId;
      if (typeof source === "string" && source !== "") set.add(source);
    }
    return set;
  }, [sessionFiles]);
  const [ignored, setIgnored] = (0, import_react10.useState)(() => {
    try {
      const raw = localStorage.getItem("dshsg:pending-ignored:v1");
      const parsed = raw === null ? [] : JSON.parse(raw);
      return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : []);
    } catch {
      return /* @__PURE__ */ new Set();
    }
  });
  const [showAllPending, setShowAllPending] = (0, import_react10.useState)(false);
  const ignorePending = (0, import_react10.useCallback)((id) => {
    setIgnored((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("dshsg:pending-ignored:v1", JSON.stringify([...next]));
      } catch {
      }
      return next;
    });
  }, []);
  const ignorePendingMany = (0, import_react10.useCallback)((ids) => {
    if (ids.length === 0) return;
    setIgnored((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      try {
        localStorage.setItem("dshsg:pending-ignored:v1", JSON.stringify([...next]));
      } catch {
      }
      return next;
    });
    setPendingSelected(/* @__PURE__ */ new Set());
    flash(`\u5DF2\u5FFD\u7565 ${ids.length} \u5F20\uFF08\u8BBE\u7F6E\u9875\u300C\u672A\u5F52\u6863\u533A\u300D\u53EF\u6E05\u7A7A\u8FD9\u4E2A\u8BB0\u5F55\uFF09`);
  }, [flash]);
  const unarchived = (0, import_react10.useMemo)(
    () => images.filter((item) => !archivedIds.has(item.id) && !ignored.has(item.id)),
    [archivedIds, ignored, images]
  );
  const PENDING_LIMIT = 30;
  const visiblePending = (0, import_react10.useMemo)(
    () => showAllPending ? unarchived : unarchived.slice(0, PENDING_LIMIT),
    [showAllPending, unarchived]
  );
  const [pendingSelected, setPendingSelected] = (0, import_react10.useState)(() => /* @__PURE__ */ new Set());
  const [archiving, setArchiving] = (0, import_react10.useState)(false);
  const [pendingViewerId, setPendingViewerId] = (0, import_react10.useState)(null);
  const archiveItems = (0, import_react10.useCallback)(async (chosen) => {
    if (chosen.length === 0 || archiving) return [];
    setArchiving(true);
    try {
      const response = await fetch("/plugins/dsh-session-gallery/archive", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId ?? "",
          items: chosen.map((item) => ({ attachment: item.attachment, origin: item.origin }))
        })
      });
      const text = await response.text();
      let payload = {};
      try {
        payload = JSON.parse(text);
      } catch {
        flash(`\u5B58\u5165\u5931\u8D25\uFF1AHTTP ${response.status}\uFF08\u54CD\u5E94\u4E3A\u7A7A\uFF0C\u53EF\u80FD\u672A\u91CD\u542F\uFF09`);
        return [];
      }
      if (!response.ok) {
        flash(`\u5B58\u5165\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
        return [];
      }
      const savedCount = Array.isArray(payload.files) ? payload.files.length : 0;
      const failedCount = Array.isArray(payload.failed) ? payload.failed.length : 0;
      flash(failedCount > 0 ? `\u5DF2\u5B58\u5165 ${savedCount} \u5F20\uFF0C${failedCount} \u5F20\u5931\u8D25` : `\u5DF2\u5B58\u5165\u56FE\u7247\u5E93 ${savedCount} \u5F20`);
      setPendingSelected(/* @__PURE__ */ new Set());
      void refreshSessionFiles();
      return Array.isArray(payload.files) ? payload.files.map((entry) => entry !== null && typeof entry === "object" && typeof entry.path === "string" ? entry.path : "").filter((one) => one !== "") : [];
    } catch (cause) {
      flash(`\u5B58\u5165\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
      return [];
    } finally {
      setArchiving(false);
    }
  }, [archiving, flash, refreshSessionFiles, sessionId]);
  const archivePending = (0, import_react10.useCallback)(async () => {
    await archiveItems(unarchived.filter((item) => pendingSelected.has(item.id)));
  }, [archiveItems, pendingSelected, unarchived]);
  const pendingViewerItems = (0, import_react10.useMemo)(
    () => visiblePending.map((item) => {
      const bare = item.id.replace(/^sha256:/i, "").toLowerCase();
      const meta = bare.length >= 12 ? metaByHash.get(bare.slice(0, 12)) : void 0;
      const borrowedPrompt = meta !== void 0 && typeof meta.prompt === "string" && meta.prompt !== "" ? meta.prompt : void 0;
      return {
        id: item.id,
        name: item.attachment.name ?? "\u56FE\u7247",
        mediaType: item.attachment.mediaType,
        width: item.attachment.width,
        height: item.attachment.height,
        bytes: item.attachment.bytes,
        time: item.time,
        ...borrowedPrompt === void 0 ? {} : { prompt: borrowedPrompt },
        ...meta === void 0 ? {} : { meta }
      };
    }),
    [visiblePending, metaByHash]
  );
  const pendingViewerIndex = pendingViewerId === null ? -1 : pendingViewerItems.findIndex((entry) => entry.id === pendingViewerId);
  const favoriteKeyOfMerged = (0, import_react10.useCallback)((item) => favoriteKeyOf({
    hash: typeof item.meta?.hash === "string" ? item.meta.hash : void 0,
    attachmentId: item.attachment?.attachmentId
  }), []);
  const isFavorite = (0, import_react10.useCallback)((item) => {
    const key = favoriteKeyOfMerged(item);
    return key !== void 0 && favorites.has(key);
  }, [favorites, favoriteKeyOfMerged]);
  const visible = (0, import_react10.useMemo)(
    () => onlyFavorite ? merged.filter((item) => isFavorite(item)) : merged,
    [merged, onlyFavorite, isFavorite]
  );
  const favoriteCount = (0, import_react10.useMemo)(
    () => merged.filter((item) => isFavorite(item)).length,
    [merged, isFavorite]
  );
  const viewerItems = (0, import_react10.useMemo)(
    () => visible.map((item) => ({
      id: item.id,
      ...item.path === void 0 ? {} : { path: item.path },
      name: item.name,
      mediaType: item.mediaType,
      width: item.width,
      height: item.height,
      bytes: item.bytes,
      time: item.time,
      prompt: item.prompt,
      meta: item.meta
    })),
    [visible]
  );
  const viewerIndex = viewerId === null ? -1 : viewerItems.findIndex((entry) => entry.id === viewerId);
  const resolveViewerUrl = (0, import_react10.useCallback)(
    (item) => {
      const found = visible.find((candidate) => candidate.id === item.id);
      if (found === void 0) return Promise.reject(new Error("\u56FE\u7247\u4E0D\u5B58\u5728"));
      if (found.kind === "file" && found.path !== void 0) return Promise.resolve(fileUrlOf(found.path));
      if (found.attachment !== void 0) return resolveUrl(found.attachment);
      return Promise.reject(new Error("\u56FE\u7247\u4E0D\u53EF\u7528"));
    },
    [resolveUrl, visible]
  );
  const [compare, setCompare] = (0, import_react10.useState)(null);
  const resolveCompareUrl = (0, import_react10.useCallback)(
    (item) => {
      if (compare?.pending === true) {
        const found = unarchived.find((candidate) => candidate.id === item.id);
        return found === void 0 ? Promise.reject(new Error("\u56FE\u7247\u4E0D\u5B58\u5728")) : resolveUrl(found.attachment);
      }
      return resolveViewerUrl(item);
    },
    [compare, unarchived, resolveUrl, resolveViewerUrl]
  );
  const paneResolveRef = (0, import_react10.useRef)(resolveViewerUrl);
  paneResolveRef.current = resolveViewerUrl;
  const attachmentResolveRef = (0, import_react10.useRef)(resolveUrl);
  attachmentResolveRef.current = resolveUrl;
  const unarchivedRef = (0, import_react10.useRef)(unarchived);
  unarchivedRef.current = unarchived;
  (0, import_react10.useEffect)(() => {
    if (paneItem === null) {
      setPaneUrl(void 0);
      return;
    }
    setPaneZoom(1);
    setPaneOffset({ x: 0, y: 0 });
    let alive = true;
    const { item, kind } = paneItem;
    const promise = kind === "file" ? paneResolveRef.current(item) : (() => {
      const found = unarchivedRef.current.find((candidate) => candidate.id === item.id);
      return found === void 0 ? Promise.reject(new Error("\u56FE\u7247\u4E0D\u5B58\u5728")) : attachmentResolveRef.current(found.attachment);
    })();
    promise.then((value) => {
      if (alive) setPaneUrl(value);
    }).catch(() => {
      if (alive) setPaneUrl(void 0);
    });
    return () => {
      alive = false;
    };
  }, [paneItem]);
  const toggleFavorite2 = (0, import_react10.useCallback)((id) => {
    const item = merged.find((candidate) => candidate.id === id);
    const key = item === void 0 ? void 0 : favoriteKeyOfMerged(item);
    if (key === void 0) {
      flash("\u8FD9\u5F20\u56FE\u6CA1\u6709\u53EF\u6536\u85CF\u7684\u6807\u8BC6");
      return;
    }
    setFavorites(toggleFavorite(favorites, key));
  }, [favorites, favoriteKeyOfMerged, flash, merged]);
  const favoritePending = (0, import_react10.useCallback)(async (item) => {
    const legacyKey = favoriteKeyOf({ attachmentId: item.attachment.attachmentId });
    if (legacyKey !== void 0 && favorites.has(legacyKey)) {
      setFavorites(toggleFavorite(favorites, legacyKey));
      return;
    }
    const agreed = window.confirm(
      "\u6536\u85CF\u524D\u8981\u5148\u628A\u8FD9\u5F20\u56FE\u5B58\u5165\u56FE\u7247\u5E93\u3002\n\n\uFF08\u6536\u85CF\u662F\u6309\u56FE\u7247\u5185\u5BB9\u8BA4\u7684\uFF0C\u4E0D\u5F52\u6863\u5C31\u6CA1\u6709\u53EF\u8BA4\u7684\u6807\u8BC6\uFF09\n\n\u73B0\u5728\u5B58\u5165\u5E76\u6536\u85CF\uFF1F"
    );
    if (!agreed) return;
    const paths = await archiveItems([item]);
    const hash = paths.map(hashOfArchivedPath).find((one) => one !== void 0);
    if (hash === void 0) {
      flash("\u5DF2\u5B58\u5165\u56FE\u7247\u5E93\uFF0C\u4F46\u6CA1\u8BA4\u51FA\u56FE\u7247\u54C8\u5E0C\uFF0C\u6536\u85CF\u5931\u8D25");
      return;
    }
    setFavorites(toggleFavorite(loadFavorites(), `hash:${hash}`));
    flash("\u5DF2\u5B58\u5165\u56FE\u7247\u5E93\u5E76\u6536\u85CF");
  }, [archiveItems, favorites, flash]);
  const copyImage = (0, import_react10.useCallback)((url) => {
    void (async () => {
      try {
        const blob = await (await fetch(url)).blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
        bitmap.close();
        const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (png !== null) await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      } catch {
      }
    })();
  }, []);
  const revealPath = (0, import_react10.useCallback)((path) => {
    void (async () => {
      try {
        const response = await fetch(REVEAL_ROUTE2, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path })
        });
        if (!response.ok) {
          flash(`\u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25\uFF1AHTTP ${response.status}`);
          return;
        }
        flash("\u5DF2\u5728\u8D44\u6E90\u7BA1\u7406\u5668\u4E2D\u5B9A\u4F4D");
      } catch (cause) {
        flash(`\u6253\u5F00\u6587\u4EF6\u5939\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
      }
    })();
  }, [flash]);
  const revealItem = (0, import_react10.useCallback)((item) => {
    const path = item.path;
    if (path === void 0 || path === "") {
      flash("\u8FD9\u5F20\u56FE\u6CA1\u6709\u78C1\u76D8\u8DEF\u5F84");
      return;
    }
    revealPath(path);
  }, [flash, revealPath]);
  const putPathToDialog = (0, import_react10.useCallback)((item) => {
    const path = item.path;
    if (path === void 0 || path === "") {
      flash("\u8FD9\u5F20\u56FE\u6CA1\u6709\u78C1\u76D8\u8DEF\u5F84\uFF0C\u65E0\u6CD5\u653E\u5165\u5BF9\u8BDD");
      return false;
    }
    sendToComposer(path);
    flash("\u5DF2\u628A\u56FE\u7247\u8DEF\u5F84\u5199\u5165\u8F93\u5165\u6846");
    return true;
  }, [flash, sendToComposer]);
  const toggleSelect = (0, import_react10.useCallback)((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clearSelection = (0, import_react10.useCallback)(() => setSelected(/* @__PURE__ */ new Set()), []);
  const selectedItems = (0, import_react10.useMemo)(
    () => merged.filter((item) => selected.has(item.id)),
    [merged, selected]
  );
  const putIntoDialog = (0, import_react10.useCallback)(async () => {
    if (selectedItems.length === 0 || busy) return;
    setBusy(true);
    try {
      const filePaths = selectedItems.filter((item) => item.kind === "file" && item.path !== void 0).map((item) => item.path);
      const attachments = selectedItems.filter(
        (item) => item.kind === "attachment" && item.attachment !== void 0
      );
      let exportedNames = [];
      let exportDir = "";
      let failures = 0;
      if (attachments.length > 0) {
        const response = await fetch(EXPORT_ROUTE, {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: attachments.map((item) => ({ attachment: item.attachment }))
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          flash(`\u5BFC\u51FA\u4F1A\u8BDD\u9644\u4EF6\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
          return;
        }
        exportedNames = (payload.files ?? []).map((file) => typeof file.short === "string" ? file.short : "").filter((name) => name !== "");
        exportDir = typeof payload.dir === "string" ? payload.dir : "";
        failures = payload.failures?.length ?? 0;
      }
      if (filePaths.length === 0 && exportedNames.length === 0) {
        flash("\u6CA1\u6709\u53EF\u5199\u5165\u7684\u56FE\u7247");
        return;
      }
      const textLines = [...filePaths];
      if (exportedNames.length > 0) {
        textLines.push(exportedNames.join("\u3001"));
        textLines.push(`\uFF08\u4F1A\u8BDD\u9644\u4EF6\u5728 ${exportDir} \u4E0B\uFF0C\u6587\u4EF6\u540D\u5206\u522B\u4E3A ${exportedNames.join("\u3001")}.png\uFF09`);
      }
      const text = textLines.join("\n");
      const actions = inputActions;
      if (actions === void 0) {
        flash("\u8F93\u5165\u6846\u4E0D\u53EF\u7528\uFF08\u6CA1\u6709 inputActions\uFF09");
        return;
      }
      let wrote = false;
      try {
        wrote = actions.insertText(text, actions.captureInsertion());
      } catch {
        wrote = false;
      }
      if (!wrote) {
        try {
          actions.setDraft(text);
          wrote = true;
        } catch {
          wrote = false;
        }
      }
      if (!wrote) {
        flash("\u5199\u5165\u8F93\u5165\u6846\u5931\u8D25");
        return;
      }
      if (failures > 0) flash(`\u5DF2\u5199\u5165\u8F93\u5165\u6846\uFF08${failures} \u5F20\u4F1A\u8BDD\u9644\u4EF6\u5BFC\u51FA\u5931\u8D25\uFF09`);
      else flash(`\u5DF2\u628A ${filePaths.length + exportedNames.length} \u5F20\u56FE\u7247\u5199\u5165\u8F93\u5165\u6846`);
      clearSelection();
    } catch (cause) {
      flash(`\u653E\u5165\u5BF9\u8BDD\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setBusy(false);
    }
  }, [busy, clearSelection, flash, inputActions, selectedItems]);
  const putIntoWorkbench = (0, import_react10.useCallback)(() => {
    if (selectedItems.length === 0) return;
    setWorkbenchItems((prev) => {
      const seen = new Set(prev.map((item) => item.id));
      return [...prev, ...selectedItems.filter((item) => !seen.has(item.id))];
    });
    switchTab("workbench");
    flash(`\u5DF2\u653E\u5165\u5DE5\u4F5C\u53F0\uFF08${selectedItems.length} \u5F20\uFF09`);
    clearSelection();
  }, [clearSelection, flash, selectedItems]);
  const pushPathsToWorkbench = (0, import_react10.useCallback)((paths) => {
    if (paths.length === 0) return;
    setWorkbenchPaths((prev) => {
      const seen = new Set(prev);
      return [...prev, ...paths.filter((path) => !seen.has(path))];
    });
    switchTab("workbench");
    flash(`\u5DF2\u653E\u5165\u5DE5\u4F5C\u53F0\uFF08${paths.length} \u5F20\uFF09`);
  }, [flash]);
  const deletePaths = (0, import_react10.useCallback)(async (paths, permanent = false) => {
    if (paths.length === 0) return;
    try {
      const response = await fetch(DELETE_ROUTE2, {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paths: [...paths], permanent })
      });
      const text = await response.text();
      let payload = {};
      try {
        payload = JSON.parse(text);
      } catch {
        flash(`\u5220\u9664\u5931\u8D25\uFF1AHTTP ${response.status}`);
        return;
      }
      if (!response.ok) {
        flash(`\u5220\u9664\u5931\u8D25\uFF1A${String(payload.error ?? response.status)}`);
        return;
      }
      const ok = typeof payload.deleted === "number" ? payload.deleted : 0;
      flash(ok > 0 ? payload.mode === "recycle-bin" ? `\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9 ${ok} \u5F20` : `\u5DF2\u5220\u9664 ${ok} \u5F20` : "\u6CA1\u6709\u53EF\u5220\u9664\u7684\u56FE\uFF08\u4E0D\u5728\u56FE\u7247\u5E93\u91CC\uFF09");
      if (ok > 0) {
        setViewerId(null);
        setPendingViewerId(null);
        void refreshSessionFiles();
      }
    } catch (cause) {
      flash(`\u5220\u9664\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }, [flash, refreshSessionFiles]);
  const fileMenuItems = (0, import_react10.useCallback)((item) => {
    const path = item.path;
    const items = [
      { label: "\u67E5\u770B\u5927\u56FE", onSelect: () => setViewerId(item.id) }
    ];
    if (path !== void 0) {
      items.push(
        {
          label: "\u653E\u5165\u5BF9\u8BDD",
          onSelect: () => {
            sendToComposer(path);
            flash("\u5DF2\u628A\u56FE\u7247\u8DEF\u5F84\u5199\u5165\u8F93\u5165\u6846");
          }
        },
        { label: "\u653E\u5165\u5DE5\u4F5C\u53F0", onSelect: () => pushPathsToWorkbench([path]) },
        { label: "\u6253\u5F00\u6587\u4EF6\u5939", onSelect: () => revealPath(path) }
      );
    }
    items.push({
      label: isFavorite(item) ? "\u53D6\u6D88\u6536\u85CF" : "\u6536\u85CF",
      onSelect: () => toggleFavorite2(item.id)
    });
    if (path !== void 0) {
      items.push({ label: "\u5220\u9664", tone: "danger", onSelect: () => setBulkDelete([path]) });
    }
    return items;
  }, [favorites, flash, pushPathsToWorkbench, revealPath, sendToComposer, toggleFavorite2]);
  const pendingMenuItems = (0, import_react10.useCallback)((item) => [
    { label: "\u67E5\u770B\u5927\u56FE", onSelect: () => setPendingViewerId(item.id) },
    { label: "\u5B58\u5165\u56FE\u7247\u5E93", onSelect: () => {
      void archiveItems([item]);
    } },
    { label: "\u5FFD\u7565\u6B64\u56FE", onSelect: () => ignorePendingMany([item.id]) }
  ], [archiveItems, ignorePendingMany]);
  const count = merged.length + unarchived.length;
  const selectedCount = selected.size;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-root", children: [
    settingsOpen ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      SettingsPanel,
      {
        onClose: () => setSettingsOpen(false),
        onFlash: flash,
        onSaved: () => {
          void refreshSessionFiles();
          setLibraryKey((value) => value + 1);
        }
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-tabs", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            className: "dshsg-tab",
            "data-active": tab === "session" ? "true" : "false",
            onClick: () => switchTab("session"),
            children: "\u4F1A\u8BDD\u56FE\u7247"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            className: "dshsg-tab",
            "data-active": tab === "workbench" ? "true" : "false",
            onClick: () => switchTab("workbench"),
            children: "\u5DE5\u4F5C\u53F0"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            className: "dshsg-tab",
            "data-active": tab === "library" ? "true" : "false",
            onClick: () => switchTab("library"),
            children: "\u56FE\u7247\u5E93"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "dshsg-count", children: count > 0 ? `\u5171 ${count} \u5F20` : "" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "button",
          {
            className: "dshsg-chip dshsg-settings-trigger",
            title: "\u56FE\u7247\u5E93\u8BBE\u7F6E",
            onClick: () => setSettingsOpen(true),
            children: "\u2699"
          }
        )
      ] }),
      tab === "session" && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-toolbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
            "button",
            {
              className: "dshsg-chip",
              "data-on": onlyFavorite ? "true" : "false",
              onClick: () => setOnlyFavorite((v) => !v),
              children: [
                "\u2605 \u6536\u85CF",
                favoriteCount > 0 ? ` ${favoriteCount}` : ""
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              className: "dshsg-chip",
              onClick: () => {
                if (selectedCount === visible.length && visible.length > 0) clearSelection();
                else setSelected(new Set(visible.map((item) => item.id)));
              },
              children: selectedCount > 0 && selectedCount === visible.length ? "\u53D6\u6D88\u5168\u9009" : "\u5168\u9009"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: "dshsg-zoom", title: "\u7F29\u7565\u56FE\u5927\u5C0F\uFF08\u5411\u53F3\u62D6 = \u66F4\u5927\uFF09", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: "\u5C0F" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "input",
              {
                type: "range",
                min: 1,
                max: 6,
                step: 1,
                value: sizeLevel,
                onChange: (e) => {
                  const value = Number(e.currentTarget.value);
                  setSizeLevel(value);
                  try {
                    localStorage.setItem("dshsg:sizeLevel:v1", String(value));
                  } catch {
                  }
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: "\u5927" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              className: "dshsg-chip",
              title: "\u6E05\u7A7A\u300C\u653E\u5165\u5BF9\u8BDD\u300D\u5BFC\u51FA\u7684\u7F13\u5B58\u6587\u4EF6",
              onClick: () => {
                void (async () => {
                  try {
                    const response = await fetch(CLEAR_ROUTE, {
                      method: "POST",
                      credentials: "same-origin",
                      headers: { "content-type": "application/json" },
                      body: "{}"
                    });
                    const payload = await response.json();
                    flash(`\u5DF2\u6E05\u7406 ${String(payload.removed ?? 0)} \u4E2A\u7F13\u5B58\u6587\u4EF6`);
                  } catch {
                    flash("\u6E05\u7406\u5931\u8D25");
                  }
                })();
              },
              children: "\u6E05\u7F13\u5B58"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              className: "dshsg-chip",
              title: "\u628A\u672C\u5730\u56FE\u7247\u5BFC\u5165\u56FE\u7247\u5E93\uFF08\u5F52\u5230\u5F53\u524D\u4F1A\u8BDD\uFF09",
              onClick: () => {
                void (async () => {
                  if (sessionId === void 0 || sessionId === "") {
                    flash("\u6CA1\u6709\u4F1A\u8BDD\u4E0A\u4E0B\u6587");
                    return;
                  }
                  try {
                    const result = await pickAndImport(sessionId);
                    if (result === null) return;
                    flash(result.message);
                    if (result.saved > 0) void refreshSessionFiles();
                  } catch (cause) {
                    flash(`\u5BFC\u5165\u5931\u8D25\uFF1A${cause instanceof Error ? cause.message : String(cause)}`);
                  }
                })();
              },
              children: "\u5BFC\u5165"
            }
          )
        ] }),
        selectedCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-actionbar", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "dshsg-actionbar-count", children: [
            "\u5DF2\u9009 ",
            selectedCount,
            " \u5F20"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "dshsg-action", disabled: busy, onClick: () => {
            void putIntoDialog();
          }, children: "\u653E\u5165\u5BF9\u8BDD" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "dshsg-action", disabled: busy, onClick: putIntoWorkbench, children: "\u653E\u5165\u5DE5\u4F5C\u53F0" }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "button",
            {
              className: "dshsg-action dshsg-action-danger",
              disabled: busy,
              title: "\u5220\u9664\u9009\u4E2D\u7684\u56FE\uFF08\u9ED8\u8BA4\u8FDB Windows \u56DE\u6536\u7AD9\uFF09\u3002\u53EA\u6709\u5DF2\u5B58\u8FDB\u56FE\u7247\u5E93\u7684\u56FE\u80FD\u5220",
              onClick: () => {
                const paths = selectedItems.map((item) => item.path).filter((path) => typeof path === "string" && path !== "");
                if (paths.length === 0) {
                  flash("\u9009\u4E2D\u7684\u56FE\u8FD8\u6CA1\u5B58\u8FDB\u56FE\u7247\u5E93\uFF0C\u65E0\u6CD5\u5220\u9664\uFF08\u53EF\u7528\u67E5\u770B\u5668\u91CC\u7684\u300C\u5FFD\u7565\u6B64\u56FE\u300D\uFF09");
                  return;
                }
                if (paths.length < selectedItems.length) {
                  flash(`\u5176\u4E2D ${paths.length} \u5F20\u5728\u56FE\u7247\u5E93\u91CC\uFF0C\u53EA\u5220\u8FD9\u4E9B`);
                }
                setBulkDelete(paths);
              },
              children: "\u5220\u9664"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("button", { className: "dshsg-action dshsg-action-ghost", onClick: clearSelection, children: "\u6E05\u7A7A" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-scroll", children: [
          loading && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshsg-empty", children: "\u6B63\u5728\u8BFB\u53D6\u4F1A\u8BDD\u56FE\u7247\u2026" }),
          !loading && error !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-empty", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: "\u8BFB\u53D6\u5931\u8D25" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: error })
          ] }),
          !loading && unarchived.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-pending", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-pending-head", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "dshsg-pending-title", children: [
                "\u672A\u5F52\u6863 ",
                unarchived.length,
                " \u5F20 \xB7 \u53EA\u5728\u5BF9\u8BDD\u91CC\u53EF\u89C1\uFF0C\u8FD8\u6CA1\u8FDB\u56FE\u7247\u5E93"
              ] }),
              unarchived.length > PENDING_LIMIT && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "button",
                {
                  className: "dshsg-chip",
                  onClick: () => setShowAllPending((value) => !value),
                  children: showAllPending ? `\u4EC5\u770B\u6700\u8FD1 ${PENDING_LIMIT} \u5F20` : `\u8FD8\u6709 ${unarchived.length - PENDING_LIMIT} \u5F20\uFF08\u5C55\u5F00\uFF09`
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "button",
                {
                  className: "dshsg-chip",
                  title: "\u9009\u4E2D\u672A\u5F52\u6863\u533A\u7684**\u5168\u90E8**\u56FE\uFF08\u542B\u88AB\u6298\u53E0\u7684\uFF09\uFF0C\u914D\u5408\u300C\u5FFD\u7565\u300D\u4E00\u6B21\u6E05\u7A7A",
                  onClick: () => setPendingSelected(new Set(unarchived.map((item) => item.id))),
                  children: "\u5168\u9009"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "button",
                {
                  className: "dshsg-action",
                  disabled: pendingSelected.size === 0 || archiving,
                  onClick: () => {
                    void archivePending();
                  },
                  children: archiving ? "\u5B58\u5165\u4E2D\u2026" : `\u5B58\u5165\u56FE\u7247\u5E93\uFF08${pendingSelected.size}\uFF09`
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
                "button",
                {
                  className: "dshsg-action dshsg-action-ghost",
                  disabled: pendingSelected.size === 0,
                  title: "\u628A\u9009\u4E2D\u7684\u56FE\u4ECE\u300C\u672A\u5F52\u6863\u300D\u91CC\u9690\u85CF\uFF08\u8BB0\u5728\u672C\u5730\uFF0C\u53EF\u5728\u8BBE\u7F6E\u9875\u6E05\u7A7A\uFF09",
                  onClick: () => ignorePendingMany([...pendingSelected]),
                  children: [
                    "\u5FFD\u7565\uFF08",
                    pendingSelected.size,
                    "\uFF09"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshsg-pending-list", children: visiblePending.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              PendingThumb,
              {
                item,
                resolveUrl,
                selected: pendingSelected.has(item.id),
                onOpen: () => setPendingViewerId(item.id),
                onToggle: () => {
                  setPendingSelected((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  });
                },
                onContext: ({ x, y }) => setCtxMenu({ kind: "pending", x, y, item }),
                onMiddleClick: () => {
                  const found = pendingViewerItems.find((entry) => entry.id === item.id);
                  if (found !== void 0) setPaneItem({ kind: "pending", item: found });
                }
              },
              item.id
            )) })
          ] }),
          !loading && error === null && visible.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-empty", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: onlyFavorite ? "\u8FD8\u6CA1\u6709\u6536\u85CF\u7684\u56FE" : "\u8FD9\u4E2A\u4F1A\u8BDD\u91CC\u8FD8\u6CA1\u6709\u56FE\u7247" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: "\u5728\u5BF9\u8BDD\u4E2D\u53D1\u56FE\u3001\u6216\u8BA9 Agent \u751F\u6210\u56FE\u7247\u540E\uFF0C\u4F1A\u81EA\u52A8\u51FA\u73B0\u5728\u8FD9\u91CC\u3002" }),
            debug !== "" && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("details", { style: { marginTop: 12, textAlign: "left", width: "100%", fontSize: 10, opacity: 0.75 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("summary", { style: { cursor: "pointer" }, children: "\u8BCA\u65AD\u4FE1\u606F\uFF08\u6392\u67E5\u7528\uFF09" }),
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { style: { wordBreak: "break-all", marginTop: 6, lineHeight: 1.6 }, children: debug })
            ] })
          ] }),
          !loading && visible.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "div",
            {
              className: "dshsg-grid",
              style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` },
              children: visible.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                Thumb,
                {
                  item,
                  resolveUrl,
                  favorite: isFavorite(item),
                  selected: selected.has(item.id),
                  onOpen: () => setViewerId(item.id),
                  onToggleSelect: () => toggleSelect(item.id),
                  onContext: ({ x, y }) => setCtxMenu({ kind: "file", x, y, item }),
                  onMiddleClick: () => {
                    const found = viewerItems.find((entry) => entry.id === item.id);
                    if (found !== void 0) setPaneItem({ kind: "file", item: found });
                  }
                },
                item.id
              ))
            }
          )
        ] })
      ] }),
      tab === "library" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        LibraryView,
        {
          inputActions,
          sessionId,
          onFlash: flash,
          sizeLevel,
          onSizeLevelChange: (level) => {
            setSizeLevel(level);
            try {
              localStorage.setItem("dshsg:sizeLevel:v1", String(level));
            } catch {
            }
          },
          onPutToWorkbench: (paths) => {
            pushPathsToWorkbench(paths);
          }
        },
        libraryKey
      ),
      tab === "workbench" && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        Workbench,
        {
          items: workbenchSources,
          onRequestEdit: sendToComposer,
          onRemove: (path) => {
            setWorkbenchItems((prev) => prev.filter((item) => item.path !== path));
            setWorkbenchPaths((prev) => prev.filter((entry) => entry !== path));
          },
          onClear: () => {
            setWorkbenchItems([]);
            setWorkbenchPaths([]);
          }
        }
      ),
      viewerIndex >= 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        GalleryLightbox,
        {
          items: viewerItems,
          index: viewerIndex,
          resolveUrl: resolveViewerUrl,
          favorites,
          favoriteOf: (viewerItem) => {
            const found = visible.find((candidate) => candidate.id === viewerItem.id);
            return found === void 0 ? false : isFavorite(found);
          },
          onClose: () => setViewerId(null),
          onIndexChange: (next) => setViewerId(viewerItems[next]?.id ?? null),
          onCopy: copyImage,
          onToggleFavorite: toggleFavorite2,
          onPutToDialog: (item) => {
            if (putPathToDialog(item)) setViewerId(null);
          },
          onReveal: revealItem,
          onPutToWorkbench: (item) => {
            pushPathsToWorkbench([item.path ?? item.id]);
            setViewerId(null);
          },
          onDelete: (item, permanent) => {
            void deletePaths([item.path ?? item.id], permanent);
          },
          onCompare: (picked) => {
            setViewerId(null);
            setCompare({ items: picked, pending: false });
          }
        }
      ),
      pendingViewerIndex >= 0 && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        GalleryLightbox,
        {
          items: pendingViewerItems,
          index: pendingViewerIndex,
          resolveUrl: (item) => {
            const found = unarchived.find((candidate) => candidate.id === item.id);
            if (found === void 0) return Promise.reject(new Error("\u56FE\u7247\u4E0D\u5B58\u5728"));
            return resolveUrl(found.attachment);
          },
          favorites,
          favoriteOf: (viewerItem) => {
            const found = unarchived.find((candidate) => candidate.id === viewerItem.id);
            if (found === void 0) return false;
            const key = favoriteKeyOf({ attachmentId: found.attachment.attachmentId });
            return key !== void 0 && favorites.has(key);
          },
          onClose: () => setPendingViewerId(null),
          onIndexChange: (next) => setPendingViewerId(pendingViewerItems[next]?.id ?? null),
          onCopy: copyImage,
          onPutToDialog: (item) => {
            if (putPathToDialog(item)) setPendingViewerId(null);
          },
          onReveal: revealItem,
          onArchive: (item) => {
            const found = unarchived.find((candidate) => candidate.id === item.id);
            if (found !== void 0) void archiveItems([found]);
          },
          onToggleFavorite: (id) => {
            const found = unarchived.find((candidate) => candidate.id === id);
            if (found !== void 0) void favoritePending(found);
          },
          onIgnore: (item) => {
            ignorePending(item.id);
            setPendingViewerId(null);
          },
          onCompare: (picked) => {
            setPendingViewerId(null);
            setCompare({ items: picked, pending: true });
          }
        }
      ),
      compare !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        CompareView,
        {
          items: compare.items,
          resolveUrl: resolveCompareUrl,
          onClose: () => setCompare(null)
        }
      )
    ] }),
    bulkDelete !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      ConfirmDelete,
      {
        names: bulkDelete.map((path) => path.split(/[\\/]/).pop() ?? path),
        onCancel: () => setBulkDelete(null),
        onConfirm: (permanent) => {
          void deletePaths(bulkDelete, permanent);
          setBulkDelete(null);
        }
      }
    ),
    ctxMenu !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      ImageContextMenu,
      {
        x: ctxMenu.x,
        y: ctxMenu.y,
        onClose: () => setCtxMenu(null),
        items: ctxMenu.kind === "file" ? fileMenuItems(ctxMenu.item) : pendingMenuItems(ctxMenu.item)
      }
    ),
    paneItem !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
      "div",
      {
        className: "dshsg-pane",
        onMouseDown: (event) => {
          if (event.button === 1) event.preventDefault();
        },
        onAuxClick: (event) => {
          if (event.button === 1) {
            event.preventDefault();
            setPaneItem(null);
          }
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-pane-bar", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "dshsg-pane-name", children: paneItem.item.name ?? "\u56FE\u7247" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
              "button",
              {
                className: "dshsg-chip",
                onClick: () => setPaneItem(null),
                title: "\u9000\u51FA\u5927\u56FE\uFF08\u6216\u518D\u6309\u4E00\u6B21\u9F20\u6807\u4E2D\u952E\uFF09",
                children: "\u2715"
              }
            )
          ] }),
          paneUrl === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshsg-empty", children: "\u52A0\u8F7D\u4E2D\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
            "div",
            {
              className: "dshsg-pane-stage",
              onWheel: (event) => {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                const px = event.clientX - rect.left - rect.width / 2;
                const py = event.clientY - rect.top - rect.height / 2;
                const { zoom, offset } = paneViewRef.current;
                const next = Math.min(8, Math.max(0.3, zoom * Math.exp(-event.deltaY * 15e-4)));
                const k = next / zoom;
                setPaneZoom(next);
                setPaneOffset({
                  x: px - k * (px - offset.x),
                  y: py - k * (py - offset.y)
                });
              },
              onPointerDown: (event) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                paneDragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  ox: paneOffset.x,
                  oy: paneOffset.y
                };
                setPaneDragging(true);
              },
              onPointerMove: (event) => {
                const drag = paneDragRef.current;
                if (drag === null) return;
                setPaneOffset({
                  x: drag.ox + (event.clientX - drag.x),
                  y: drag.oy + (event.clientY - drag.y)
                });
              },
              onPointerUp: (event) => {
                paneDragRef.current = null;
                setPaneDragging(false);
                try {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                } catch {
                }
              },
              onPointerCancel: () => {
                paneDragRef.current = null;
                setPaneDragging(false);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
                "img",
                {
                  src: paneUrl,
                  alt: "",
                  draggable: false,
                  "data-dragging": paneDragging ? "true" : "false",
                  style: {
                    transform: `translate(${paneOffset.x}px, ${paneOffset.y}px) scale(${paneZoom})`,
                    transition: paneDragging ? "none" : "transform .12s ease-out"
                  }
                }
              )
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "dshsg-pane-hint", children: [
            Math.round(paneZoom * 100),
            "% \xB7 \u6EDA\u8F6E\u7F29\u653E \xB7 \u5DE6\u952E\u62D6\u52A8 \xB7 \u4E2D\u952E / \u2715 \u9000\u51FA"
          ] })
        ]
      }
    ),
    toast !== null && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshsg-toast", children: toast })
  ] });
}
function PendingThumb(props) {
  const { item, resolveUrl, selected, onOpen, onToggle, onContext, onMiddleClick } = props;
  const [url, setUrl] = (0, import_react10.useState)(void 0);
  (0, import_react10.useEffect)(() => {
    let alive = true;
    resolveUrl(item.attachment).then((value) => {
      if (alive) setUrl(value);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [item.attachment, resolveUrl]);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "button",
    {
      className: "dshsg-pending-thumb",
      "data-selected": selected ? "true" : "false",
      onClick: onOpen,
      onContextMenu: (event) => {
        event.preventDefault();
        onContext({ x: event.clientX, y: event.clientY });
      },
      onMouseDown: (event) => {
        if (event.button === 1) event.preventDefault();
      },
      onAuxClick: (event) => {
        if (event.button === 1) {
          event.preventDefault();
          onMiddleClick();
        }
      },
      title: `${item.origin === "user" ? "\u4F60\u53D1\u7684" : "\u5DE5\u5177\u4EA7\u7269"} \xB7 \u70B9\u51FB\u770B\u5927\u56FE\uFF1B\u4E2D\u952E\u5728\u4FA7\u680F\u5185\u5C55\u5F00\uFF1B\u53F3\u952E\u66F4\u591A\u64CD\u4F5C`,
      children: [
        url !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("img", { src: url, alt: "", loading: "lazy", draggable: false }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshsg-card-placeholder", children: "\u2026" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "span",
          {
            className: "dshsg-check",
            "data-checked": selected ? "true" : "false",
            role: "checkbox",
            "aria-checked": selected,
            tabIndex: -1,
            onClick: (e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggle();
            },
            children: selected ? "\u2713" : ""
          }
        )
      ]
    }
  );
}
function Thumb(props) {
  const { item, resolveUrl, favorite, selected, onOpen, onToggleSelect, onContext, onMiddleClick } = props;
  const ref = (0, import_react10.useRef)(null);
  const initialUrl = item.kind === "file" && item.path !== void 0 ? fileUrlOf(item.path) : void 0;
  const [url, setUrl] = (0, import_react10.useState)(initialUrl);
  const [need, setNeed] = (0, import_react10.useState)(item.kind === "file");
  (0, import_react10.useEffect)(() => {
    if (item.kind === "file") return;
    const el = ref.current;
    if (el === null) return;
    if (typeof IntersectionObserver === "undefined") {
      setNeed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNeed(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [item.kind]);
  (0, import_react10.useEffect)(() => {
    if (item.kind === "file") {
      setUrl(item.path === void 0 ? void 0 : fileUrlOf(item.path));
      return;
    }
    if (!need || item.attachment === void 0) return;
    let alive = true;
    resolveUrl(item.attachment).then((value) => {
      if (alive) setUrl(value);
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, [need, item.kind, item.path, item.attachment, resolveUrl]);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "button",
    {
      className: "dshsg-card",
      ref,
      "data-selected": selected ? "true" : "false",
      onClick: onOpen,
      onContextMenu: (event) => {
        event.preventDefault();
        onContext({ x: event.clientX, y: event.clientY });
      },
      onMouseDown: (event) => {
        if (event.button === 1) event.preventDefault();
      },
      onAuxClick: (event) => {
        if (event.button === 1) {
          event.preventDefault();
          onMiddleClick();
        }
      },
      title: `${item.name}
\u70B9\u51FB\u67E5\u770B\u5927\u56FE\uFF1B\u4E2D\u952E\u5728\u4FA7\u680F\u5185\u5C55\u5F00\uFF1B\u53F3\u952E\u66F4\u591A\u64CD\u4F5C\uFF1B\u6709\u8DEF\u5F84\u7684\u56FE\u53EF\u4EE5\u76F4\u63A5\u62D6\u8FDB\u8F93\u5165\u6846`,
      children: [
        url !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "img",
          {
            src: url,
            alt: "",
            loading: "lazy",
            draggable: item.path !== void 0,
            onDragStart: (event) => {
              if (item.path === void 0) {
                event.preventDefault();
                return;
              }
              event.dataTransfer.setData("text/plain", item.path);
              event.dataTransfer.effectAllowed = "copy";
            }
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "dshsg-card-placeholder", children: need ? "\u52A0\u8F7D\u4E2D\u2026" : "" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
          "span",
          {
            className: "dshsg-check",
            "data-checked": selected ? "true" : "false",
            role: "checkbox",
            "aria-checked": selected,
            tabIndex: -1,
            onClick: (e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleSelect();
            },
            children: selected ? "\u2713" : ""
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "dshsg-badge", children: [
          favorite ? "\u2605 " : "",
          originLabel(item.meta?.origin),
          " \xB7 ",
          formatRelative(item.time)
        ] })
      ]
    }
  );
}

// src/client/index.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var TAB_ID = "dsh-session-gallery/gallery";
var TAB_KIND = "dsh-session-gallery";
function GuardedPanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PanelErrorBoundary, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SessionGalleryPanel, { ...props }) });
}
var inject = ["slots"];
function injectStyle(tagId, css) {
  if (typeof document === "undefined") return;
  if (document.querySelector(`style[data-plugin-css="${tagId}"]`) !== null) return;
  const el = document.createElement("style");
  el.setAttribute("data-plugin-css", tagId);
  el.textContent = css;
  document.head.appendChild(el);
}
function apply(ctx) {
  injectStyle("dsh-session-gallery/panel.css", PANEL_CSS);
  const tabTitle = () => "\u4F1A\u8BDD\u56FE\u7247";
  ctx.inject(["sidebarRightTabs", "sessions", "uiConversation"], (rawOwner) => {
    const owner = rawOwner;
    const tabs = owner.get("sidebarRightTabs");
    const sessions = owner.get("sessions");
    const uiConversation = owner.get("uiConversation");
    owner.effect(() => tabs.register({
      id: TAB_ID,
      kind: TAB_KIND,
      priority: "extension",
      keepMounted: true,
      title: tabTitle,
      guide: [{ id: "open", order: 60, title: tabTitle }]
    }), "session-gallery: sidebar tab type");
    const register = owner.slots.register.bind(owner.slots);
    owner.slots.inject("sidebar.right.pane.tab", () => register({
      name: "sidebar.right.pane.tab",
      key: TAB_ID,
      inject: () => ({ sessions, uiConversation })
    }, GuardedPanel));
  });
}

		return module.exports;
	}
});

