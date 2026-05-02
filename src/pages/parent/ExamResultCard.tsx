import { useState } from "react";
import Icon from "@/components/Icon";
import { toBengaliNumber } from "@/lib/constants";
import { getGrade } from "@/pages/exam/examUtils";
import type { StudentRow } from "@/hooks/useStudents";

/* ── Raw DB shapes (snake_case from Supabase) ── */
export interface RawExamSubject {
  id: string;
  exam_id: string;
  name: string;
  full_marks: number;
  pass_marks: number;
}

export interface RawMarkEntry {
  id: string;
  exam_id: string;
  student_id: string;
  subject_name: string;
  marks: number;
}

export interface ExamGroup {
  examId: string;
  examName: string;
  examDate?: string;
  className?: string;
  subjects: RawExamSubject[];
  marks: RawMarkEntry[];
}

/* ── Grade badge colors ── */
function gradeColor(grade: string): { text: string; bg: string; border: string } {
  if (grade === "A+") return { text: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.3)" };
  if (grade === "A")  return { text: "#4ade80", bg: "rgba(74,222,128,0.13)", border: "rgba(74,222,128,0.28)" };
  if (grade === "A-") return { text: "#86efac", bg: "rgba(134,239,172,0.12)", border: "rgba(134,239,172,0.25)" };
  if (grade === "B")  return { text: "#60a5fa", bg: "rgba(96,165,250,0.13)", border: "rgba(96,165,250,0.28)" };
  if (grade === "C")  return { text: "#fbbf24", bg: "rgba(251,191,36,0.13)", border: "rgba(251,191,36,0.28)" };
  if (grade === "D")  return { text: "#fb923c", bg: "rgba(251,146,60,0.13)", border: "rgba(251,146,60,0.28)" };
  return                { text: "#f87171", bg: "rgba(248,113,113,0.13)", border: "rgba(248,113,113,0.28)" };
}

/* ── Mini progress bar ── */
function MarkBar({ obtained, full, passed }: { obtained: number; full: number; passed: boolean }) {
  const pct = full > 0 ? Math.min(100, Math.round((obtained / full) * 100)) : 0;
  return (
    <div style={{ width: "100%", height: 4, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 3, width: `${pct}%`, transition: "width 0.4s ease",
        background: passed ? "linear-gradient(90deg,#34d399,#10b981)" : "linear-gradient(90deg,#f87171,#ef4444)",
      }} />
    </div>
  );
}

/* ── Print/download the result sheet for one exam ── */
function printResultSheet(student: StudentRow, eg: ExamGroup, madrasaName: string) {
  const subjects = eg.subjects;
  const marks = eg.marks.filter(m => m.student_id === student.student_id && m.exam_id === eg.examId);

  let totalObtained = 0;
  let totalFull = 0;
  let allPassed = true;

  const rows = subjects.map(sub => {
    const entry = marks.find(m => m.subject_name === sub.name);
    const obtained = entry ? Number(entry.marks) : 0;
    totalObtained += obtained;
    totalFull += sub.full_marks;
    const passed = obtained >= sub.pass_marks;
    if (!passed) allPassed = false;
    const pct = sub.full_marks > 0 ? (obtained / sub.full_marks) * 100 : 0;
    const { grade } = getGrade(pct);
    return { name: sub.name, obtained, fullMarks: sub.full_marks, passMarks: sub.pass_marks, passed, grade };
  });

  const overallPct = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
  const { grade: overallGrade, gpa } = getGrade(overallPct);
  const finalGrade = allPassed ? overallGrade : "F";
  const finalGpa   = allPassed ? gpa : "০.০০";

  const tableRows = rows.map(r =>
    `<tr>
      <td style="text-align:right;padding:7px 10px;border-bottom:1px solid #e5e7eb">${r.name}</td>
      <td style="text-align:center;padding:7px 10px;border-bottom:1px solid #e5e7eb;font-weight:600">${toBengaliNumber(r.obtained)}</td>
      <td style="text-align:center;padding:7px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280">${toBengaliNumber(r.fullMarks)}</td>
      <td style="text-align:center;padding:7px 10px;border-bottom:1px solid #e5e7eb;color:#6b7280">${toBengaliNumber(r.passMarks)}</td>
      <td style="text-align:center;padding:7px 10px;border-bottom:1px solid #e5e7eb;font-weight:700">${r.grade}</td>
      <td style="text-align:center;padding:7px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;color:${r.passed ? "#16a34a" : "#dc2626"}">${r.passed ? "পাশ" : "ফেল"}</td>
    </tr>`
  ).join("");

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>মার্কশিট — ${student.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans Bengali', sans-serif; background: #fff; color: #111; padding: 30px; max-width: 760px; margin: 0 auto; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 80px; font-weight: 900; color: rgba(168,85,247,0.06); pointer-events: none; white-space: nowrap; }
    .header { text-align: center; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 3px double #7c3aed; }
    .header h1 { font-size: 22px; font-weight: 700; color: #5b21b6; }
    .header p { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .title-bar { text-align: center; margin-bottom: 20px; }
    .title-bar h2 { font-size: 16px; font-weight: 700; color: #374151; }
    .title-bar .badge { display: inline-block; margin-top: 6px; padding: 3px 14px; border-radius: 20px; background: #ede9fe; color: #5b21b6; font-size: 12px; font-weight: 600; border: 1px solid #c4b5fd; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; padding: 14px 18px; background: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb; font-size: 13px; }
    .student-info .row { display: flex; gap: 6px; }
    .student-info .label { color: #6b7280; min-width: 90px; }
    .student-info .val { font-weight: 600; color: #111; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    thead tr { background: #5b21b6; color: #fff; }
    thead th { padding: 10px; text-align: center; font-weight: 600; font-size: 12px; }
    thead th:first-child { text-align: right; }
    tbody tr:last-child td { border-bottom: none; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 24px; }
    .summary-item { text-align: center; padding: 12px 8px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
    .summary-item .val { font-size: 18px; font-weight: 700; color: #5b21b6; }
    .summary-item .lbl { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .result-badge { display: inline-block; padding: 4px 18px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-top: 4px; }
    .pass-badge { background: #dcfce7; color: #16a34a; border: 1px solid #86efac; }
    .fail-badge { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .footer { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
    .sig-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; }
    .sig-box { text-align: center; padding-top: 36px; border-top: 1px solid #9ca3af; font-size: 11px; color: #6b7280; }
    @media print { body { padding: 15px; } .watermark { display: block; } }
  </style>
</head>
<body>
  <div class="watermark">${madrasaName}</div>

  <div class="header">
    <h1>${madrasaName}</h1>
    <p>পরীক্ষার ফলাফল — অফিসিয়াল মার্কশিট</p>
  </div>

  <div class="title-bar">
    <h2>${eg.examName}</h2>
    <div>
      <span class="badge">শ্রেণি: ${eg.className || student.class_name}</span>
      ${eg.examDate ? `<span class="badge" style="margin-left:8px">তারিখ: ${eg.examDate}</span>` : ""}
    </div>
  </div>

  <div class="student-info">
    <div class="row"><span class="label">ছাত্রের নাম:</span><span class="val">${student.name}</span></div>
    <div class="row"><span class="label">ছাত্র আইডি:</span><span class="val">${student.student_id}</span></div>
    <div class="row"><span class="label">শ্রেণি:</span><span class="val">${student.class_name}</span></div>
    <div class="row"><span class="label">রোল:</span><span class="val">${student.roll || "—"}</span></div>
    <div class="row"><span class="label">পিতার নাম:</span><span class="val">${student.father_name || "—"}</span></div>
    <div class="row"><span class="label">মাতার নাম:</span><span class="val">${student.mother_name || "—"}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:right;width:35%">বিষয়</th>
        <th>প্রাপ্ত নম্বর</th>
        <th>পূর্ণমান</th>
        <th>পাশ নম্বর</th>
        <th>গ্রেড</th>
        <th>ফলাফল</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <div class="summary">
    <div class="summary-item">
      <div class="val">${toBengaliNumber(totalObtained)}/${toBengaliNumber(totalFull)}</div>
      <div class="lbl">মোট নম্বর</div>
    </div>
    <div class="summary-item">
      <div class="val">${toBengaliNumber(Math.round(overallPct))}%</div>
      <div class="lbl">শতকরা</div>
    </div>
    <div class="summary-item">
      <div class="val">${finalGrade}</div>
      <div class="lbl">গ্রেড (${finalGpa})</div>
    </div>
    <div class="summary-item">
      <span class="result-badge ${allPassed ? "pass-badge" : "fail-badge"}">${allPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}</span>
      <div class="lbl" style="margin-top:4px">ফলাফল</div>
    </div>
  </div>

  <div class="sig-row">
    <div class="sig-box">ক্লাস শিক্ষকের স্বাক্ষর</div>
    <div class="sig-box">পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর</div>
    <div class="sig-box">অধ্যক্ষের স্বাক্ষর</div>
  </div>

  <div class="footer">
    স্বয়ংক্রিয়ভাবে তৈরি — ${new Date().toLocaleDateString("bn-BD")} | ${madrasaName}
  </div>

  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body>
</html>
  `);
  win.document.close();
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
interface Props {
  examGroups: ExamGroup[];
  student: StudentRow;
  madrasaName?: string;
}

export default function ExamResultCard({ examGroups, student, madrasaName = "মাদরাসা" }: Props) {
  const [openExamId, setOpenExamId] = useState<string | null>(
    examGroups[0]?.examId ?? null
  );

  if (examGroups.length === 0) {
    return (
      <div className="content-box" style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="fa-trophy" size={15} style={{ color: "#a855f7" }} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--th-text)", margin: 0 }}>পরীক্ষার ফলাফল</h2>
        </div>
        <Icon name="fa-clipboard-list" size={40} style={{ color: "var(--th-text-dim)", marginBottom: 12 }} />
        <p style={{ color: "var(--th-text-dim)", fontSize: 14 }}>এখনো কোনো পরীক্ষার ফলাফল পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div className="content-box" style={{ padding: "20px 22px" }}>
      {/* Section heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="fa-trophy" size={15} style={{ color: "#a855f7" }} />
        </div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--th-text)", margin: 0 }}>পরীক্ষার ফলাফল</h2>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--th-text-muted)", background: "var(--th-hover-bg)", padding: "2px 10px", borderRadius: 20 }}>
          {toBengaliNumber(examGroups.length)} টি পরীক্ষা
        </span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {examGroups.map(eg => {
          const studentMarks = eg.marks.filter(m => m.student_id === student.student_id && m.exam_id === eg.examId);

          // Calculate per-subject results
          let totalObtained = 0, totalFull = 0, allPassed = true;
          const subjectResults = eg.subjects.map(sub => {
            const entry = studentMarks.find(m => m.subject_name === sub.name);
            const obtained = entry ? Number(entry.marks) : 0;
            totalObtained += obtained;
            totalFull += sub.full_marks;
            const passed = obtained >= sub.pass_marks;
            if (!passed) allPassed = false;
            const pct = sub.full_marks > 0 ? (obtained / sub.full_marks) * 100 : 0;
            const { grade, gpa } = getGrade(pct);
            return { name: sub.name, obtained, fullMarks: sub.full_marks, passMarks: sub.pass_marks, passed, grade, gpa };
          });

          const overallPct = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
          const { grade: oGrade, gpa: oGpa } = getGrade(overallPct);
          const finalGrade = allPassed ? oGrade : "F";
          const finalGpa   = allPassed ? oGpa : "০.০০";
          const gc = gradeColor(finalGrade);
          const isOpen = openExamId === eg.examId;

          return (
            <div key={eg.examId} style={{ border: "1px solid var(--th-border)", borderRadius: 12, overflow: "hidden" }}>

              {/* Exam header row */}
              <button
                type="button"
                onClick={() => setOpenExamId(isOpen ? null : eg.examId)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 16px", background: isOpen ? "rgba(168,85,247,0.07)" : "var(--th-card-bg)",
                  border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                {/* Exam icon */}
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="fa-clipboard-list" size={15} style={{ color: "#a855f7" }} />
                </div>

                {/* Exam name + class */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--th-text)" }}>{eg.examName}</div>
                  {(eg.className || eg.examDate) && (
                    <div style={{ fontSize: 11, color: "var(--th-text-dim)", marginTop: 2 }}>
                      {eg.className && <span>{eg.className}</span>}
                      {eg.className && eg.examDate && <span> · </span>}
                      {eg.examDate && <span>{eg.examDate}</span>}
                    </div>
                  )}
                </div>

                {/* Score + grade badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--th-text)" }}>
                      {toBengaliNumber(totalObtained)}<span style={{ color: "var(--th-text-dim)", fontWeight: 400 }}>/{toBengaliNumber(totalFull)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--th-text-muted)" }}>{toBengaliNumber(Math.round(overallPct))}%</div>
                  </div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: gc.bg, border: `1px solid ${gc.border}`, color: gc.text, fontSize: 12, fontWeight: 700, minWidth: 38, textAlign: "center" }}>
                    {finalGrade}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: allPassed ? "rgba(52,211,153,0.13)" : "rgba(248,113,113,0.13)", color: allPassed ? "#34d399" : "#f87171", border: `1px solid ${allPassed ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                    {allPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ"}
                  </span>
                  <Icon name="fa-chevron-down" size={13} style={{ color: "var(--th-text-dim)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
                </div>
              </button>

              {/* Expanded detail panel */}
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--th-border)" }}>

                  {/* Summary strip */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--th-border)" }}>
                    {[
                      { label: "মোট নম্বর",   value: `${toBengaliNumber(totalObtained)}/${toBengaliNumber(totalFull)}`, color: "#a855f7" },
                      { label: "শতকরা",        value: `${toBengaliNumber(Math.round(overallPct))}%`,                   color: overallPct >= 75 ? "#34d399" : overallPct >= 50 ? "#fbbf24" : "#f87171" },
                      { label: "গ্রেড",         value: `${finalGrade} (${finalGpa})`,                                  color: gc.text },
                      { label: "ফলাফল",        value: allPassed ? "উত্তীর্ণ" : "অনুত্তীর্ণ",                       color: allPassed ? "#34d399" : "#f87171" },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "10px 8px", textAlign: "center", background: "var(--th-card-bg)" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: "var(--th-text-dim)", marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Subject-wise table */}
                  {subjectResults.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "rgba(168,85,247,0.06)" }}>
                            {["বিষয়", "পূর্ণমান", "পাশ নম্বর", "প্রাপ্ত নম্বর", "অগ্রগতি", "গ্রেড", "ফলাফল"].map(h => (
                              <th key={h} style={{ padding: "9px 12px", textAlign: h === "বিষয়" ? "left" : "center", fontWeight: 600, color: "var(--th-text-muted)", fontSize: 11, whiteSpace: "nowrap", borderBottom: "1px solid var(--th-border)" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {subjectResults.map((sr, i) => {
                            const sc = gradeColor(sr.grade);
                            return (
                              <tr key={sr.name} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                                <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--th-text)", borderBottom: "1px solid var(--th-border)" }}>
                                  {sr.name}
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--th-text-muted)", borderBottom: "1px solid var(--th-border)" }}>
                                  {toBengaliNumber(sr.fullMarks)}
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--th-text-muted)", borderBottom: "1px solid var(--th-border)" }}>
                                  {toBengaliNumber(sr.passMarks)}
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: sr.passed ? "#34d399" : "#f87171", borderBottom: "1px solid var(--th-border)" }}>
                                  {toBengaliNumber(sr.obtained)}
                                </td>
                                <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--th-border)", minWidth: 80 }}>
                                  <MarkBar obtained={sr.obtained} full={sr.fullMarks} passed={sr.passed} />
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center", borderBottom: "1px solid var(--th-border)" }}>
                                  <span style={{ padding: "2px 10px", borderRadius: 20, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: 12, fontWeight: 700 }}>
                                    {sr.grade}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600, color: sr.passed ? "#34d399" : "#f87171", borderBottom: "1px solid var(--th-border)" }}>
                                  {sr.passed ? "পাশ ✓" : "ফেল ✗"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--th-text-dim)", fontSize: 13 }}>
                      এই পরীক্ষার বিস্তারিত নম্বর পাওয়া যায়নি।
                    </div>
                  )}

                  {/* Grade legend + download button */}
                  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--th-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    {/* Grade scale */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: 11 }}>
                      {[
                        { g: "A+", min: "৮০%+" }, { g: "A", min: "৭০%+" }, { g: "A-", min: "৬০%+" },
                        { g: "B", min: "৫০%+" },  { g: "C", min: "৪০%+" }, { g: "D", min: "৩৩%+" }, { g: "F", min: "<৩৩%" },
                      ].map(({ g, min }) => {
                        const c = gradeColor(g);
                        return (
                          <span key={g} style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--th-text-dim)" }}>
                            <span style={{ fontWeight: 700, color: c.text }}>{g}</span>={min}
                          </span>
                        );
                      })}
                    </div>

                    {/* Download / print button */}
                    <button
                      type="button"
                      onClick={() => printResultSheet(student, eg, madrasaName)}
                      className="btn-gold"
                      style={{ padding: "7px 16px", fontSize: 12, gap: 6, flexShrink: 0 }}
                    >
                      <Icon name="fa-print" size={13} /> মার্কশিট ডাউনলোড
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
