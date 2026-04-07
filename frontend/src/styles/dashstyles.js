const STYLE_ID = "campus-dash-styles";

export function injectDashStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #05050f;
      --surface: rgba(255,255,255,0.055);
      --border: rgba(255,255,255,0.09);
      --text: #fff;
      --muted: rgba(255,255,255,0.4);
      --accent: #3b82f6;
      --accent2: #8b5cf6;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font: 'Outfit', sans-serif;
    }

    body { background: var(--bg); font-family: var(--font); color: var(--text); }

    /* ── page wrapper ── */
    .dash-page {
      padding: 28px 32px 48px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
      animation: pageIn 0.4s ease both;
    }
    @keyframes pageIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── page header ── */
    .page-header { margin-bottom: 28px; }
    .page-title  { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .page-sub    { font-size: 14px; color: var(--muted); margin-top: 4px; }

    /* ── glass card ── */
    .glass-card {
      background: var(--surface);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }

    /* ── stat cards grid ── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex; flex-direction: column; gap: 8px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    .stat-icon  { font-size: 26px; }
    .stat-val   { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 13px; color: var(--muted); }

    /* ── section title ── */
    .section-title {
      font-size: 16px; font-weight: 700;
      margin-bottom: 16px; letter-spacing: -0.2px;
    }

    /* ── table ── */
    .dash-table { width: 100%; border-collapse: collapse; }
    .dash-table th {
      text-align: left; padding: 10px 14px;
      font-size: 12px; font-weight: 600;
      color: var(--muted); text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
    }
    .dash-table td {
      padding: 13px 14px; font-size: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .dash-table tr:last-child td { border-bottom: none; }
    .dash-table tr:hover td { background: rgba(255,255,255,0.03); }

    /* ── badge ── */
    .badge {
      display: inline-block;
      padding: 3px 10px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .badge-blue   { background: rgba(59,130,246,0.18); color: #60a5fa; }
    .badge-green  { background: rgba(34,197,94,0.18);  color: #4ade80; }
    .badge-yellow { background: rgba(245,158,11,0.18); color: #fbbf24; }
    .badge-red    { background: rgba(239,68,68,0.18);  color: #f87171; }
    .badge-purple { background: rgba(139,92,246,0.18); color: #a78bfa; }

    /* ── button ── */
    .btn {
      padding: 11px 20px;
      border-radius: 11px;
      font-family: var(--font);
      font-size: 14px; font-weight: 600;
      cursor: pointer; border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      color: #fff;
      box-shadow: 0 4px 16px rgba(59,130,246,0.35);
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(59,130,246,0.5); }
    .btn-ghost {
      background: var(--surface); border: 1px solid var(--border);
      color: rgba(255,255,255,0.7);
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.1); }
    .btn-danger { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; }
    .btn-danger:hover { background: rgba(239,68,68,0.28); }
    .btn-success { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3); color: #4ade80; }

    /* ── input / textarea ── */
    .dash-input, .dash-select, .dash-textarea {
      width: 100%;
      padding: 12px 14px;
      background: rgba(255,255,255,0.07);
      border: 1px solid var(--border);
      border-radius: 11px;
      font-family: var(--font);
      font-size: 14px; color: var(--text);
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .dash-input::placeholder, .dash-textarea::placeholder { color: var(--muted); }
    .dash-input:focus, .dash-select:focus, .dash-textarea:focus {
      border-color: rgba(59,130,246,0.55);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    }
    .dash-select option { background: #1e1e2e; }
    .dash-textarea { resize: vertical; min-height: 80px; }

    /* ── form label ── */
    .form-label {
      font-size: 13px; font-weight: 600;
      color: rgba(255,255,255,0.6);
      margin-bottom: 7px; display: block;
    }
    .form-group { margin-bottom: 16px; }

    /* ── grid layouts ── */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    /* ══════════════════════════════════════
       RESPONSIVE — all devices
    ══════════════════════════════════════ */

    /* tablet */
    @media (max-width: 1024px) {
      .grid-3 { grid-template-columns: repeat(2, 1fr); }
      .dash-page { padding: 20px 20px 80px; }
      .page-title { font-size: 22px; }
      .glass-card { padding: 18px; }
    }

    /* mobile landscape / small tablet */
    @media (max-width: 768px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
      .dash-page { padding: 14px 14px 80px; }
      .page-header { margin-bottom: 18px; }
      .page-title { font-size: 20px; }
      .page-sub { font-size: 13px; }
      .row-between { flex-wrap: wrap; gap: 8px; }
      .glass-card { padding: 14px; border-radius: 14px; }
      .stat-grid { gap: 10px; margin-bottom: 16px; }
      .stat-card { padding: 14px; border-radius: 12px; }
      .stat-val { font-size: 22px; }
      .stat-icon { font-size: 22px; }
      .section-title { font-size: 14px; margin-bottom: 12px; }
      .btn { padding: 9px 14px; font-size: 13px; }
      .dash-table { font-size: 12px; }
      .dash-table th { padding: 8px 8px; font-size: 10px; }
      .dash-table td { padding: 10px 8px; }
      .chip { padding: 4px 10px; font-size: 12px; }
      .action-card { padding: 14px; border-radius: 12px; }
      .action-card-icon { font-size: 24px; }
      .action-card-title { font-size: 13px; }
      .action-card-sub { font-size: 12px; }
      .modal-box { border-radius: 20px; }
      .modal-header { padding: 16px 18px 12px; }
      .modal-body { padding: 14px 18px; }
      .modal-footer { padding: 12px 18px; }
      .modal-title { font-size: 15px; }
      .empty-state { padding: 32px 16px; }
      .empty-state .empty-icon { font-size: 36px; }
    }

    /* mobile portrait */
    @media (max-width: 480px) {
      .dash-page { padding: 12px 12px 80px; }
      .page-title { font-size: 18px; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; }
      .stat-val { font-size: 20px; }
      .glass-card { padding: 12px; border-radius: 12px; }
      .btn { padding: 8px 12px; font-size: 12px; border-radius: 9px; }
      .btn-primary { box-shadow: none; }
      .badge { padding: 2px 7px; font-size: 11px; }
      .chip { padding: 4px 9px; font-size: 11px; }
      .form-group { margin-bottom: 12px; }
      .form-label { font-size: 12px; margin-bottom: 5px; }
      .dash-input, .dash-select, .dash-textarea { padding: 10px 12px; font-size: 13px; border-radius: 9px; }
      .modal-backdrop { padding: 10px; }
      .modal-box { border-radius: 16px; max-height: calc(100vh - 20px); }
      .modal-header { padding: 14px 16px 10px; }
      .modal-body { padding: 12px 16px; }
      .modal-footer { padding: 10px 16px; gap: 8px; }
      .modal-title { font-size: 14px; }
      .modal-footer .btn { flex: 1; text-align: center; justify-content: center; }
      .row-between { gap: 6px; }
      .section-title { font-size: 13px; }
      /* hide table on very small screens — show as cards */
      .dash-table thead { display: none; }
      .dash-table tr { display: flex; flex-direction: column; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .dash-table td { padding: 3px 0; border: none; font-size: 12px; }
      .dash-table td:first-child { font-weight: 700; font-size: 13px; }
    }

    /* very small phones */
    @media (max-width: 360px) {
      .dash-page { padding: 10px 10px 80px; }
      .stat-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
      .page-title { font-size: 16px; }
      .glass-card { padding: 10px; }
    }

    /* touch improvements */
    @media (hover: none) {
      .btn:hover { transform: none; box-shadow: none; }
      .stat-card:hover { transform: none; box-shadow: none; }
      .action-card:hover { transform: none; }
      .chip:hover { background: rgba(255,255,255,0.07); color: inherit; border-color: var(--border); }
    }

    /* ── action card ── */
    .action-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.22s;
      text-decoration: none;
      display: flex; flex-direction: column;
      align-items: flex-start; gap: 10px;
    }
    .action-card:hover {
      transform: translateY(-3px);
      border-color: rgba(59,130,246,0.3);
      box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    }
    .action-card-icon { font-size: 28px; }
    .action-card-title { font-size: 15px; font-weight: 700; }
    .action-card-sub   { font-size: 13px; color: var(--muted); }

    /* ── chip list ── */
    .chip-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      padding: 5px 13px; border-radius: 20px;
      font-size: 13px; font-weight: 500;
      background: rgba(255,255,255,0.07);
      border: 1px solid var(--border);
      cursor: pointer; transition: all 0.18s;
    }
    .chip:hover, .chip.active {
      background: rgba(59,130,246,0.2);
      border-color: rgba(59,130,246,0.4);
      color: #60a5fa;
    }

    /* ── empty state ── */
    .empty-state {
      text-align: center; padding: 48px 24px;
      color: var(--muted);
    }
    .empty-state .empty-icon { font-size: 48px; margin-bottom: 14px; }
    .empty-state p { font-size: 15px; }

    /* ── modal backdrop ── */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 16px;
      animation: fadeIn 0.2s ease both;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .modal-box {
      background: linear-gradient(160deg, #0e0e24 0%, #0a0a1e 100%);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 30px;
      padding: 0;
      width: 100%; max-width: 460px;
      max-height: calc(100vh - 32px);
      overflow: hidden;
      display: flex; flex-direction: column;
      box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(59,130,246,0.08);
      animation: slideUp 0.25s cubic-bezier(.22,1,.36,1) both;
    }
    .modal-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(255,255,255,0.03);
      flex-shrink: 0;
    }
    .modal-title {
      font-size: 17px; font-weight: 800; letter-spacing: -0.3px;
      background: linear-gradient(135deg, #fff 40%, rgba(139,92,246,0.9));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
    .modal-close {
      width: 28px; height: 28px; border-radius: 8px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.5); font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s; line-height: 1;
    }
    .modal-close:hover { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #f87171; }
    .modal-body {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }
    .modal-body::-webkit-scrollbar { width: 3px; }
    .modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    .modal-footer {
      display: flex; gap: 10px; justify-content: flex-end;
      padding: 14px 24px;
      border-top: 1px solid rgba(255,255,255,0.07);
      background: rgba(255,255,255,0.02);
      flex-shrink: 0;
      margin: 0;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity:0 } to { transform: none; opacity:1 } }

    /* ── row flex ── */
    .row { display: flex; align-items: center; gap: 12px; }
    .row-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

    /* ── timetable ── */
    .tt-grid {
      display: grid;
      grid-template-columns: 80px repeat(6, 1fr);
      gap: 6px;
      min-width: 560px;
    }
    .tt-cell {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 8px;
      font-size: 12px; text-align: center;
      min-height: 60px;
      display: flex; align-items: center; justify-content: center;
    }
    .tt-cell.header { font-weight: 700; color: var(--muted); font-size: 11px; background: transparent; border: none; }
    .tt-cell.filled { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.3); color: #60a5fa; font-weight: 600; }
    .tt-cell.filled.purple { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.3); color: #a78bfa; }
    .tt-cell.filled.green  { background: rgba(34,197,94,0.15);  border-color: rgba(34,197,94,0.3);  color: #4ade80; }
    .tt-cell.filled.yellow { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.3); color: #fbbf24; }
  `;
  document.head.appendChild(style);
}