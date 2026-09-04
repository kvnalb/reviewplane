export const overlayStyles = `
:host { all: initial; color-scheme: light; }
*, *::before, *::after { box-sizing: border-box; }
button, input, textarea, select { font: inherit; }
button { cursor: pointer; }
button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #5b5cf0; outline-offset: 2px; }
.rp-layer { --ink: #18181b; --muted: #71717a; --line: rgb(24 24 27 / 11%); --accent: #5b5cf0; --danger: #dc2626; position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font: 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); }
.rp-toolbar { pointer-events: auto; position: fixed; z-index: 1; left: 50%; bottom: 20px; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; padding: 6px; border: 1px solid rgb(255 255 255 / 14%); border-radius: 14px; background: rgb(20 20 24 / 88%); color: #fafafa; box-shadow: 0 18px 55px rgb(0 0 0 / 28%), inset 0 1px rgb(255 255 255 / 8%); backdrop-filter: blur(24px) saturate(1.35); }
.rp-brand { display: inline-flex; align-items: center; gap: 8px; padding: 0 12px 0 8px; font-size: 12px; font-weight: 650; letter-spacing: -.01em; white-space: nowrap; }
.rp-brand::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: linear-gradient(135deg, #8b8cf8, #4f46e5); box-shadow: 0 0 14px rgb(99 102 241 / 90%); }
.rp-tool, .rp-primary, .rp-quiet, .rp-secondary { min-height: 36px; border-radius: 8px; padding: 0 12px; font-weight: 580; transition: background 120ms ease, border-color 120ms ease, color 120ms ease, transform 120ms ease; }
.rp-tool { border: 1px solid transparent; background: rgb(255 255 255 / 5%); color: #d4d4d8; }
.rp-tool:hover, .rp-quiet:hover { background: rgb(255 255 255 / 10%); color: white; }
.rp-tool[aria-pressed=true] { border-color: rgb(139 140 248 / 55%); background: linear-gradient(180deg, #696af4, #5556e8); color: white; box-shadow: 0 5px 16px rgb(79 70 229 / 35%), inset 0 1px rgb(255 255 255 / 18%); }
.rp-primary { border: 1px solid #4f46e5; background: linear-gradient(180deg, #6466ee, #4f46e5); color: white; box-shadow: 0 5px 14px rgb(79 70 229 / 20%), inset 0 1px rgb(255 255 255 / 20%); }
.rp-primary:hover { background: linear-gradient(180deg, #6f70f3, #5750e7); transform: translateY(-1px); }
.rp-quiet { border: 1px solid transparent; background: transparent; color: #a1a1aa; }
.rp-secondary { border: 1px solid #d4d4d8; background: rgb(255 255 255 / 72%); color: #3f3f46; }
.rp-secondary:hover { border-color: #a1a1aa; background: white; }
.rp-count { min-width: 19px; height: 19px; margin-left: 4px; padding: 0 5px; display: inline-grid; place-items: center; border-radius: 999px; background: #696af4; color: white; font: 650 10px ui-monospace, SFMono-Regular, monospace; }
.rp-hover { pointer-events: none; position: fixed; border: 2px solid #6567f1; border-radius: 5px; box-shadow: 0 0 0 3px rgb(91 92 240 / 15%), 0 0 24px rgb(91 92 240 / 14%); transition: opacity 100ms ease; }
.rp-hover-label { position: absolute; left: -2px; bottom: calc(100% + 5px); max-width: min(520px, 90vw); padding: 5px 8px; border-radius: 6px; background: #5556e8; color: white; box-shadow: 0 6px 18px rgb(79 70 229 / 25%); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font: 600 10px/1.3 ui-monospace, SFMono-Regular, monospace; }
.rp-lasso { pointer-events: none; position: fixed; border: 1.5px solid #6567f1; border-radius: 6px; background: rgb(91 92 240 / 10%); box-shadow: 0 0 0 1px rgb(255 255 255 / 50%) inset; }
.rp-group-target { pointer-events: none; position: fixed; border: 1.5px solid #6567f1; border-radius: 5px; background: rgb(91 92 240 / 7%); box-shadow: 0 0 18px rgb(91 92 240 / 10%); }
.rp-popup, .rp-tray { pointer-events: auto; position: fixed; z-index: 2; border: 1px solid rgb(255 255 255 / 72%); border-radius: 16px; background: rgb(250 250 252 / 92%); box-shadow: 0 24px 70px rgb(24 24 27 / 20%), 0 2px 8px rgb(24 24 27 / 8%), inset 0 1px white; backdrop-filter: blur(28px) saturate(1.18); animation: rp-enter 140ms cubic-bezier(.2,.8,.2,1) both; }
.rp-popup { width: min(400px, calc(100vw - 24px)); max-height: min(650px, calc(100vh - 24px)); overflow: auto; padding: 18px; }
.rp-tray { top: 18px; right: 18px; width: min(380px, calc(100vw - 36px)); max-height: calc(100vh - 92px); overflow: auto; padding: 18px; }
.rp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.rp-head h2, .rp-head h3 { margin: 0; color: #18181b; font-size: 17px; font-weight: 680; line-height: 1.2; letter-spacing: -.025em; }
.rp-kicker { margin: 0 0 4px; color: #6768df; font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
.rp-meta { margin: 10px 0; color: var(--muted); font: 11px/1.5 ui-monospace, SFMono-Regular, monospace; overflow-wrap: anywhere; }
.rp-field { display: grid; gap: 6px; margin-top: 13px; }
.rp-field > span:first-child { color: #52525b; font-size: 11px; font-weight: 620; }
.rp-field input, .rp-field textarea, .rp-field select { width: 100%; border: 1px solid #d4d4d8; border-radius: 8px; background: rgb(255 255 255 / 82%); color: #18181b; padding: 9px 10px; box-shadow: 0 1px 2px rgb(24 24 27 / 4%); transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease; }
.rp-field input:hover, .rp-field textarea:hover, .rp-field select:hover { border-color: #a1a1aa; background: white; }
.rp-field input:focus, .rp-field textarea:focus, .rp-field select:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgb(99 102 241 / 12%); }
.rp-field output { float: right; color: #27272a; font: 600 11px ui-monospace, SFMono-Regular, monospace; }
.rp-color-control { display: grid; grid-template-columns: 40px 1fr; gap: 7px; }
.rp-field .rp-color-control input[type=color] { height: 38px; padding: 4px; cursor: pointer; }
.rp-field input[type=range] { height: 38px; padding: 0; border: 0; background: transparent; box-shadow: none; accent-color: var(--accent); cursor: pointer; }
.rp-field textarea { min-height: 82px; resize: vertical; }
.rp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rp-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 7px; margin-top: 15px; }
.rp-tray .rp-quiet { border-color: #e4e4e7; color: #52525b; }
.rp-complete { margin-top: 14px; }
.rp-complete-message { display: grid; grid-template-columns: 34px 1fr; gap: 11px; align-items: start; padding: 13px; border: 1px solid #c7d2fe; border-radius: 11px; background: linear-gradient(135deg, rgb(238 242 255 / 94%), rgb(245 243 255 / 88%)); }
.rp-complete-message strong { display: block; color: #27272a; font-size: 13px; }
.rp-complete-message p { margin: 3px 0 0; color: #62626d; font-size: 11px; }
.rp-check { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: linear-gradient(135deg, #696af4, #4f46e5); color: white; box-shadow: 0 6px 14px rgb(79 70 229 / 22%); font-weight: 800; }
.rp-submitted-list { margin: 12px 0; border-block: 1px solid var(--line); }
.rp-submitted-list p { display: grid; grid-template-columns: 28px 1fr; gap: 8px; margin: 0; padding: 10px 2px; color: #3f3f46; font-size: 12px; }
.rp-submitted-list p + p { border-top: 1px solid rgb(24 24 27 / 7%); }
.rp-submitted-list span { color: #6768df; font: 700 10px ui-monospace, SFMono-Regular, monospace; }
.rp-submit-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.rp-start-over { display: block; margin: 12px auto 0; border: 0; background: transparent; color: #71717a; font-size: 11px; text-decoration: underline; text-underline-offset: 3px; }
.rp-targets, .rp-corrections { display: grid; gap: 8px; margin: 12px 0; }
.rp-target, .rp-correction { border: 1px solid #e4e4e7; border-radius: 10px; background: rgb(255 255 255 / 72%); padding: 11px; box-shadow: 0 1px 2px rgb(24 24 27 / 3%); }
.rp-target, .rp-correction-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 9px; }
.rp-target span, .rp-correction-head strong { color: #52525b; font-size: 11px; overflow-wrap: anywhere; }
.rp-link { min-height: 28px; border: 0; border-radius: 6px; background: transparent; color: #5758db; padding: 0 5px; font-size: 11px; font-weight: 650; }
.rp-link:hover { background: rgb(91 92 240 / 8%); }
.rp-danger { color: var(--danger); }
.rp-summary { margin: 7px 0 0; color: #3f3f46; font-size: 12px; }
.rp-status { display: flex; align-items: center; gap: 7px; }
.rp-status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #a1a1aa; box-shadow: 0 0 0 3px rgb(161 161 170 / 12%); }
.rp-status.is-connected::before { background: #22c55e; box-shadow: 0 0 0 3px rgb(34 197 94 / 13%); }
.rp-stale { color: var(--danger); }
.rp-empty { margin: 8px 0; padding: 30px 18px; border: 1px dashed #d4d4d8; border-radius: 10px; color: #71717a; text-align: center; }
.rp-edit { margin-top: 8px; display: flex; gap: 6px; }
.rp-edit input { min-width: 0; flex: 1; border: 1px solid #d4d4d8; border-radius: 7px; padding: 7px; }
button:disabled { cursor: not-allowed; opacity: .42; transform: none; }
@keyframes rp-enter { from { opacity: 0; transform: translateY(7px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
@media (prefers-reduced-motion: reduce) { .rp-popup, .rp-tray, .rp-hover, button { animation: none; transition: none; } }
@media (max-width: 640px) { .rp-toolbar { left: 10px; right: 10px; bottom: 10px; transform: none; overflow-x: auto; } .rp-brand { display: none; } .rp-tray { top: 10px; right: 10px; } .rp-grid, .rp-submit-actions { grid-template-columns: 1fr; } }
`
