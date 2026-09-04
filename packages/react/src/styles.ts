export const overlayStyles = `
:host { all: initial; color-scheme: light; }
*, *::before, *::after { box-sizing: border-box; }
button, input, textarea, select { font: inherit; }
button { cursor: pointer; }
button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid #be3227; outline-offset: 2px; }
.rp-layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font: 14px/1.4 ui-sans-serif, system-ui, sans-serif; color: #17211c; }
.rp-banner { pointer-events: none; position: fixed; top: 0; left: 0; right: 0; z-index: 3; padding: 10px 16px; background: #222c27; color: #eef3f0; font: 600 12px/1.4 ui-sans-serif, system-ui, sans-serif; text-align: center; }
.rp-toolbar { pointer-events: auto; position: fixed; z-index: 1; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; padding: 7px; border: 1px solid #526058; background: #222c27; color: #eef3f0; box-shadow: 0 18px 45px rgb(18 29 23 / 28%); }
.rp-brand { padding: 0 10px 0 6px; font-weight: 750; letter-spacing: -.02em; }
.rp-tool, .rp-primary, .rp-quiet { min-height: 38px; border: 1px solid #526058; border-radius: 2px; padding: 0 12px; background: transparent; color: inherit; }
.rp-tool[aria-pressed=true] { border-color: #8fa4ff; background: #3457d5; }
.rp-primary { border-color: #3457d5; background: #3457d5; color: white; font-weight: 700; }
.rp-quiet { color: #cad3cf; }
.rp-count { min-width: 22px; height: 22px; padding: 0 6px; display: inline-grid; place-items: center; background: #be3227; color: white; font: 700 11px ui-monospace, monospace; }
.rp-hover { position: fixed; border: 2px solid #be3227; box-shadow: 0 0 0 3px rgb(190 50 39 / 13%); transition: opacity 120ms ease; }
.rp-hover-label { position: absolute; left: -2px; bottom: 100%; max-width: min(520px, 90vw); padding: 5px 8px; background: #be3227; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 600 11px/1.3 ui-monospace, monospace; }
.rp-lasso { position: fixed; border: 2px solid #3457d5; background: rgb(52 87 213 / 10%); }
.rp-group-target { position: fixed; border: 2px solid #3457d5; background: rgb(52 87 213 / 6%); }
.rp-popup, .rp-tray { pointer-events: auto; position: fixed; z-index: 2; border: 1px solid #aebbb4; background: #f7f9f7; box-shadow: 0 20px 50px rgb(18 29 23 / 22%); animation: rp-enter 120ms ease both; }
.rp-popup { width: min(390px, calc(100vw - 24px)); max-height: min(620px, calc(100vh - 24px)); overflow: auto; padding: 16px; }
.rp-tray { top: 18px; right: 18px; width: min(390px, calc(100vw - 36px)); max-height: calc(100vh - 92px); overflow: auto; }
.rp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #d5ddd8; }
.rp-head h2, .rp-head h3 { margin: 0; font-size: 16px; line-height: 1.15; }
.rp-kicker { margin: 0 0 4px; color: #3457d5; font: 700 10px ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.rp-meta { margin: 10px 0; color: #627069; font: 11px/1.5 ui-monospace, monospace; overflow-wrap: anywhere; }
.rp-field { display: grid; gap: 5px; margin-top: 11px; }
.rp-field span { color: #526058; font-size: 11px; font-weight: 700; }
.rp-field input, .rp-field textarea, .rp-field select { width: 100%; border: 1px solid #aebbb4; border-radius: 2px; background: white; color: #17211c; padding: 9px 10px; }
.rp-field textarea { min-height: 78px; resize: vertical; }
.rp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.rp-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 7px; margin-top: 14px; }
.rp-targets, .rp-corrections { display: grid; gap: 8px; margin: 12px 0; }
.rp-target, .rp-correction { border: 1px solid #d5ddd8; background: white; padding: 10px; }
.rp-target, .rp-correction-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 9px; }
.rp-target code, .rp-correction code { color: #627069; font: 10px/1.5 ui-monospace, monospace; overflow-wrap: anywhere; }
.rp-link { min-height: 30px; border: 0; border-bottom: 1px solid currentColor; background: transparent; color: #3457d5; padding: 0 3px; font-size: 11px; font-weight: 700; }
.rp-danger { color: #be3227; }
.rp-summary { margin: 7px 0 0; font-size: 12px; }
.rp-status { display: flex; align-items: center; gap: 7px; color: #627069; font: 10px ui-monospace, monospace; }
.rp-status::before { content: ''; width: 8px; height: 8px; background: #7fc68f; }
.rp-stale { color: #be3227; }
.rp-empty { padding: 28px 16px; color: #627069; text-align: center; }
.rp-edit { margin-top: 8px; display: flex; gap: 6px; }
.rp-edit input { min-width: 0; flex: 1; border: 1px solid #aebbb4; padding: 7px; }
.rp-payload { max-height: 210px; margin: 10px 0; padding: 10px; overflow: auto; border: 1px solid #d5ddd8; background: #222c27; color: #e9efec; white-space: pre-wrap; font: 10px/1.45 ui-monospace, monospace; }
button:disabled { cursor: not-allowed; opacity: .45; }
@keyframes rp-enter { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { .rp-popup, .rp-tray, .rp-hover { animation: none; transition: none; } }
@media (max-width: 640px) { .rp-toolbar { left: 10px; right: 10px; bottom: 10px; transform: none; overflow-x: auto; } .rp-brand { display: none; } .rp-tray { top: 10px; right: 10px; } .rp-grid { grid-template-columns: 1fr; } }
`
