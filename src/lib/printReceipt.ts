/**
 * printReceipt — Opens a print-optimized window with receipt(s) or reports.
 *
 * For fee receipts and salary slips: landscape, 2 copies per page.
 * For reports: portrait, single layout with institution header + data table.
 */
export type PrintMode = "landscape" | "portrait";

export function printReceiptHTML(
  receiptHTML: string,
  mode: PrintMode = "landscape",
  options?: { primaryColor?: string }
) {
  const pc = options?.primaryColor || '#1a5c1a';
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  const pageCSS =
    mode === "landscape"
      ? "@page { size: A4 landscape; margin: 6mm; }"
      : "@page { size: A4 portrait; margin: 12mm 15mm; }";

  const wrapClass =
    mode === "landscape" ? "print-landscape" : "print-portrait";

  const title = mode === "portrait" ? "রিপোর্ট প্রিন্ট" : "রসিদ প্রিন্ট";

  win.document.write(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans Bengali', sans-serif; background: #fff; color: #111; }

    /* ═══ Receipt core styles ═══ */
    .rcpt { width: 100%; max-width: 480px; margin: 0 auto; padding: 18px 20px; background: #fff; color: #111; font-size: 12px; line-height: 1.5; border: 2px solid ${pc}; border-radius: 6px; }

    /* ── Header: logo top-center, stacked info ── */
    .rcpt-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 2px solid ${pc};
      margin-bottom: 8px;
    }
    .rcpt-logo-wrap { display: flex; justify-content: center; margin-bottom: 6px; }
    .rcpt-logo { width: 54px; height: 54px; border-radius: 50%; border: 2px solid ${pc}; object-fit: cover; }
    .rcpt-logo--fallback { display: flex; align-items: center; justify-content: center; background: #f0ece0; font-size: 28px; font-weight: 800; color: ${pc}; }
    .rcpt-inst-name { font-size: 16px; font-weight: 800; color: ${pc}; margin: 0; line-height: 1.3; text-align: center; }
    .rcpt-inst-sub { font-size: 11px; color: #555; margin: 2px 0 0; text-align: center; }
    .rcpt-inst-addr { font-size: 10px; color: #777; margin: 2px 0 0; text-align: center; }
    .rcpt-inst-contacts { display: flex; gap: 10px; justify-content: center; font-size: 9px; color: #888; flex-wrap: wrap; margin-top: 3px; }

    /* ── Title bar ── */
    .rcpt-title-bar { display: flex; align-items: center; justify-content: center; gap: 12px; background: ${pc}; color: #fff; padding: 5px 12px; border-radius: 4px; margin-bottom: 10px; }
    .rcpt-title { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
    .rcpt-copy-label { font-size: 10px; background: rgba(255,255,255,0.2); padding: 1px 8px; border-radius: 10px; }

    /* ── Info grid: centered text ── */
    .rcpt-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; padding: 6px 0 8px; border-bottom: 1px dashed #ccc; margin-bottom: 8px; text-align: center; }
    .rcpt-info-row { display: flex; gap: 4px; font-size: 11px; justify-content: center; }
    .rcpt-info-label { color: #777; white-space: nowrap; }
    .rcpt-info-value { font-weight: 600; color: #222; }

    /* ── Table: all centered ── */
    .rcpt-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .rcpt-th { background: #f0ece0; color: #333; font-weight: 700; font-size: 11px; padding: 5px 8px; border: 1px solid #d5cbb0; text-align: center; vertical-align: middle; }
    .rcpt-th-sl { width: 36px; }
    .rcpt-th-amt { width: 80px; }
    .rcpt-td { padding: 4px 8px; border: 1px solid #e8e0cc; font-size: 11px; text-align: center; vertical-align: middle; }
    .rcpt-td-sl { color: #999; }
    .rcpt-td-amt { font-weight: 600; white-space: nowrap; }

    /* ── Summary ── */
    .rcpt-summary { border: 1.5px solid ${pc}; border-radius: 4px; padding: 6px 10px; margin-bottom: 8px; }
    .rcpt-sum-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; font-weight: 600; }
    .rcpt-sum-paid { color: ${pc}; font-size: 14px; font-weight: 800; border-top: 1px solid #ccc; padding-top: 4px; margin-top: 2px; }
    .rcpt-sum-discount { color: #c0392b; }
    .rcpt-sum-due { color: #d35400; font-size: 13px; font-weight: 700; }
    .rcpt-meta { font-size: 11px; color: #555; margin-bottom: 14px; text-align: center; }
    .rcpt-meta p { margin: 2px 0; }

    /* ── Signatures: evenly spaced ── */
    .rcpt-sig { display: flex; justify-content: space-between; gap: 16px; margin-top: 28px; margin-bottom: 10px; padding: 0 6px; }
    .rcpt-sig-box { text-align: center; flex: 1; }
    .rcpt-sig-line { border-top: 1.5px solid #555; margin-bottom: 3px; width: 100%; }
    .rcpt-sig-box span { font-size: 9px; color: #777; }

    /* ── Footer: centered ── */
    .rcpt-footer { text-align: center; font-size: 9px; color: #999; border-top: 1px dashed #ccc; padding-top: 6px; }

    /* Landscape layout — 2 copies per page */
    .print-page { display: flex; gap: 0; width: 100%; page-break-after: always; break-after: page; }
    .print-half { flex: 1; padding: 6px 10px; display: flex; align-items: flex-start; justify-content: center; }
    .print-half:first-child { border-right: 1px dashed #999; }
    .print-half .rcpt { max-width: 100%; border-width: 1.5px; font-size: 10.5px; }
    .print-half .rcpt-inst-name { font-size: 14px; }
    .print-half .rcpt-logo { width: 44px; height: 44px; }
    .print-half .rcpt-title { font-size: 12px; }
    .print-half .rcpt-logo-wrap { margin-bottom: 4px; }
    .print-single .rcpt { max-width: 100%; }

    /* ═══ Report styles (portrait) — print-optimized ═══ */
    .rpt {
      width: 100%;
      padding: 0;
      background: #fff;
      color: #111;
      font-size: 11px;
      line-height: 1.6;
    }

    /* ── Header: logo top-center, info stacked below ── */
    .rpt-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 2.5px solid #1a5c1a;
      margin-bottom: 10px;
    }
    .rpt-logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
    }
    .rpt-logo {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2.5px solid #1a5c1a;
      object-fit: cover;
    }
    .rpt-logo--fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0ece0;
      font-size: 28px;
      font-weight: 800;
      color: #1a5c1a;
    }
    .rpt-inst-name {
      font-size: 18px;
      font-weight: 800;
      color: #1a5c1a;
      margin: 0;
      line-height: 1.3;
      text-align: center;
    }
    .rpt-inst-sub {
      font-size: 11px;
      color: #555;
      margin: 2px 0 0;
      text-align: center;
    }
    .rpt-custom-header {
      font-size: 12px;
      color: #1a5c1a;
      font-weight: 600;
      margin: 3px 0 0;
      text-align: center;
    }
    .rpt-inst-addr {
      font-size: 10px;
      color: #777;
      margin: 2px 0 0;
      text-align: center;
    }
    .rpt-inst-contacts {
      display: flex;
      gap: 14px;
      justify-content: center;
      font-size: 9.5px;
      color: #888;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    /* ── Title bar ── */
    .rpt-title-bar {
      background: #1a5c1a;
      color: #fff;
      padding: 7px 14px;
      border-radius: 4px;
      margin-bottom: 10px;
      text-align: center;
    }
    .rpt-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .rpt-subtitle {
      text-align: center;
      font-size: 12px;
      color: #555;
      margin-bottom: 12px;
    }

    /* ── Summary cards: centered content ── */
    .rpt-summary-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 14px;
      justify-content: center;
    }
    .rpt-sum-card {
      border: 1.5px solid #ddd;
      border-radius: 6px;
      padding: 10px 14px;
      min-width: 110px;
      text-align: center;
      flex: 1;
      max-width: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .rpt-sum-bar {
      height: 3px;
      width: 60%;
      border-radius: 3px;
      margin: 0 auto 6px;
    }
    .rpt-sum-value {
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      line-height: 1.2;
    }
    .rpt-sum-label {
      font-size: 10px;
      color: #777;
      margin-top: 3px;
      text-align: center;
    }

    /* ── Table: all cells centered ── */
    .rpt-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10.5px;
    }
    .rpt-th {
      background: #f0ece0;
      color: #333;
      font-weight: 700;
      padding: 6px 8px;
      border: 1px solid #d5cbb0;
      text-align: center;
      vertical-align: middle;
      font-size: 10.5px;
    }
    .rpt-td {
      padding: 5px 8px;
      border: 1px solid #e8e0cc;
      font-size: 10.5px;
      text-align: center;
      vertical-align: middle;
    }
    .rpt-td-empty {
      padding: 20px 8px;
      color: #999;
    }
    .rpt-tr-alt td {
      background: #fafaf5;
    }

    /* ── Footer note ── */
    .rpt-note {
      font-size: 10px;
      color: #666;
      margin-bottom: 8px;
      text-align: center;
      font-style: italic;
    }

    /* ── Signatures: evenly spaced, symmetrical ── */
    .rpt-sig {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 40px;
      margin-bottom: 12px;
      padding: 0 10px;
    }
    .rpt-sig-box {
      text-align: center;
      flex: 1;
    }
    .rpt-sig-line {
      border-top: 1.5px solid #555;
      margin-bottom: 4px;
      width: 100%;
    }
    .rpt-sig-box span {
      font-size: 9px;
      color: #777;
    }

    /* ── Footer: centered ── */
    .rpt-custom-footer {
      font-size: 11px;
      font-weight: 600;
      color: #1a5c1a;
      margin-bottom: 4px;
      text-align: center;
    }
    .rpt-footer {
      text-align: center;
      font-size: 9px;
      color: #999;
      border-top: 1px dashed #ccc;
      padding-top: 8px;
    }

    .no-print { display: block; text-align: center; margin: 16px auto; }
    .no-print button { padding: 10px 32px; background: ${pc}; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-family: inherit; }
    .no-print button:hover { background: #145214; }

    ${pageCSS}

    /* ── Print optimization ── */
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; }

      /* Prevent tables from breaking across pages awkwardly */
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }

      /* Keep signatures together */
      .rpt-sig { page-break-inside: avoid; }
      .rpt-footer { page-break-inside: avoid; }

      /* Keep summary cards on same page */
      .rpt-summary-row { page-break-inside: avoid; }

      /* Keep header together */
      .rpt-header { page-break-inside: avoid; page-break-after: avoid; }
      .rpt-title-bar { page-break-after: avoid; }

      /* Ensure backgrounds print */
      .rpt-title-bar, .rpt-th, .rpt-sum-bar, .rpt-tr-alt td,
      .rcpt-title-bar, .rcpt-th {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Keep receipt sections together */
      .rcpt-header { page-break-inside: avoid; }
      .rcpt-sig { page-break-inside: avoid; }
      .rcpt-footer { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="${wrapClass}">
    ${receiptHTML}
  </div>
  <div class="no-print">
    <button onclick="window.print()">🖨️ প্রিন্ট করুন</button>
  </div>
</body>
</html>`);
  win.document.close();
}
