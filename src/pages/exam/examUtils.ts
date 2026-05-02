import type { ExamRow, ExamSubjectRow, MarkEntryRow } from "@/hooks/useExams";
import type { StudentRow } from "@/hooks/useStudents";
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";

export interface SubjectResult {
  subject: string;
  obtained: number;
  fullMarks: number;
  passMarks: number;
  passed: boolean;
  grade: string;
  gpa: string;
}

export interface StudentResult {
  studentId: string;
  studentName: string;
  roll: string;
  subjectResults: SubjectResult[];
  totalObtained: number;
  totalFull: number;
  overallPercent: number;
  grade: string;
  gpa: string;
  passed: boolean;
}

export function getGrade(percent: number): { grade: string; gpa: string } {
  if (percent >= 80) return { grade: "A+", gpa: "৫.০০" };
  if (percent >= 70) return { grade: "A", gpa: "৪.০০" };
  if (percent >= 60) return { grade: "A-", gpa: "৩.৫০" };
  if (percent >= 50) return { grade: "B", gpa: "৩.০০" };
  if (percent >= 40) return { grade: "C", gpa: "২.০০" };
  if (percent >= 33) return { grade: "D", gpa: "১.০০" };
  return { grade: "F", gpa: "০.০০" };
}

export function getStudentResult(
  exam: ExamRow,
  examSubjects: ExamSubjectRow[],
  marks: MarkEntryRow[],
  students: StudentRow[],
  studentId: string,
): StudentResult | null {
  const subs = examSubjects.filter((s) => s.examId === exam.id);
  const studentMarks = marks.filter((m) => m.studentId === studentId);
  if (studentMarks.length === 0) return null;

  const student = students.find((s) => s.student_id === studentId);
  let totalObtained = 0;
  let totalFull = 0;
  let allPassed = true;

  const subjectResults: SubjectResult[] = subs.map((sub) => {
    const entry = studentMarks.find((m) => m.subjectName === sub.name);
    const obtained = entry ? Number(entry.marks) : 0;
    totalObtained += obtained;
    totalFull += sub.fullMarks;
    const passed = obtained >= sub.passMarks;
    if (!passed) allPassed = false;
    const pct = (obtained / sub.fullMarks) * 100;
    const { grade, gpa } = getGrade(pct);
    return { subject: sub.name, obtained, fullMarks: sub.fullMarks, passMarks: sub.passMarks, passed, grade, gpa };
  });

  const overallPercent = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
  const { grade, gpa } = getGrade(overallPercent);

  return {
    studentId,
    studentName: student?.name || "",
    roll: student?.roll || "",
    subjectResults,
    totalObtained,
    totalFull,
    overallPercent,
    grade: allPassed ? grade : "F",
    gpa: allPassed ? gpa : "০.০০",
    passed: allPassed,
  };
}

export function generateExamPDF(
  title: string,
  exam: ExamRow,
  htmlContent: string,
  institution: InstitutionInfo,
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const dateStr = new Date().toLocaleDateString("bn-BD");
  printWindow.document.write(
    `<html><head><title>${title}</title>` +
    `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">` +
    `<style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Noto Sans Bengali',sans-serif}` +
    `body{padding:30px;max-width:900px;margin:0 auto}` +
    `.header{text-align:center;border-bottom:3px double #000;padding-bottom:12px;margin-bottom:15px}` +
    `.header h1{font-size:18px;font-weight:700}.header p{font-size:11px;color:#666}` +
    `.exam-info{text-align:center;margin-bottom:15px;font-size:13px}.exam-info strong{font-size:15px}` +
    `table{width:100%;border-collapse:collapse;font-size:12px;margin-top:10px}` +
    `th,td{border:1px solid #ccc;padding:6px 10px;text-align:center}` +
    `th{background:#f0f0f0;font-weight:600}.pass{color:green}.fail{color:red}` +
    `.top3{background:#fffde7}.footer{margin-top:30px;text-align:center;font-size:10px;color:#999}` +
    `@media print{body{padding:15px}}</style></head>` +
    `<body><div class="header"><h1>${institution.name}</h1><p>${institution.address}</p></div>` +
    `<div class="exam-info"><strong>${title}</strong><br/>` +
    `<span>পরীক্ষা: ${exam.name} | শ্রেণি: ${exam.className} | তারিখ: ${exam.date}</span></div>` +
    `${htmlContent}` +
    `<div class="footer">স্বয়ংক্রিয়ভাবে তৈরি — ${dateStr}</div>` +
    `<script>window.print();</script></body></html>`,
  );
}

export function generateMarksheetPDF(
  result: StudentResult,
  exam: ExamRow,
  institution: InstitutionInfo,
) {
  const rows = result.subjectResults
    .map(
      (sr) =>
        `<tr><td style="text-align:right">${sr.subject}</td>` +
        `<td>${toBengaliNumber(sr.obtained)}</td>` +
        `<td>${toBengaliNumber(sr.fullMarks)}</td>` +
        `<td>${sr.grade}</td>` +
        `<td class="${sr.passed ? "pass" : "fail"}">${sr.passed ? "পাশ" : "ফেল"}</td></tr>`,
    )
    .join("");

  const html =
    `<div style="margin-bottom:12px;font-size:14px;">` +
    `<strong>ছাত্রের নাম:</strong> ${result.studentName} &nbsp;|&nbsp; ` +
    `<strong>রোল:</strong> ${toBengaliNumber(result.roll)}</div>` +
    `<table><thead><tr><th>বিষয়</th><th>প্রাপ্ত</th><th>পূর্ণমান</th><th>গ্রেড</th><th>ফলাফল</th></tr></thead>` +
    `<tbody>${rows}</tbody></table>` +
    `<div style="margin-top:12px;font-size:13px;display:flex;justify-content:space-between;">` +
    `<span>মোট: ${toBengaliNumber(result.totalObtained)}/${toBengaliNumber(result.totalFull)}</span>` +
    `<span>শতকরা: ${toBengaliNumber(Math.round(result.overallPercent))}%</span>` +
    `<span>গ্রেড: ${result.grade} (${result.gpa})</span>` +
    `<span class="${result.passed ? "pass" : "fail"}">${result.passed ? "পাশ" : "ফেল"}</span></div>`;

  generateExamPDF("মার্কশিট", exam, html, institution);
}
