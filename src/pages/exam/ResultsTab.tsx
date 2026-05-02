import { useState, useMemo } from "react";
import { useExams, useAllExamSubjects, useMarkEntries } from "@/hooks/useExams";
import { useStudents } from "@/hooks/useStudents";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Icon from "@/components/Icon";
import { getStudentResult, generateExamPDF, generateMarksheetPDF, type StudentResult } from "./examUtils";

export default function ResultsTab() {
  const { data: exams = [] } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: students = [] } = useStudents();
  const institution = useInstitutionInfo();

  const [resultExamId, setResultExamId] = useState("");
  const [viewResultStudent, setViewResultStudent] = useState<string | null>(null);

  const resultExam = exams.find((e) => e.id === resultExamId);
  const { data: resultExamMarks = [] } = useMarkEntries(resultExamId);
  const examSubs = useMemo(() => allSubjects.filter((s) => s.examId === resultExamId), [allSubjects, resultExamId]);

  const results = useMemo(() => {
    if (!resultExam) return [];
    const ids = [...new Set(resultExamMarks.map((m) => m.studentId))];
    return ids.map((id) => getStudentResult(resultExam, allSubjects, resultExamMarks, students, id)).filter(Boolean) as StudentResult[];
  }, [resultExam, resultExamMarks, allSubjects, students]);

  const viewResult = resultExam && viewResultStudent
    ? getStudentResult(resultExam, allSubjects, resultExamMarks, students, viewResultStudent)
    : null;

  const subjectAnalysis = useMemo(() => {
    if (!resultExam || results.length === 0) return [];
    return examSubs.map((sub) => {
      const marks = results.map((r) => r.subjectResults.find((sr) => sr.subject === sub.name)?.obtained || 0);
      const passCount = results.filter((r) => (r.subjectResults.find((sr) => sr.subject === sub.name)?.passed)).length;
      const sum = marks.reduce((a, b) => a + b, 0);
      return {
        name: sub.name,
        average: marks.length > 0 ? Math.round(sum / marks.length) : 0,
        highest: Math.max(...marks),
        lowest: Math.min(...marks),
        passCount,
        failCount: marks.length - passCount,
        passRate: marks.length > 0 ? Math.round((passCount / marks.length) * 100) : 0,
      };
    });
  }, [resultExam, results, examSubs]);

  const downloadResultsPDF = () => {
    if (!resultExam) return;
    const headers = `<tr><th>ছাত্রের নাম</th><th>রোল</th><th>মোট নম্বর</th><th>শতকরা</th><th>গ্রেড</th><th>জিপিএ</th><th>ফলাফল</th></tr>`;
    const rows = results.map((r) =>
      `<tr><td style="text-align:right">${r.studentName}</td><td>${toBengaliNumber(r.roll)}</td>` +
      `<td>${toBengaliNumber(r.totalObtained)}/${toBengaliNumber(r.totalFull)}</td>` +
      `<td>${toBengaliNumber(Math.round(r.overallPercent))}%</td><td>${r.grade}</td><td>${r.gpa}</td>` +
      `<td class="${r.passed ? "pass" : "fail"}">${r.passed ? "পাশ" : "ফেল"}</td></tr>`,
    ).join("");
    generateExamPDF("পরীক্ষার ফলাফল", resultExam, `<table><thead>${headers}</thead><tbody>${rows}</tbody></table>`, institution);
  };

  const downloadStudentMarksheet = (result: StudentResult) => {
    if (!resultExam) return;
    generateMarksheetPDF(result, resultExam, institution);
  };

  if (exams.length === 0) {
    return (
      <div className="content-box" style={{ textAlign: "center", padding: 50 }}>
        <Icon name="fa-graduation-cap" size={32} style={{ color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }} />
        <p style={{ color: "rgba(255,255,255,0.4)" }}>পরীক্ষা তৈরি ও নম্বর এন্ট্রির পর ফলাফল এখানে দেখা যাবে</p>
      </div>
    );
  }

  return (
    <>
      <div className="content-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <select className="glass-select" style={{ maxWidth: 300 }} value={resultExamId} onChange={(e) => setResultExamId(e.target.value)}>
          <option value="">পরীক্ষা নির্বাচন করুন</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.className})</option>
          ))}
        </select>
        {resultExam && results.length > 0 && (
          <button className="btn-outline-gold" onClick={downloadResultsPDF}>
            <Icon name="fa-download" /> ফলাফল PDF
          </button>
        )}
      </div>

      {resultExam && results.length > 0 && (
        <div className="content-box" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ছাত্রের নাম</th>
                  <th style={{ textAlign: "center" }}>রোল</th>
                  <th style={{ textAlign: "center" }}>মোট নম্বর</th>
                  <th style={{ textAlign: "center" }}>শতকরা</th>
                  <th style={{ textAlign: "center" }}>গ্রেড</th>
                  <th style={{ textAlign: "center" }}>জিপিএ</th>
                  <th style={{ textAlign: "center" }}>ফলাফল</th>
                  <th style={{ textAlign: "center" }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.studentId}>
                    <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(r.roll)}</td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(r.totalObtained)}/{toBengaliNumber(r.totalFull)}</td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(Math.round(r.overallPercent))}%</td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{r.grade}</td>
                    <td style={{ textAlign: "center" }}>{r.gpa}</td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className={r.passed ? "badge-success" : "badge-gold"}
                        style={{ background: r.passed ? "rgba(40,167,69,0.15)" : "rgba(220,53,69,0.15)", color: r.passed ? "#28a745" : "#dc3545" }}
                      >
                        {r.passed ? "পাশ" : "ফেল"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                        <button className="action-btn" onClick={() => setViewResultStudent(r.studentId)} title="বিস্তারিত">
                          <Icon name="fa-eye" />
                        </button>
                        <button className="action-btn" onClick={() => downloadStudentMarksheet(r)} title="মার্কশিট PDF">
                          <Icon name="fa-download" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultExam && results.length > 0 && subjectAnalysis.length > 0 && (
        <div className="content-box">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>
            <Icon name="fa-chart-bar" /> বিষয়ভিত্তিক বিশ্লেষণ
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>বিষয়</th>
                  <th style={{ textAlign: "center" }}>গড়</th>
                  <th style={{ textAlign: "center" }}>সর্বোচ্চ</th>
                  <th style={{ textAlign: "center" }}>সর্বনিম্ন</th>
                  <th style={{ textAlign: "center" }}>পাশ</th>
                  <th style={{ textAlign: "center" }}>ফেল</th>
                  <th style={{ textAlign: "center" }}>পাশের হার</th>
                </tr>
              </thead>
              <tbody>
                {subjectAnalysis.map((sa) => (
                  <tr key={sa.name}>
                    <td style={{ fontWeight: 600 }}>{sa.name}</td>
                    <td style={{ textAlign: "center" }}>{toBengaliNumber(sa.average)}</td>
                    <td style={{ textAlign: "center", color: "#28a745" }}>{toBengaliNumber(sa.highest)}</td>
                    <td style={{ textAlign: "center", color: "#dc3545" }}>{toBengaliNumber(sa.lowest)}</td>
                    <td style={{ textAlign: "center", color: "#28a745" }}>{toBengaliNumber(sa.passCount)}</td>
                    <td style={{ textAlign: "center", color: "#dc3545" }}>{toBengaliNumber(sa.failCount)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge-success" style={{ background: "rgba(40,167,69,0.15)", color: "#28a745" }}>
                        {toBengaliNumber(sa.passRate)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultExam && results.length === 0 && (
        <div className="content-box" style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.4)" }}>
          এই পরীক্ষায় কোনো নম্বর এন্ট্রি হয়নি
        </div>
      )}

      <Dialog open={!!viewResultStudent} onOpenChange={() => setViewResultStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>বিস্তারিত ফলাফল</DialogTitle>
          </DialogHeader>
          {viewResult && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontWeight: 700 }}>{viewResult.studentName}</p>
                <button className="btn-outline-gold" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => downloadStudentMarksheet(viewResult)}>
                  <Icon name="fa-download" size={12} /> মার্কশিট
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>বিষয়</th>
                    <th style={{ textAlign: "center" }}>প্রাপ্ত</th>
                    <th style={{ textAlign: "center" }}>পূর্ণমান</th>
                    <th style={{ textAlign: "center" }}>গ্রেড</th>
                    <th style={{ textAlign: "center" }}>ফলাফল</th>
                  </tr>
                </thead>
                <tbody>
                  {viewResult.subjectResults.map((sr) => (
                    <tr key={sr.subject}>
                      <td>{sr.subject}</td>
                      <td style={{ textAlign: "center" }}>{toBengaliNumber(sr.obtained)}</td>
                      <td style={{ textAlign: "center" }}>{toBengaliNumber(sr.fullMarks)}</td>
                      <td style={{ textAlign: "center" }}>{sr.grade}</td>
                      <td style={{ textAlign: "center", color: sr.passed ? "#28a745" : "#dc3545" }}>
                        {sr.passed ? "পাশ" : "ফেল"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 8, fontSize: 14 }}>
                <span>মোট: {toBengaliNumber(viewResult.totalObtained)}/{toBengaliNumber(viewResult.totalFull)}</span>
                <span>গ্রেড: {viewResult.grade} ({viewResult.gpa})</span>
                <span style={{ color: viewResult.passed ? "#28a745" : "#dc3545" }}>{viewResult.passed ? "পাশ" : "ফেল"}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
