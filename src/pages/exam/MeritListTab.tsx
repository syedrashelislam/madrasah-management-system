import { useState, useMemo } from "react";
import { useExams, useAllExamSubjects, useMarkEntries } from "@/hooks/useExams";
import { useStudents } from "@/hooks/useStudents";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import { getStudentResult, generateExamPDF, type StudentResult } from "./examUtils";

export default function MeritListTab() {
  const { data: exams = [] } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: students = [] } = useStudents();
  const institution = useInstitutionInfo();

  const [meritExamId, setMeritExamId] = useState("");
  const meritExam = exams.find((e) => e.id === meritExamId);
  const { data: meritExamMarks = [] } = useMarkEntries(meritExamId);

  const meritList = useMemo(() => {
    if (!meritExam) return [];
    const ids = [...new Set(meritExamMarks.map((m) => m.studentId))];
    return ids
      .map((id) => getStudentResult(meritExam, allSubjects, meritExamMarks, students, id))
      .filter(Boolean)
      .sort((a, b) => (b as StudentResult).totalObtained - (a as StudentResult).totalObtained) as StudentResult[];
  }, [meritExam, meritExamMarks, allSubjects, students]);

  const downloadMeritPDF = () => {
    if (!meritExam) return;
    const headers = `<tr><th>মেধা ক্রম</th><th>ছাত্রের নাম</th><th>রোল</th><th>মোট নম্বর</th><th>শতকরা</th><th>গ্রেড</th><th>ফলাফল</th></tr>`;
    const rows = meritList
      .map((r, idx) => {
        const medal = idx < 3 ? ["🥇", "🥈", "🥉"][idx] : "";
        return (
          `<tr class="${idx < 3 ? "top3" : ""}">` +
          `<td>${medal} ${toBengaliNumber(idx + 1)}</td>` +
          `<td style="text-align:right">${r.studentName}</td>` +
          `<td>${toBengaliNumber(r.roll)}</td>` +
          `<td>${toBengaliNumber(r.totalObtained)}/${toBengaliNumber(r.totalFull)}</td>` +
          `<td>${toBengaliNumber(Math.round(r.overallPercent))}%</td>` +
          `<td>${r.grade}</td>` +
          `<td class="${r.passed ? "pass" : "fail"}">${r.passed ? "পাশ" : "ফেল"}</td></tr>`
        );
      })
      .join("");
    generateExamPDF("মেধা তালিকা", meritExam, `<table><thead>${headers}</thead><tbody>${rows}</tbody></table>`, institution);
  };

  if (exams.length === 0) {
    return (
      <div className="content-box" style={{ textAlign: "center", padding: 50 }}>
        <Icon name="fa-trophy" size={32} style={{ color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }} />
        <p style={{ color: "rgba(255,255,255,0.4)" }}>পরীক্ষা তৈরি ও নম্বর এন্ট্রির পর মেধা তালিকা এখানে দেখা যাবে</p>
      </div>
    );
  }

  return (
    <>
      <div className="content-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <select className="glass-select" style={{ maxWidth: 300 }} value={meritExamId} onChange={(e) => setMeritExamId(e.target.value)}>
          <option value="">পরীক্ষা নির্বাচন করুন</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.className})</option>
          ))}
        </select>
        {meritExam && meritList.length > 0 && (
          <button className="btn-outline-gold" onClick={downloadMeritPDF}>
            <Icon name="fa-download" /> মেধা তালিকা PDF
          </button>
        )}
      </div>

      {meritExam && meritList.length > 0 && (
        <div className="content-box" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>মেধা ক্রম</th>
                  <th>ছাত্রের নাম</th>
                  <th style={{ textAlign: "center" }}>রোল</th>
                  <th style={{ textAlign: "center" }}>মোট নম্বর</th>
                  <th style={{ textAlign: "center" }}>শতকরা</th>
                  <th style={{ textAlign: "center" }}>গ্রেড</th>
                  <th style={{ textAlign: "center" }}>ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {meritList.map((r, idx) => (
                  <tr key={r.studentId} style={{ background: idx < 3 ? "rgba(212,175,55,0.05)" : undefined }}>
                    <td style={{ textAlign: "center", fontWeight: 700, fontSize: idx < 3 ? 18 : 14 }}>
                      {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : ""} {toBengaliNumber(idx + 1)}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(r.roll)}</td>
                    <td style={{ textAlign: "center" }}>
                      {toBengaliNumber(r.totalObtained)}/{toBengaliNumber(r.totalFull)}
                    </td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(Math.round(r.overallPercent))}%</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{r.grade}</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={r.passed ? "badge-success" : "badge-gold"}
                        style={{
                          background: r.passed ? "rgba(40,167,69,0.15)" : "rgba(220,53,69,0.15)",
                          color: r.passed ? "#28a745" : "#dc3545",
                        }}
                      >
                        {r.passed ? "পাশ" : "ফেল"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meritExam && meritList.length === 0 && (
        <div className="content-box" style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.4)" }}>
          এই পরীক্ষায় কোনো নম্বর এন্ট্রি হয়নি
        </div>
      )}
    </>
  );
}
