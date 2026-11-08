/**
 * 面板样式（文本，由 index.tsx 注入 <head>）。
 * 约定：本包独占 `dshsg-` 前缀；只用 DSH 语义令牌，令牌缺失时退回中性色。
 */
export const PANEL_CSS = `
.dshsg-root {
  position: relative; /* 供「侧边栏内嵌大图」absolute 定位 */
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: var(--dsw-alias-label-primary, #e6e6e6);
  background: transparent;
  font-size: 12px;
}
/* 错误边界：面板渲染抛错时显示，别再白屏 */
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

/* ---------- 侧边栏内嵌大图（鼠标中键开关） ---------- */
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

/* ---------- 顶部子标签 ---------- */
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

/* ---------- 来源切换（会话图片 / 图片库） ---------- */
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
/* ---------- 查看器左右浮条（鼠标移开淡出，文字可拖选复制） ---------- */
.dshsg-lb-rail {
  position: absolute;
  /* 让开「桌面版标题栏」(--dshsg-titlebar) + 顶部条 */
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
  /* 默认半透明，鼠标移上来才实心 —— 不挡图 */
  opacity: .32;
  transition: opacity .18s ease;
  z-index: 3;
  /* 外层 lightbox 是 user-select: none，浮条必须放开，才能拖选复制 */
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

/* ---------- 工具条 ---------- */
.dshsg-toolbar {
  display: flex;
  align-items: center;
  /* 元素多了要能换行：分组 + 时间 + 搜索 + 一排按钮，窄侧栏放不下 */
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

/* 来源筛选：多选标签行（原先是单选下拉，2026-11-05 改多选） */
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
/* 缩略图大小滑块 */
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

/* ---------- 图库网格 ---------- */
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

/* 左上角勾选 */
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

/* 勾选后的操作条 */
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

/* ---------- 删除确认层 ---------- */
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

/* ---------- 未归档区（只在对话里可见、未入图片库的图） ---------- */
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


/* ---------- 设置页（侧栏内联，不是浮窗） ---------- */
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

/* ---------- 浮窗（灯箱） ---------- */
.dshsg-lightbox {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  background: rgba(0,0,0,.82);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  user-select: none;
  /* 桌面版把「最小化/最大化/关闭」浮在页面最上层，会压住顶部条。
     这里给标题栏让出高度；实际值由组件用 windowControlsOverlay 探测后覆盖。 */
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
/* 顶部条：上一张 / 文件名 / 计数 / 下一张 / 关闭（整窗唯一的关闭按钮）
   右侧留出窗口控制按钮（最小化/最大化/关闭）的宽度，避免互相遮挡 */
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
  margin-left: -1px; /* 两条边框重叠成一条 */
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

/* ---------- 灯箱：对比入口与挑图条（2026-11-08） ---------- */
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

/* ---------- 并排对比视图 ---------- */
.dshsg-cmp-mask {
  position: fixed;
  inset: 0;
  z-index: 2147483100; /* 盖在灯箱之上 */
  background: rgba(0, 0, 0, .9);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  padding-top: 38px; /* 让开窗口控制按钮 */
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
/* 同步缩放控件（2026-11-08）：滚轮也能用，这里给不想滚的人 */
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
  /* Pointer 拖拽：不设这个的话浏览器会把手势判成页面滚动 / 长按选择 */
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

/* ---------- 工作台画布 ---------- */
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
/* 选中某张图后出现的对比控制条 */
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
  /* Chromium 的原生图片拖拽必须两层都禁：draggable=false + 这里，
     否则会拖出一个半透明 ghost 并抢走 pointermove */
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

/* 缩略图右键菜单：比大图低一层、比普通内容高得多 */
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
/* ---------- 出图日志面板 ---------- */
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

/* ---------- 收藏标记（缩略图右上角红心） ---------- */
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
`
