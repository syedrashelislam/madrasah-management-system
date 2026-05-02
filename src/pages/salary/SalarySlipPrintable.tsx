export interface SalarySlipData {
  staff: {
    name: string;
    staff_id: string;
    role: string;
    phone: string;
    join_date: string;
  };
  month: string;
  year: number;
  breakdown: {
    baseSalary: number;
    totalDays: number;
    absentDays: number;
    absenceDeduction: number;
    advanceDeduction: number;
    netPayable: number;
    totalOpenAdvance: number;
    dailyWage: number;
  };
  madrasaName: string;
  madrasaAddress: string;
}

/* Inline Bengali digit converter (standalone — no imports needed in generated HTML) */
function toBN(value: number | string | undefined | null): string {
  const bd = ["\u09E6","\u09E7","\u09E8","\u09E9","\u09EA","\u09EB","\u09EC","\u09ED","\u09EE","\u09EF"];
  if (value === undefined || value === null) return bd[0];
  return String(value).replace(/[0-9]/g, (d) => bd[parseInt(d)]);
}

/* Inline Taka formatter */
function fmtTk(amount: number | string | undefined | null): string {
  const num = Number(amount);
  const safe = isFinite(num) ? num : 0;
  return "\u09F3" + toBN(safe.toLocaleString("en-IN"));
}

/* Escape HTML to prevent injection */
function esc(str: string): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildCSS(): string {
  return `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: 'Noto Sans Bengali', sans-serif;
  background: #f0f0f0;
  color: #1a1a2e;
  padding: 32px 16px;
  line-height: 1.65;
  font-size: 14px;
}
.slip {
  max-width: 760px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  overflow: hidden;
}

/* ── Header ── */
.hdr {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  padding: 28px 36px 24px;
  text-align: center;
  position: relative;
}
.hdr::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  background: linear-gradient(90deg, #d4af37, #f5d76e, #d4af37);
}
.hdr-name { font-size: 26px; font-weight: 800; color: #d4af37; margin-bottom: 4px; }
.hdr-addr { font-size: 13px; color: rgba(255,255,255,0.65); margin-bottom: 16px; }
.hdr-badge {
  display: inline-block;
  background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.4);
  color: #f5d76e;
  padding: 6px 28px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}
.hdr-period { margin-top: 12px; font-size: 14px; color: rgba(255,255,255,0.55); }

/* ── Body ── */
.body { padding: 28px 36px 20px; }

/* ── Section title ── */
.sec {
  font-size: 13px;
  font-weight: 700;
  color: #d4af37;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 2px solid #f5f0e1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sec::before {
  content: '';
  width: 4px; height: 16px;
  background: #d4af37;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ── Info grid ── */
.igrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 28px;
}
.icell {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex; flex-direction: column; gap: 2px;
}
.icell:nth-child(odd) { border-right: 1px solid #f0f0f0; background: #fafaf8; }
.icell:nth-last-child(-n+2) { border-bottom: none; }
.ilbl { font-size: 11px; font-weight: 600; color: #8a8a8a; text-transform: uppercase; letter-spacing: 0.5px; }
.ival { font-size: 15px; font-weight: 700; color: #1a1a2e; }

/* ── Table ── */
.tbl {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}
.tbl thead th {
  background: #1a1a2e;
  color: #d4af37;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 12px 16px;
  text-align: left;
}
.tbl thead th:last-child { text-align: right; }
.tbl tbody td {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  vertical-align: middle;
}
.tbl tbody tr:last-child td { border-bottom: none; }
.tbl tbody tr:nth-child(even) { background: #fafaf8; }
.td-l { font-weight: 500; color: #333; }
.td-h { font-size: 11px; color: #888; font-weight: 400; margin-top: 2px; }
.td-a { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.dr .td-l, .dr .td-a { color: #dc3545; }
.dr .td-l::before { content: '(\\2212) '; font-weight: 400; }

/* ── Total deductions strip ── */
.ded-strip {
  display: flex; justify-content: flex-end;
  margin-bottom: 16px;
}
.ded-box {
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 20px;
  text-align: right;
}
.ded-lbl { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; }
.ded-val { font-size: 16px; font-weight: 800; color: #dc3545; }

/* ── Net payable ── */
.net {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 2px solid #166534;
  border-radius: 10px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}
.net-lbl { font-size: 16px; font-weight: 700; color: #166534; }
.net-sub { font-size: 11px; color: #22c55e; font-weight: 500; margin-top: 2px; }
.net-amt { font-size: 28px; font-weight: 800; color: #166534; }

/* ── Advance info ── */
.adv {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.adv-l { color: #92400e; font-weight: 600; }
.adv-v { color: #92400e; font-weight: 800; font-size: 15px; }

/* ── Signatures ── */
.sigs { display: flex; justify-content: space-between; margin-top: 52px; }
.sig { width: 200px; text-align: center; }
.sig-line { border-top: 1.5px solid #333; margin-bottom: 8px; }
.sig-name { font-size: 13px; font-weight: 600; color: #333; }
.sig-date { font-size: 10px; color: #999; margin-top: 2px; }

/* ── Footer ── */
.ftr {
  text-align: center;
  padding: 16px 36px;
  background: #fafaf8;
  border-top: 1px solid #eee;
  font-size: 11px;
  color: #aaa;
  font-style: italic;
}

/* ── Print ── */
@media print {
  body { background: none; padding: 0; margin: 0; }
  .slip { box-shadow: none; border-radius: 0; max-width: 100%; }
  .sigs { margin-top: 64px; }
  @page { size: A4; margin: 12mm 10mm; }
}`;
}

function buildHTML(data: SalarySlipData): string {
  const { staff, month, year, breakdown: b, madrasaName, madrasaAddress } = data;
  const payDate = new Date().toISOString().split("T")[0];
  const presentDays = b.totalDays - b.absentDays;
  const totalDed = b.absenceDeduction + b.advanceDeduction;

  const absRow = b.absenceDeduction > 0 ? `
        <tr class="dr">
          <td class="td-l">\u0985\u09A8\u09C1\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF \u0995\u09B0\u09CD\u09A4\u09A8<div class="td-h">${toBN(b.absentDays)} \u09A6\u09BF\u09A8 \u00D7 ${fmtTk(b.dailyWage)} \u09A6\u09C8\u09A8\u09BF\u0995</div></td>
          <td class="td-a">${fmtTk(b.absenceDeduction)}</td>
        </tr>` : "";

  const advRow = b.advanceDeduction > 0 ? `
        <tr class="dr">
          <td class="td-l">\u0985\u0997\u09CD\u09B0\u09BF\u09AE \u09B8\u09AE\u09A8\u09CD\u09AC\u09DF<div class="td-h">\u09AC\u0995\u09C7\u09DF\u09BE \u0985\u0997\u09CD\u09B0\u09BF\u09AE \u09A5\u09C7\u0995\u09C7 \u0995\u09B0\u09CD\u09A4\u09A8</div></td>
          <td class="td-a">${fmtTk(b.advanceDeduction)}</td>
        </tr>` : "";

  const dedStrip = totalDed > 0 ? `
      <div class="ded-strip">
        <div class="ded-box">
          <div class="ded-lbl">\u09AE\u09CB\u099F \u0995\u09B0\u09CD\u09A4\u09A8</div>
          <div class="ded-val">\u2212 ${fmtTk(totalDed)}</div>
        </div>
      </div>` : "";

  const advInfo = b.totalOpenAdvance > 0 ? `
      <div class="adv">
        <span class="adv-l">\u0985\u09AC\u09B6\u09BF\u09B7\u09CD\u099F \u0985\u0997\u09CD\u09B0\u09BF\u09AE \u09AC\u0995\u09C7\u09DF\u09BE</span>
        <span class="adv-v">${fmtTk(b.totalOpenAdvance)}</span>
      </div>` : "";

  return `<!DOCTYPE html>
<html lang="bn" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\u09AC\u09C7\u09A4\u09A8 \u09B8\u09CD\u09B2\u09BF\u09AA \u2014 ${esc(staff.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${buildCSS()}</style>
</head>
<body>
  <div class="slip">

    <!-- Header -->
    <div class="hdr">
      <div class="hdr-name">${esc(madrasaName)}</div>
      <div class="hdr-addr">${esc(madrasaAddress)}</div>
      <div class="hdr-badge">\u09AC\u09C7\u09A4\u09A8 \u09B8\u09CD\u09B2\u09BF\u09AA</div>
      <div class="hdr-period">${esc(month)} ${toBN(year)} \u0987\u0982</div>
    </div>

    <div class="body">

      <!-- Employee Info -->
      <div class="sec">\u0995\u09B0\u09CD\u09AE\u099A\u09BE\u09B0\u09C0 \u09A4\u09A5\u09CD\u09AF</div>
      <div class="igrid">
        <div class="icell">
          <span class="ilbl">\u09A8\u09BE\u09AE</span>
          <span class="ival">${esc(staff.name)}</span>
        </div>
        <div class="icell">
          <span class="ilbl">\u09B8\u09CD\u099F\u09BE\u09AB \u0986\u0987\u09A1\u09BF</span>
          <span class="ival">${esc(staff.staff_id)}</span>
        </div>
        <div class="icell">
          <span class="ilbl">\u09AA\u09A6\u09AC\u09C0</span>
          <span class="ival">${esc(staff.role || "\u09B6\u09BF\u0995\u09CD\u09B7\u0995")}</span>
        </div>
        <div class="icell">
          <span class="ilbl">\u09AB\u09CB\u09A8</span>
          <span class="ival">${esc(staff.phone || "\u2014")}</span>
        </div>
        <div class="icell">
          <span class="ilbl">\u09AF\u09CB\u0997\u09A6\u09BE\u09A8 \u09A4\u09BE\u09B0\u09BF\u0996</span>
          <span class="ival">${staff.join_date ? toBN(staff.join_date) : "\u2014"}</span>
        </div>
        <div class="icell">
          <span class="ilbl">\u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09A4\u09BE\u09B0\u09BF\u0996</span>
          <span class="ival">${toBN(payDate)}</span>
        </div>
      </div>

      <!-- Breakdown Table -->
      <div class="sec">\u09AC\u09C7\u09A4\u09A8 \u09AC\u09BF\u09AC\u09B0\u09A3\u09C0</div>
      <table class="tbl">
        <thead>
          <tr>
            <th>\u09AC\u09BF\u09AC\u09B0\u09A3</th>
            <th>\u09AA\u09B0\u09BF\u09AE\u09BE\u09A3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="td-l">\u09AE\u09C2\u09B2 \u09AC\u09C7\u09A4\u09A8<div class="td-h">\u09AE\u09BE\u09B8\u09BF\u0995 \u09A8\u09BF\u09B0\u09CD\u09A7\u09BE\u09B0\u09BF\u09A4 \u09AC\u09C7\u09A4\u09A8</div></td>
            <td class="td-a">${fmtTk(b.baseSalary)}</td>
          </tr>
          <tr>
            <td class="td-l">\u09A6\u09C8\u09A8\u09BF\u0995 \u09AE\u099C\u09C1\u09B0\u09BF<div class="td-h">\u09AE\u09C2\u09B2 \u09AC\u09C7\u09A4\u09A8 \u00F7 \u09AE\u09CB\u099F \u09A6\u09BF\u09A8</div></td>
            <td class="td-a">${fmtTk(b.dailyWage)}</td>
          </tr>
          <tr>
            <td class="td-l">\u0989\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4\u09BF\u09B0 \u09A6\u09BF\u09A8<div class="td-h">\u09AE\u09CB\u099F ${toBN(b.totalDays)} \u09A6\u09BF\u09A8\u09C7\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 ${toBN(presentDays)} \u09A6\u09BF\u09A8 \u0989\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4</div></td>
            <td class="td-a">${toBN(presentDays)} / ${toBN(b.totalDays)} \u09A6\u09BF\u09A8</td>
          </tr>
          <tr>
            <td class="td-l">\u0985\u09A8\u09C1\u09AA\u09B8\u09CD\u09A5\u09BF\u09A4 \u09A6\u09BF\u09A8</td>
            <td class="td-a">${toBN(b.absentDays)} \u09A6\u09BF\u09A8</td>
          </tr>${absRow}${advRow}
        </tbody>
      </table>

      ${dedStrip}

      <!-- Net Payable -->
      <div class="net">
        <div>
          <div class="net-lbl">\u09A8\u09C7\u099F \u09AA\u09CD\u09B0\u09A6\u09C7\u09DF</div>
          <div class="net-sub">\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F \u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09AF \u09AC\u09C7\u09A4\u09A8</div>
        </div>
        <div class="net-amt">${fmtTk(b.netPayable)}</div>
      </div>

      ${advInfo}

      <!-- Signatures -->
      <div class="sigs">
        <div class="sig">
          <div class="sig-line"></div>
          <div class="sig-name">\u09B6\u09BF\u0995\u09CD\u09B7\u0995\u09C7\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0</div>
          <div class="sig-date">\u09A4\u09BE\u09B0\u09BF\u0996: _______________</div>
        </div>
        <div class="sig">
          <div class="sig-line"></div>
          <div class="sig-name">\u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7\u09C7\u09B0 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0</div>
          <div class="sig-date">\u09A4\u09BE\u09B0\u09BF\u0996: _______________</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="ftr">
      \u2726 \u098F\u099F\u09BF \u098F\u0995\u099F\u09BF \u0995\u09AE\u09CD\u09AA\u09BF\u0989\u099F\u09BE\u09B0 \u099C\u09C7\u09A8\u09BE\u09B0\u09C7\u099F\u09C7\u09A1 \u09A1\u0995\u09C1\u09AE\u09C7\u09A8\u09CD\u099F \u2014 \u09B8\u09CD\u09AC\u09BE\u0995\u09CD\u09B7\u09B0 \u099B\u09BE\u09A1\u09BC\u09BE \u098F\u09B0 \u0995\u09CB\u09A8\u09CB \u0986\u0987\u09A8\u0997\u09A4 \u09AE\u09C2\u09B2\u09CD\u09AF \u09A8\u09C7\u0987 \u2726
    </div>

  </div>

  <script>
    document.fonts.ready.then(function() {
      setTimeout(function() { window.print(); }, 300);
    });
  </script>
</body>
</html>`;
}

/**
 * Opens a new browser window with a professionally designed salary slip and triggers print.
 */
export function printSalarySlip(data: SalarySlipData): void {
  const html = buildHTML(data);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
}
