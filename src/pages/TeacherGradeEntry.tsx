import { useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useExams, useAllExamSubjects, useMarkEntries, useSaveMarks } from "@/hooks/useExams";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { toBengaliNumber } from "@/lib/constants";
import { getGrade } from "./exam/examUtils";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";

const EXAM_LINKS = [
  { path: '/exams',               icon: 'fa-edit',           label: 'নম্বর এন্ট্রি',   color: '#d4af37' },
  { path: '/teacher-grade-entry', icon: 'fa-pen-fancy',      label: 'গ্রেড এন্ট্রি',   color: '#3b82f6' },
  { path: '/exam-routine',        icon: 'fa-calendar-alt',   label: 'পরীক্ষার রুটিন',  color: '#10b981' },
  { path: '/admit-card',          icon: 'fa-address-card',   label: 'অ্যাডমিট কার্ড',  color: '#f59e0b' },
  { path: '/marksheet',           icon: 'fa-scroll',         label: 'মার্কশিট',        color: '#8b5cf6' },
];

export default function TeacherGradeEntry() {
  const { data: exams = [], isLoading: examsLoading } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: students = [] } = useStudents();
  const { data: classes = [] } = useClasses();
  const saveMarksMut = useSaveMarks();
  const { canWrite } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [filterClassId, setFilterClassId] = useState<number | "">("");
  const [searchText, setSearchText] = useState("");
  const [bulkMarks, setBulkMarks] = useState<Record<string, Record<string, number>>>({});
  const [showSummary, setShowSummary] = useState(false);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const { data: examMarks = [] } = useMarkEntries(selectedExamId);

  const examSubs = useMemo(
    () => allSubjects.filter((s) => s.examId === selectedExamId),
    [allSubjects, selectedExamId],
  );

  const totalFullMarks = useMemo(() => examSubs.reduce((sum, s) => sum + s.fullMarks, 0), [examSubs]);

  const filteredExams = useMemo(
    () => (filterClassId ? exams.filter((e) => e.classId === filterClassId) : exams),
    [exams, filterClassId],
  );

  const examStudents = useMemo(
    () =>
      selectedExam
        ? students
            .filter((s) => s.class_id === selectedExam.classId && s.status === "active")
            .filter((s) => !searchText || s.name.includes(searchText) || (s.roll || "").includes(searchText))
            .sort((a, b) => (a.roll || "").localeCompare(b.roll || "", "bn"))
        : [],
    [selectedExam, students, searchText],
  );

  const initBulkMarks = useCallback((_examId: string, marks: typeof examMarks) => {
    const map: Record<string, Record<string, number>> = {};
    marks.forEach((m) => {
      if (!map[m.studentId]) map[m.studentId] = {};
      map[m.studentId][m.subjectName] = Number(m.marks);
    });
    setBulkMarks(map);
  }, []);

  useMemo(() => {
    if (examMarks.length > 0 && selectedExamId) initBulkMarks(selectedExamId, examMarks);
  }, [examMarks, selectedExamId, initBulkMarks]);

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setBulkMarks({});
    setSearchText("");
    setShowSummary(false);
  };

  const updateMark = (studentId: string, subjectName: string, value: number) => {
    setBulkMarks((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [subjectName]: value } }));
  };

  const getStudentTotal = (studentId: string): number => {
    const marks = bulkMarks[studentId] || {};
    return examSubs.reduce((sum, sub) => sum + (marks[sub.name] || 0), 0);
  };

  const getStudentGradeInfo = (studentId: string) => {
    const marks = bulkMarks[studentId] || {};
    const total = getStudentTotal(studentId);
    const percent = totalFullMarks > 0 ? (total / totalFullMarks) * 100 : 0;
    const allPassed = examSubs.every((sub) => (marks[sub.name] || 0) >= sub.passMarks);
    const { grade, gpa } = getGrade(percent);
    return { total, percent, grade: allPassed ? grade : "F", gpa: allPassed ? gpa : "০.০০", passed: allPassed };
  };

  const completedCount = useMemo(
    () => examStudents.filter((s) => {
      const marks = bulkMarks[s.student_id];
      return marks && examSubs.some((sub) => marks[sub.name] !== undefined && marks[sub.name] > 0);
    }).length,
    [examStudents, bulkMarks, examSubs],
  );

  const summaryStats = useMemo(() => {
    if (!showSummary || examStudents.length === 0) return null;
    let passCount = 0, failCount = 0, totalPercent = 0, entered = 0;
    const gradeDist: Record<string, number> = {};
    examStudents.forEach((s) => {
      const info = getStudentGradeInfo(s.student_id);
      if (info.total > 0) {
        entered++; totalPercent += info.percent;
        if (info.passed) passCount++; else failCount++;
        gradeDist[info.grade] = (gradeDist[info.grade] || 0) + 1;
      }
    });
    return { passCount, failCount, avgPercent: entered > 0 ? totalPercent / entered : 0, entered, gradeDist };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSummary, examStudents, bulkMarks, examSubs]);

  const handleSaveAll = async () => {
    if (!selectedExamId) return;
    const entries: { examId: string; studentId: string; subjectName: string; marks: number }[] = [];
    examStudents.forEach((student) => {
      const marks = bulkMarks[student.student_id] || {};
      examSubs.forEach((sub) => {
        if (marks[sub.name] !== undefined)
          entries.push({ examId: selectedExamId, studentId: student.student_id, subjectName: sub.name, marks: marks[sub.name] || 0 });
      });
    });
    if (entries.length === 0) return toast.error("কোনো নম্বর এন্ট্রি করা হয়নি");
    await saveMarksMut.mutateAsync(entries);
    toast.success("সকল নম্বর সফলভাবে সংরক্ষিত হয়েছে");
  };

  if (examsLoading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="content-box" style={{ height: 60, marginBottom: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)" }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>
          <Icon name="fa-pen-fancy" style={{ marginLeft: 8 }} /> শিক্ষক নম্বর এন্ট্রি
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>
          পরীক্ষা নির্বাচন করুন, বিষয়ভিত্তিক নম্বর প্রদান করুন এবং গ্রেড দেখুন
        </p>
      </div>

      {/* পরীক্ষা মডিউল দ্রুত নেভিগেশন */}
      <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(59,130,246,0.6)', marginBottom: 10, letterSpacing: 1 }}>
          ⚡ পরীক্ষা মডিউল — দ্রুত যান
        </div>
        <div className="exam-nav-bar" style={{ marginBottom: 0 }}>
          {EXAM_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button key={link.path}
                className={'exam-nav-item' + (isActive ? ' exam-nav-item--active' : '')}
                onClick={() => navigate(link.path)}
                style={isActive ? { borderColor: link.color, color: link.color, background: link.color + '14' } : {}}>
                <i className={'fas ' + link.icon} style={{ fontSize: 18, color: isActive ? link.color : 'rgba(255,255,255,0.45)' }} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="content-box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <select className="glass-select" style={{ flex: '1 1 140px', minWidth: 130, maxWidth: 180 }}
          value={filterClassId}
          onChange={(e) => { setFilterClassId(e.target.value ? Number(e.target.value) : ""); setSelectedExamId(""); setBulkMarks({}); }}>
          <option value="">সকল শ্রেণি</option>
          {classes.map((c) => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
        </select>

        <select className="glass-select" style={{ flex: '2 1 200px', minWidth: 180 }}
          value={selectedExamId} onChange={(e) => handleExamChange(e.target.value)}>
          <option value="">পরীক্ষা নির্বাচন করুন</option>
          {filteredExams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} ({e.className}) {e.date ? `— ${e.date}` : ""}
            </option>
          ))}
        </select>

        {selectedExam && (
          <input className="glass-input" style={{ flex: '1 1 160px', minWidth: 140 }}
            placeholder="🔍 ছাত্র খুঁজুন"
            value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        )}
      </div>

      {/* Exam info card */}
      {selectedExam && (
        <div className="content-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>{selectedExam.name}</span>
              <span className="glass-badge" style={{ fontSize: 11 }}>{selectedExam.className}</span>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "rgba(255,255,255,0.5)", flexWrap: "wrap" }}>
              <span><Icon name="fa-book" size={11} /> {toBengaliNumber(examSubs.length)} বিষয়</span>
              <span><Icon name="fa-users" size={11} /> {toBengaliNumber(examStudents.length)} ছাত্র</span>
              <span><Icon name="fa-check-circle" size={11} /> {toBengaliNumber(completedCount)}/{toBengaliNumber(examStudents.length)} সম্পন্ন</span>
              <span><Icon name="fa-calculator" size={11} /> পূর্ণমান: {toBengaliNumber(totalFullMarks)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <button className="btn-outline-gold" style={{ flex: 1, minWidth: 120, justifyContent: "center" }}
              onClick={() => setShowSummary(!showSummary)}>
              <Icon name="fa-chart-bar" /> {showSummary ? "সারাংশ লুকান" : "সারাংশ দেখুন"}
            </button>
            <button className="btn-gold" style={{ flex: 1, minWidth: 120, justifyContent: "center" }}
              onClick={handleSaveAll} disabled={!canWrite || saveMarksMut.isPending}>
              <Icon name="fa-save" /> {saveMarksMut.isPending ? "সংরক্ষণ হচ্ছে..." : "সব সংরক্ষণ"}
            </button>
          </div>
        </div>
      )}

      {/* Summary panel */}
      {showSummary && summaryStats && <SummaryPanel stats={summaryStats} />}

      {/* Subject reference pills */}
      {selectedExam && examSubs.length > 0 && (
        <div className="content-box" style={{ padding: "10px 16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>বিষয় ও পূর্ণমান:</span>
            {examSubs.map((sub) => (
              <span key={sub.name} style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 6, padding: "3px 10px", color: "#3b82f6" }}>
                {sub.name} ({toBengaliNumber(sub.fullMarks)}) — পাশ: {toBengaliNumber(sub.passMarks)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grade entry table — sticky columns on mobile */}
      {selectedExam && examStudents.length > 0 && (
        <div className="content-box" style={{ padding: 0 }}>
          <div className="marks-table-outer">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: 36, minWidth: 36 }}>#</th>
                  <th style={{ minWidth: 130 }}>ছাত্রের নাম</th>
                  <th style={{ textAlign: "center", width: 60, minWidth: 50 }}>রোল</th>
                  {examSubs.map((sub) => (
                    <th key={sub.name} style={{ textAlign: "center", minWidth: 80 }}>
                      {sub.name}
                      <br />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                        ({toBengaliNumber(sub.fullMarks)})
                      </span>
                    </th>
                  ))}
                  <th style={{ textAlign: "center", width: 65, minWidth: 55 }}>মোট</th>
                  <th style={{ textAlign: "center", width: 50, minWidth: 44 }}>%</th>
                  <th style={{ textAlign: "center", width: 52, minWidth: 44 }}>গ্রেড</th>
                  <th style={{ textAlign: "center", width: 55, minWidth: 48 }}>ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {examStudents.map((student, idx) => {
                  const info = getStudentGradeInfo(student.student_id);
                  return (
                    <tr key={student.id}>
                      <td style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                        {toBengaliNumber(idx + 1)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td style={{ textAlign: "center", fontSize: 12 }}>{toBengaliNumber(student.roll)}</td>
                      {examSubs.map((sub) => {
                        const val = bulkMarks[student.student_id]?.[sub.name];
                        const isFail = val !== undefined && val < sub.passMarks;
                        const isPass = val !== undefined && val >= sub.passMarks;
                        return (
                          <td key={sub.name} style={{ padding: 4, textAlign: "center" }}>
                            <input type="number" className="glass-input"
                              style={{ width: 64, textAlign: "center", padding: "4px 4px", fontSize: 13,
                                border: isFail ? "1px solid rgba(220,53,69,0.5)" : isPass ? "1px solid rgba(40,167,69,0.5)" : undefined,
                                color: isFail ? "#dc3545" : isPass ? "#28a745" : undefined,
                              }}
                              min={0} max={sub.fullMarks}
                              value={val ?? ""}
                              onChange={(e) => updateMark(student.student_id, sub.name, Number(e.target.value))}
                              placeholder="০" disabled={!canWrite} readOnly={!canWrite} />
                          </td>
                        );
                      })}
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#3b82f6" }}>{toBengaliNumber(info.total)}</td>
                      <td style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{toBengaliNumber(Math.round(info.percent))}%</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: info.grade === "F" ? "#dc3545" : info.grade === "A+" ? "#d4af37" : "#28a745" }}>
                        {info.grade}
                      </td>
                      <td style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: info.passed ? "#28a745" : "#dc3545" }}>
                        {info.total > 0 ? (info.passed ? "পাশ" : "ফেল") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedExam && examStudents.length === 0 && (
        <div className="content-box" style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
          <Icon name="fa-user-graduate" size={32} style={{ display: "block", marginBottom: 12, opacity: 0.3 }} />
          {searchText ? "কোনো ছাত্র পাওয়া যায়নি" : "এই শ্রেণিতে কোনো সক্রিয় ছাত্র নেই"}
        </div>
      )}

      {!selectedExam && exams.length === 0 && (
        <div className="content-box" style={{ textAlign: "center", padding: 50 }}>
          <Icon name="fa-graduation-cap" size={32} style={{ color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }} />
          <p style={{ color: "rgba(255,255,255,0.4)" }}>প্রথমে "পরীক্ষা ব্যবস্থাপনা" থেকে একটি পরীক্ষা তৈরি করুন</p>
        </div>
      )}

      {!selectedExam && exams.length > 0 && (
        <div className="content-box" style={{ textAlign: "center", padding: 40 }}>
          <Icon name="fa-hand-pointer" size={28} style={{ color: "rgba(212,175,55,0.3)", display: "block", marginBottom: 12 }} />
          <p style={{ color: "rgba(255,255,255,0.4)" }}>উপরে থেকে একটি পরীক্ষা নির্বাচন করুন</p>
        </div>
      )}
    </div>
  );
}

function SummaryPanel({ stats }: { stats: { passCount: number; failCount: number; avgPercent: number; entered: number; gradeDist: Record<string, number> } }) {
  const gradeColors: Record<string, string> = { "A+": "#d4af37", A: "#28a745", "A-": "#20c997", B: "#17a2b8", C: "#ffc107", D: "#fd7e14", F: "#dc3545" };
  return (
    <div className="content-box">
      <h4 style={{ fontSize: 14, fontWeight: 700, color: "#3b82f6", marginBottom: 12 }}>
        <Icon name="fa-chart-pie" size={14} /> ফলাফল সারাংশ
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12, marginBottom: 16 }}>
        <StatCard label="মোট এন্ট্রি" value={toBengaliNumber(stats.entered)} color="#3b82f6" />
        <StatCard label="পাশ" value={toBengaliNumber(stats.passCount)} color="#28a745" />
        <StatCard label="ফেল" value={toBengaliNumber(stats.failCount)} color="#dc3545" />
        <StatCard label="গড় শতকরা" value={`${toBengaliNumber(Math.round(stats.avgPercent))}%`} color="#17a2b8" />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {Object.entries(stats.gradeDist).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => (
          <span key={grade} style={{ background: `${gradeColors[grade] || "#888"}20`, border: `1px solid ${gradeColors[grade] || "#888"}40`, borderRadius: 6, padding: "4px 12px", fontSize: 13, color: gradeColors[grade] || "#888", fontWeight: 600 }}>
            {grade}: {toBengaliNumber(count)} জন
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{label}</div>
    </div>
  );
}
