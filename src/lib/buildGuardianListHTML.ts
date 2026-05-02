/**
 * buildGuardianListHTML — Generates a printable A4 guardian list
 * matching the receipt/report template style.
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import type { StudentRow } from "@/hooks/useStudents";
import { toBengaliNumber } from "@/lib/constants";

export function buildGuardianListHTML(
  students: StudentRow[],
  institution: InstitutionInfo
): string {
  const pc = institution.receiptPrimaryColor || "#1a5c1a";

  const logoHTML = institution.logoUrl
    ? `<img src="${institution.logoUrl}" alt="Logo" class="rpt-logo" />`
    : `<div class="rpt-logo rpt-logo--fallback">م</div>`;

  const contactParts: string[] = [];
  if (institution.phone) contactParts.push(`☎ ${institution.phone}`);
  if (institution.email) contactParts.push(`✉ ${institution.email}`);

  const today = new Date();
  const dateStr = `${toBengaliNumber(today.getDate())}/${toBengaliNumber(today.getMonth() + 1)}/${toBengaliNumber(today.getFullYear())}`;

  const rows = students
    .filter((s) => s.status === "active")
    .map((s, i) => {
      const photoUrl =
        s.photo_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}&backgroundColor=1a7a4f&textColor=ffffff`;
      const guardianName = s.guardian_name || s.father_name || "—";
      const phone = s.guardian_phone || "—";
      const whatsapp = s.guardian_whatsapp || "—";
      const email = s.guardian_email || "—";

      return `<tr class="${i % 2 === 1 ? "rpt-tr-alt" : ""}">
        <td class="rpt-td gl-td-sl">${toBengaliNumber(i + 1)}</td>
        <td class="rpt-td gl-td-photo"><img src="${photoUrl}" class="gl-photo" alt="" /></td>
        <td class="rpt-td gl-td-name">${s.name}</td>
        <td class="rpt-td gl-td-id">${s.student_id}</td>
        <td class="rpt-td gl-td-guardian">${guardianName}</td>
        <td class="rpt-td gl-td-phone" dir="ltr">${phone}</td>
        <td class="rpt-td gl-td-phone" dir="ltr">${whatsapp}</td>
        <td class="rpt-td gl-td-email" dir="ltr">${email}</td>
      </tr>`;
    })
    .join("");

  const totalActive = students.filter((s) => s.status === "active").length;

  return `<div class="rpt">
    <div class="rpt-header">
      <div class="rpt-logo-wrap">${logoHTML}</div>
      <div class="rpt-header-text">
        <h1 class="rpt-inst-name">${institution.name}</h1>
        ${institution.subtitle ? `<p class="rpt-inst-sub">${institution.subtitle}</p>` : ""}
        ${institution.address ? `<p class="rpt-inst-addr">${institution.address}</p>` : ""}
        ${contactParts.length ? `<div class="rpt-inst-contacts">${contactParts.map((c) => `<span>${c}</span>`).join("")}</div>` : ""}
      </div>
    </div>

    <div class="rpt-title-bar" style="background:${pc};">
      <span class="rpt-title">অভিভাবক তালিকা</span>
    </div>

    <div class="gl-meta">
      <span>তারিখ: ${dateStr}</span>
      <span>মোট সক্রিয় ছাত্র: ${toBengaliNumber(totalActive)} জন</span>
    </div>

    <table class="rpt-table gl-table">
      <thead>
        <tr>
          <th class="rpt-th gl-th-sl">ক্র.নং</th>
          <th class="rpt-th gl-th-photo">ছবি</th>
          <th class="rpt-th">ছাত্রের নাম</th>
          <th class="rpt-th">আইডি নম্বর</th>
          <th class="rpt-th">অভিভাবকের নাম</th>
          <th class="rpt-th">মোবাইল নম্বর</th>
          <th class="rpt-th">হোয়াটসঅ্যাপ</th>
          <th class="rpt-th">ইমেইল</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td class="rpt-td rpt-td-empty" colspan="8">কোনো সক্রিয় ছাত্র পাওয়া যায়নি</td></tr>`}
      </tbody>
    </table>

    <div class="rpt-sig">
      <div class="rpt-sig-box"><div class="rpt-sig-line"></div><span>তৈরিকারীর স্বাক্ষর</span></div>
      <div class="rpt-sig-box"><div class="rpt-sig-line"></div><span>প্রধান শিক্ষকের স্বাক্ষর ও সিল</span></div>
    </div>

    <div class="rpt-footer">
      <p>এই তালিকাটি কম্পিউটারে তৈরি — তারিখ: ${dateStr}</p>
    </div>
  </div>`;
}

export function printGuardianList(
  students: StudentRow[],
  institution: InstitutionInfo
) {
  const html = buildGuardianListHTML(students, institution);
  const pc = institution.receiptPrimaryColor || "#1a5c1a";

  const win = window.open("", "_blank", "width=1000,height=800");
  if (!win) return;

  win.document.write(`<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>অভিভাবক তালিকা</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans Bengali', sans-serif; background: #fff; color: #111; }

    @page { size: A4 portrait; margin: 10mm 12mm; }

    /* ── Report Header ── */
    .rpt { width: 100%; padding: 0; background: #fff; color: #111; font-size: 11px; line-height: 1.6; }
    .rpt-header {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding-bottom: 10px; border-bottom: 2.5px solid ${pc}; margin-bottom: 8px;
    }
    .rpt-logo-wrap { display: flex; justify-content: center; margin-bottom: 6px; }
    .rpt-logo { width: 56px; height: 56px; border-radius: 50%; border: 2.5px solid ${pc}; object-fit: cover; }
    .rpt-logo--fallback { display: flex; align-items: center; justify-content: center; background: #f0ece0; font-size: 26px; font-weight: 800; color: ${pc}; }
    .rpt-header-text { flex: 1; text-align: center; }
    .rpt-inst-name { font-size: 17px; font-weight: 800; color: ${pc}; margin: 0; line-height: 1.3; }
    .rpt-inst-sub { font-size: 11px; color: #555; margin: 2px 0 0; }
    .rpt-inst-addr { font-size: 10px; color: #777; margin: 2px 0 0; }
    .rpt-inst-contacts { display: flex; gap: 12px; justify-content: center; font-size: 9px; color: #888; flex-wrap: wrap; margin-top: 3px; }

    /* ── Title bar ── */
    .rpt-title-bar { background: ${pc}; color: #fff; padding: 6px 14px; border-radius: 4px; margin-bottom: 8px; text-align: center; }
    .rpt-title { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }

    /* ── Meta row ── */
    .gl-meta {
      display: flex; justify-content: space-between; padding: 4px 2px 8px;
      font-size: 10.5px; color: #555; border-bottom: 1px dashed #ccc; margin-bottom: 8px;
    }

    /* ── Table ── */
    .rpt-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .rpt-th {
      background: #f0ece0; color: #333; font-weight: 700; font-size: 9.5px;
      padding: 5px 4px; border: 1px solid #d5cbb0; text-align: center; vertical-align: middle;
      white-space: nowrap;
    }
    .rpt-td {
      padding: 3px 4px; border: 1px solid #e8e0cc; font-size: 9.5px;
      text-align: center; vertical-align: middle;
    }
    .rpt-td-empty { padding: 20px 8px; color: #999; text-align: center; }
    .rpt-tr-alt td { background: #fafaf5; }

    /* ── Guardian list specifics ── */
    .gl-th-sl { width: 32px; }
    .gl-th-photo { width: 40px; }
    .gl-td-sl { color: #888; width: 32px; }
    .gl-td-photo { padding: 2px; width: 40px; }
    .gl-photo { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid #d5cbb0; display: block; margin: 0 auto; }
    .gl-td-name { font-weight: 600; text-align: right; white-space: nowrap; }
    .gl-td-id { font-family: monospace; font-size: 9px; white-space: nowrap; }
    .gl-td-guardian { text-align: right; white-space: nowrap; }
    .gl-td-phone { font-size: 9px; direction: ltr; white-space: nowrap; }
    .gl-td-email { font-size: 8.5px; direction: ltr; word-break: break-all; max-width: 100px; }

    /* ── Signatures ── */
    .rpt-sig { display: flex; justify-content: space-between; gap: 20px; margin-top: 30px; margin-bottom: 10px; padding: 0 10px; }
    .rpt-sig-box { text-align: center; flex: 1; }
    .rpt-sig-line { border-top: 1.5px solid #555; margin-bottom: 3px; width: 100%; }
    .rpt-sig-box span { font-size: 9px; color: #777; }

    /* ── Footer ── */
    .rpt-footer { text-align: center; font-size: 9px; color: #999; border-top: 1px dashed #ccc; padding-top: 6px; }

    .no-print { display: block; text-align: center; margin: 16px auto; }
    .no-print button { padding: 10px 32px; background: ${pc}; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-family: inherit; }
    .no-print button:hover { opacity: 0.85; }

    @media print {
      .no-print { display: none !important; }
      body { margin: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      .rpt-header { page-break-inside: avoid; page-break-after: avoid; }
      .rpt-title-bar { page-break-after: avoid; }
      .rpt-sig { page-break-inside: avoid; }
      .rpt-footer { page-break-inside: avoid; }
      .rpt-th, .rpt-tr-alt td, .rpt-title-bar {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="print-portrait">
    ${html}
  </div>
  <div class="no-print">
    <button onclick="window.print()">🖨️ প্রিন্ট করুন</button>
  </div>
</body>
</html>`);
  win.document.close();
}
