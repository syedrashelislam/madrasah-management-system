import { useState, useMemo, useCallback } from "react";
import { useExams, useAllExamSubjects, useMarkEntries, useSaveMarks } from "@/hooks/useExams";
import { useStudents } from "@/hooks/useStudents";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";

export default function BulkMarkEntryTab() {
  const { data: exams = [] } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: students = [] } = useStudents();
  const saveMarksMut = useSaveMarks();
  const { canWrite } = useUserRole();

  const [selectedExamId, setSelectedExamId] = useState("");
  const [bulkMarks, setBulkMarks] = useState<Record<string, Record<string, number>>>({});

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const { data: examMarks = [] } = useMarkEntries(selectedExamId);
  const examSubs = useMemo(() => allSubjects.filter((s) => s.examId === selectedExamId), [allSubjects, selectedExamId]);

  const examStudents = useMemo(
    () =>
      selectedExam
        ? students
            .filter((s) => s.class_id === selectedExam.classId && s.status === "active")
            .sort((a, b) => (a.roll || "").localeCompare(b.roll || "", "bn"))
        : [],
    [selectedExam, students],
  );

  const initBulkMarks = useCallback(
    (examId: string, marks: typeof examMarks) => {
      const map: Record<string, Record<string, number>> = {};
      marks.forEach((m) => {
        if (!map[m.studentId]) map[m.studentId] = {};
        map[m.studentId][m.subjectName] = Number(m.marks);
      });
      setBulkMarks(map);
    },
    [],
  );

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setBulkMarks({});
  };

  // Pre-fill when marks load
  useMemo(() => {
    if (examMarks.length > 0 && selectedExamId) {
      initBulkMarks(selectedExamId, examMarks);
    }
  }, [examMarks, selectedExamId, initBulkMarks]);

  const updateMark = (studentId: string, subjectName: string, value: number) => {
    setBulkMarks((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subjectName]: value },
    }));
  };

  const getStudentTotal = (studentId: string): number => {
    const marks = bulkMarks[studentId] || {};
    return examSubs.reduce((sum, sub) => sum + (marks[sub.name] || 0), 0);
  };

  const completedCount = useMemo(() => {
    return examStudents.filter((s) => {
      const marks = bulkMarks[s.student_id];
      return marks && examSubs.some((sub) => marks[sub.name] !== undefined && marks[sub.name] > 0);
    }).length;
  }, [examStudents, bulkMarks, examSubs]);

  const handleSaveAll = async () => {
    if (!selectedExamId) return;
    const entries: { examId: string; studentId: string; subjectName: string; marks: number }[] = [];
    examStudents.forEach((student) => {
      const marks = bulkMarks[student.student_id] || {};
      examSubs.forEach((sub) => {
        if (marks[sub.name] !== undefined) {
          entries.push({ examId: selectedExamId, studentId: student.student_id, subjectName: sub.name, marks: marks[sub.name] || 0 });
        }
      });
    });
    if (entries.length === 0) return toast.error("কোনো নম্বর এন্ট্রি করা হয়নি");
    await saveMarksMut.mutateAsync(entries);
    toast.success("সকল নম্বর সংরক্ষিত হয়েছে");
  };

  if (exams.length === 0) {
    return (
      <div className="content-box" style={{ textAlign: "center", padding: 50 }}>
        <Icon name="fa-graduation-cap" size={32} style={{ color: "rgba(255,255,255,0.2)", display: "block", marginBottom: 12 }} />
        <p style={{ color: "rgba(255,255,255,0.4)" }}>প্রথমে একটি পরীক্ষা তৈরি করুন</p>
      </div>
    );
  }

  return (
    <>
      <div className="content-box" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <select className="glass-select" style={{ maxWidth: 300 }} value={selectedExamId} onChange={(e) => handleExamChange(e.target.value)}>
          <option value="">পরীক্ষা নির্বাচন করুন</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name} ({e.className})</option>
          ))}
        </select>
        {selectedExam && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>
              সম্পন্ন: {toBengaliNumber(completedCount)}/{toBengaliNumber(examStudents.length)}
            </span>
            <button className="btn-gold" onClick={handleSaveAll} disabled={!canWrite || saveMarksMut.isPending}>
              <Icon name="fa-save" /> {saveMarksMut.isPending ? "সংরক্ষণ হচ্ছে..." : "সব সংরক্ষণ"}
            </button>
          </div>
        )}
      </div>

      {selectedExam && examStudents.length > 0 && (
        <div className="content-box" style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: 40 }}>#</th>
                  <th>ছাত্রের নাম</th>
                  <th style={{ textAlign: "center", width: 60 }}>রোল</th>
                  {examSubs.map((sub) => (
                    <th key={sub.name} style={{ textAlign: "center", minWidth: 90 }}>
                      {sub.name}
                      <br />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                        ({toBengaliNumber(sub.fullMarks)})
                      </span>
                    </th>
                  ))}
                  <th style={{ textAlign: "center", width: 80 }}>মোট</th>
                </tr>
              </thead>
              <tbody>
                {examStudents.map((student, idx) => {
                  const total = getStudentTotal(student.student_id);
                  return (
                    <tr key={student.id}>
                      <td style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                        {toBengaliNumber(idx + 1)}
                      </td>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{student.name}</td>
                      <td style={{ textAlign: "center", fontSize: 12 }}>{toBengaliNumber(student.roll)}</td>
                      {examSubs.map((sub) => {
                        const val = bulkMarks[student.student_id]?.[sub.name];
                        const isFail = val !== undefined && val < sub.passMarks;
                        const isPass = val !== undefined && val >= sub.passMarks;
                        return (
                          <td key={sub.name} style={{ padding: 4, textAlign: "center" }}>
                            <input
                              type="number"
                              className="glass-input"
                              style={{
                                width: 70,
                                textAlign: "center",
                                padding: "4px 6px",
                                fontSize: 13,
                                border: isFail ? "1px solid rgba(220,53,69,0.5)" : isPass ? "1px solid rgba(40,167,69,0.5)" : undefined,
                                color: isFail ? "#dc3545" : isPass ? "#28a745" : undefined,
                              }}
                              min={0}
                              max={sub.fullMarks}
                              value={val ?? ""}
                              onChange={(e) => updateMark(student.student_id, sub.name, Number(e.target.value))}
                              placeholder="০"
                              disabled={!canWrite}
                              readOnly={!canWrite}
                            />
                          </td>
                        );
                      })}
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#d4af37" }}>
                        {toBengaliNumber(total)}
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
        <div className="content-box" style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.4)" }}>
          এই শ্রেণিতে কোনো সক্রিয় ছাত্র নেই
        </div>
      )}
    </>
  );
}
