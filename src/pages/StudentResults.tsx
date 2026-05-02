import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { useExams, useAllExamSubjects, useStudentMarkEntries } from "@/hooks/useExams";
import { useClasses } from "@/hooks/useClasses";
import { getStudentResult, getGrade, generateMarksheetPDF } from "./exam/examUtils";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import StudentResultCard from "./student-results/StudentResultCard";

export default function StudentResults() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: exams = [] } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: classes = [] } = useClasses();
  const institution = useInstitutionInfo();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const preSelectedId = params.get("student") || "";
  const [selectedStudentId, setSelectedStudentId] = useState(preSelectedId);
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [searchText, setSearchText] = useState("");

  const { data: studentMarks = [], isLoading: loadingMarks } = useStudentMarkEntries(selectedStudentId || undefined);

  // Filtered student list for the selector
  const filteredStudents = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    return students
      .filter(s => s.status === "active")
      .filter(s => !classFilter || s.class_id === classFilter)
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.roll || "").includes(q) || s.student_id.includes(q));
  }, [students, classFilter, searchText]);

  const selectedStudent = students.find(s => s.student_id === selectedStudentId);

  // Compute results per exam for this student
  const examResults = useMemo(() => {
    if (!selectedStudentId || studentMarks.length === 0) return [];

    // Find which exams this student has marks for
    const examIds = [...new Set(studentMarks.map(m => m.examId))];

    return examIds
      .map(examId => {
        const exam = exams.find(e => e.id === examId);
        if (!exam) return null;
        const result = getStudentResult(exam, allSubjects, studentMarks, students, selectedStudentId);
        if (!result) return null;
        return { exam, result };
      })
      .filter(Boolean) as { exam: typeof exams[0]; result: NonNullable<ReturnType<typeof getStudentResult>> }[];
  }, [selectedStudentId, studentMarks, exams, allSubjects, students]);

  // Overall summary stats
  const summary = useMemo(() => {
    if (examResults.length === 0) return null;
    const totalExams = examResults.length;
    const passedExams = examResults.filter(r => r.result.passed).length;
    const failedExams = totalExams - passedExams;
    const avgPercent = examResults.reduce((s, r) => s + r.result.overallPercent, 0) / totalExams;
    const bestExam = examResults.reduce((best, r) => r.result.overallPercent > best.result.overallPercent ? r : best, examResults[0]);
    return { totalExams, passedExams, failedExams, avgPercent, bestExam };
  }, [examResults]);

  const handlePrintMarksheet = (examId: string) => {
    const item = examResults.find(r => r.exam.id === examId);
    if (!item) return;
    generateMarksheetPDF(item.result, item.exam, institution);
  };

  if (loadingStudents) return (
    <div>
      <div className="page-header"><h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}><Icon name="fa-chart-bar" style={{ marginLeft: 8 }} /> শিক্ষার্থী ফলাফল</h2></div>
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" style={{ borderRadius: 10, marginBottom: 12 }} />)}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
            <Icon name="fa-chart-bar" style={{ marginLeft: 8 }} /> শিক্ষার্থী ফলাফল
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>
            শিক্ষার্থী নির্বাচন করে সকল পরীক্ষার ফলাফল দেখুন
          </p>
        </div>
        {selectedStudent && (
          <button className="btn-outline-gold" onClick={() => navigate(`/students/${selectedStudent.student_id}`)}>
            <Icon name="fa-user" /> প্রোফাইল দেখুন
          </button>
        )}
      </div>

      {/* Student selector */}
      <div className="content-box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
        <div style={{ flex: "0 1 180px" }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>শ্রেণি</label>
          <select className="glass-select" style={{ width: "100%" }} value={classFilter} onChange={e => { setClassFilter(e.target.value ? Number(e.target.value) : ""); setSelectedStudentId(""); }}>
            <option value="">সকল শ্রেণি</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 200px", position: "relative" }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>শিক্ষার্থী খুঁজুন</label>
          <span style={{ position: "absolute", left: 14, bottom: 10 }}><Icon name="fa-search" size={13} style={{ color: "rgba(255,255,255,0.4)" }} /></span>
          <input className="glass-input" style={{ paddingLeft: 38, width: "100%" }} placeholder="নাম, রোল বা আইডি..." value={searchText} onChange={e => setSearchText(e.target.value)} />
        </div>
        <div style={{ flex: "1 1 250px" }}>
          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" }}>শিক্ষার্থী নির্বাচন করুন *</label>
          <select
            className="glass-select"
            style={{ width: "100%" }}
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
          >
            <option value="">— নির্বাচন করুন —</option>
            {filteredStudents.map(s => (
              <option key={s.student_id} value={s.student_id}>
                {s.name} — {s.class_name} {s.roll ? `(রোল: ${s.roll})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* No student selected */}
      {!selectedStudentId && (
        <div className="content-box" style={{ textAlign: "center", padding: 60 }}>
          <Icon name="fa-chart-bar" size={40} style={{ color: "rgba(255,255,255,0.15)", display: "block", marginBottom: 14 }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>উপরে থেকে একজন শিক্ষার্থী নির্বাচন করুন</p>
        </div>
      )}

      {/* Loading */}
      {selectedStudentId && loadingMarks && (
        <div style={{ display: "grid", gap: 12, marginTop: 4 }}>
          {[1, 2].map(i => <Skeleton key={i} className="h-32" style={{ borderRadius: 10 }} />)}
        </div>
      )}

      {/* No results */}
      {selectedStudentId && !loadingMarks && examResults.length === 0 && (
        <div className="content-box" style={{ textAlign: "center", padding: 50 }}>
          <Icon name="fa-clipboard-list" size={36} style={{ color: "rgba(255,255,255,0.15)", display: "block", marginBottom: 14 }} />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15 }}>এই শিক্ষার্থীর কোনো পরীক্ষার ফলাফল পাওয়া যায়নি</p>
        </div>
      )}

      {/* Summary cards */}
      {summary && selectedStudent && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginTop: 4 }}>
          <div className="content-box" style={{ padding: "14px 16px", textAlign: "center" }}>
            <Icon name="fa-user-graduate" size={20} style={{ color: "#d4af37", display: "block", marginBottom: 4 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{selectedStudent.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{selectedStudent.class_name} {selectedStudent.roll ? `• রোল: ${selectedStudent.roll}` : ""}</div>
          </div>
          <div className="content-box" style={{ padding: "14px 16px", textAlign: "center" }}>
            <Icon name="fa-file-alt" size={20} style={{ color: "#60a5fa", display: "block", marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#60a5fa" }}>{toBengaliNumber(summary.totalExams)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট পরীক্ষা</div>
          </div>
          <div className="content-box" style={{ padding: "14px 16px", textAlign: "center" }}>
            <Icon name="fa-check-circle" size={20} style={{ color: "#28a745", display: "block", marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: "#28a745" }}>{toBengaliNumber(summary.passedExams)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>পাশ</div>
          </div>
          <div className="content-box" style={{ padding: "14px 16px", textAlign: "center" }}>
            <Icon name="fa-times-circle" size={20} style={{ color: summary.failedExams > 0 ? "#ef4444" : "rgba(255,255,255,0.3)", display: "block", marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: summary.failedExams > 0 ? "#ef4444" : "rgba(255,255,255,0.3)" }}>{toBengaliNumber(summary.failedExams)}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>ফেল</div>
          </div>
          <div className="content-box" style={{ padding: "14px 16px", textAlign: "center" }}>
            <Icon name="fa-trophy" size={20} style={{ color: "#d4af37", display: "block", marginBottom: 4 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "#d4af37" }}>{getGrade(summary.avgPercent).grade}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>গড় গ্রেড ({toBengaliNumber(Math.round(summary.avgPercent))}%)</div>
          </div>
        </div>
      )}

      {/* Exam result cards */}
      {examResults.length > 0 && (
        <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
          {examResults.map(({ exam, result }) => (
            <StudentResultCard
              key={exam.id}
              exam={exam}
              result={result}
              onPrintMarksheet={() => handlePrintMarksheet(exam.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
