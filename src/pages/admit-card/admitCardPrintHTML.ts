import { toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    return `${toBengaliNumber(d.getDate())} ${MONTHS_BENGALI[d.getMonth()]} ${toBengaliNumber(d.getFullYear())} (${days[d.getDay()]})`;
  } catch { return dateStr; }
}

interface Student {
  name: string;
  father_name: string;
  mother_name?: string;
  class_name: string;
  roll: string;
  student_id: string;
  section: string;
  photo_url: string;
}

interface Routine {
  exam_date: string;
  subject_name: string;
  start_time: string;
  end_time: string;
  full_marks: number;
  room: string;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700;800&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; }
body { padding: 12px; direction: rtl; }

.card {
  border: 2px solid #1a5c3a;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 24px;
  page-break-inside: avoid;
  background: #fffef8;
}

/* ─── Header Banner ─── */
.card-header {
  background: linear-gradient(135deg, #1a3a6b 0%, #1e4d8a 50%, #1a3a6b 100%);
  color: white;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  direction: ltr;
  text-align: center;
  justify-content: center;
  position: relative;
}
.card-header img.logo {
  width: 54px; height: 54px; border-radius: 50%; object-fit: cover;
  border: 2px solid rgba(255,255,255,0.4);
}
.card-header .inst-info { text-align: center; }
.card-header .inst-name-bn {
  font-size: 22px; font-weight: 800; color: #FFD700;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
  line-height: 1.3;
}
.card-header .inst-name-en {
  font-size: 11px; color: rgba(255,255,255,0.8);
  letter-spacing: 1px; text-transform: uppercase; margin-top: 2px;
}
.card-header .inst-address {
  font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px;
}

/* ─── Green Title Banner ─── */
.title-banner {
  background: linear-gradient(90deg, #1a7a3a, #228b45, #1a7a3a);
  color: white;
  text-align: center;
  padding: 8px 20px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
  margin: 0 20px;
  border-radius: 8px;
  margin-top: 14px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 6px rgba(26,122,58,0.3);
}

/* ─── Exam Type ─── */
.exam-type {
  text-align: center;
  font-size: 13px;
  color: #333;
  margin: 10px 20px 6px;
  padding: 6px 12px;
  background: #f8f6e8;
  border-radius: 6px;
  font-weight: 600;
}

/* ─── Student Info ─── */
.student-info {
  padding: 12px 24px;
  direction: rtl;
  text-align: right;
  position: relative;
}
.info-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
}
.info-row .label {
  font-weight: 700;
  color: #333;
  white-space: nowrap;
  min-width: 110px;
}
.info-row .value {
  flex: 1;
  border-bottom: 1.5px dotted #999;
  padding-bottom: 2px;
  font-weight: 600;
  color: #1a1a1a;
  min-height: 18px;
}
.info-row-split {
  display: flex;
  gap: 20px;
}
.info-row-split .info-row { flex: 1; }

.photo-box {
  position: absolute;
  top: 8px;
  left: 24px;
  width: 76px;
  height: 92px;
  border: 2px solid #1a5c3a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #999;
  background: #f8f6e8;
  overflow: hidden;
}
.photo-box img { width: 100%; height: 100%; object-fit: cover; }

/* ─── Exam Schedule Table ─── */
.schedule-table {
  width: calc(100% - 40px);
  margin: 6px 20px 10px;
  border-collapse: collapse;
  font-size: 12px;
}
.schedule-table th {
  background: #f0eed8;
  font-weight: 700;
  padding: 6px 8px;
  border: 1px solid #ccc;
  color: #333;
  text-align: center;
}
.schedule-table td {
  padding: 5px 8px;
  border: 1px solid #ccc;
  text-align: center;
}
.schedule-table td.left { text-align: left; }

/* ─── Signatures ─── */
.signatures {
  display: flex;
  justify-content: space-between;
  padding: 0 24px;
  margin-top: 24px;
  margin-bottom: 8px;
}
.sig-block {
  text-align: center;
  min-width: 120px;
}
.sig-line {
  border-top: 1.5px solid #555;
  padding-top: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

/* ─── Red Notice Strip ─── */
.notice-strip {
  background: linear-gradient(90deg, #c0392b, #e74c3c, #c0392b);
  color: white;
  text-align: center;
  padding: 7px 16px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 10px;
  letter-spacing: 0.5px;
}

@media print {
  body { padding: 4px; }
  .card { page-break-inside: avoid; margin-bottom: 16px; }
}
`;

function buildCardHTML(
  student: Student,
  examName: string,
  routines: Routine[],
  institution: InstitutionInfo,
  showPhoto: boolean = true,
): string {
  const logo = institution.logoUrl;
  const logoHtml = logo
    ? `<img class="logo" src="${logo}" />`
    : `<div style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:20px">🕌</div>`;

  const institutionNameEn = institution.subtitle || "";
  const phoneInfo = institution.phone ? `মোবাইল : ${institution.phone}` : "";
  const addressLine = [institution.address, phoneInfo].filter(Boolean).join(" • ");

  const examDates = routines.map(r => r.exam_date).filter(Boolean).sort();
  const firstDate = examDates[0] || "";
  const lastDate = examDates[examDates.length - 1] || "";
  const dateRange = firstDate && lastDate && firstDate !== lastDate
    ? `${formatDate(firstDate)} — ${formatDate(lastDate)}`
    : firstDate ? formatDate(firstDate) : "";

  let scheduleRows = "";
  routines.forEach((r, i) => {
    scheduleRows += `<tr>
      <td>${toBengaliNumber(i + 1)}</td>
      <td class="left" style="font-weight:600">${formatDate(r.exam_date)}</td>
      <td class="left" style="font-weight:600">${r.subject_name}</td>
      <td>${r.start_time} — ${r.end_time}</td>
      <td>${toBengaliNumber(r.full_marks)}</td>
      <td>${r.room || "—"}</td>
    </tr>`;
  });

  return `
  <div class="card">
    <!-- Header Banner -->
    <div class="card-header">
      ${logoHtml}
      <div class="inst-info">
        <div class="inst-name-bn">${institution.name}</div>
        ${institutionNameEn ? `<div class="inst-name-en">${institutionNameEn}</div>` : ""}
        <div class="inst-address">${addressLine}</div>
      </div>
    </div>

    <!-- Green Title Banner -->
    <div class="title-banner">প্রবেশপত্র</div>

    <!-- Exam Type -->
    <div class="exam-type">${examName}</div>

    <!-- Student Info -->
    <div class="student-info" style="padding-left:${showPhoto ? "110px" : "24px"}">
      <div class="info-row">
        <span class="label">শিক্ষার্থীর নাম :</span>
        <span class="value">${student.name}</span>
      </div>
      <div class="info-row">
        <span class="label">পিতার নাম :</span>
        <span class="value">${student.father_name || "—"}</span>
      </div>
      <div class="info-row-split">
        <div class="info-row">
          <span class="label">জামায়াত :</span>
          <span class="value">${student.class_name}${student.section ? ` (${student.section})` : ""}</span>
        </div>
        <div class="info-row">
          <span class="label">রোল :</span>
          <span class="value">${student.roll || "—"}</span>
        </div>
      </div>
      <div class="info-row">
        <span class="label">পরীক্ষার তারিখ :</span>
        <span class="value">${dateRange || "—"}</span>
      </div>
      <div class="info-row">
        <span class="label">আইডি :</span>
        <span class="value">${student.student_id}</span>
      </div>

      ${showPhoto ? `
      <div class="photo-box">
        ${student.photo_url ? `<img src="${student.photo_url}" />` : "ছবি"}
      </div>
      ` : ""}
    </div>

    <!-- Exam Schedule Table -->
    ${routines.length > 0 ? `
    <table class="schedule-table">
      <thead>
        <tr>
          <th style="width:30px">#</th>
          <th style="text-align:left">তারিখ</th>
          <th style="text-align:left">বিষয়</th>
          <th>সময়</th>
          <th>পূর্ণমান</th>
          <th>রুম</th>
        </tr>
      </thead>
      <tbody>${scheduleRows}</tbody>
    </table>
    ` : ""}

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-block"><div class="sig-line">শ্রেণি শিক্ষক</div></div>
      <div class="sig-block"><div class="sig-line">হিসাবরক্ষণ</div></div>
      <div class="sig-block"><div class="sig-line">মুতামিম</div></div>
    </div>

    <!-- Red Notice Strip -->
    <div class="notice-strip">
      বি.দ্র. পরীক্ষা চলাকালীন প্রতিদিন প্রবেশপত্র সঙ্গে আনতে হবে। নির্ধারিত সময়ের ১৫ মিনিট আগে উপস্থিত হতে হবে।
    </div>
  </div>`;
}

export function buildSingleAdmitCardHTML(
  student: Student,
  examName: string,
  routines: Routine[],
  institution: InstitutionInfo,
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>প্রবেশপত্র - ${student.name}</title>
  <style>${STYLES}
  body { max-width: 700px; margin: 0 auto; padding: 20px; direction: ltr; }
  </style></head><body>
  ${buildCardHTML(student, examName, routines, institution, true)}
  <script>setTimeout(function(){window.print()},600);</script>
  </body></html>`;
}

export function buildBulkAdmitCardHTML(
  students: Student[],
  examName: string,
  routines: Routine[],
  institution: InstitutionInfo,
): string {
  let cards = "";
  students.forEach(student => {
    cards += buildCardHTML(student, examName, routines, institution, true);
  });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>প্রবেশপত্র - ${examName}</title>
  <style>${STYLES}
  body { direction: ltr; }
  </style></head><body>
  ${cards}
  <script>setTimeout(function(){window.print()},600);</script>
  </body></html>`;
}
