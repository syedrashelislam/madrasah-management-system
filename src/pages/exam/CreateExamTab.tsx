import { useState } from "react";
import { useExams, useCreateExam, useDeleteExam, useAllExamSubjects } from "@/hooks/useExams";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";

interface SubjectForm {
  name: string;
  fullMarks: number;
  passMarks: number;
}

export default function CreateExamTab() {
  const { data: exams = [] } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: classes = [] } = useClasses();
  const { data: globalSubjects = [] } = useSubjects();
  const createExamMut = useCreateExam();
  const deleteExamMut = useDeleteExam();
  const { canWrite, canDelete } = useUserRole();

  const defaultSubjects = (): SubjectForm[] =>
    globalSubjects.length > 0
      ? globalSubjects.map((s) => ({ name: s.name, fullMarks: 100, passMarks: 33 }))
      : [{ name: "", fullMarks: 100, passMarks: 33 }];

  const [examName, setExamName] = useState("");
  const [examClassId, setExamClassId] = useState(1);
  const [examDate, setExamDate] = useState("");
  const [subjects, setSubjects] = useState<SubjectForm[]>(defaultSubjects);

  const getExamSubjects = (examId: string) => allSubjects.filter((s) => s.examId === examId);

  const addSubject = () => setSubjects((prev) => [...prev, { name: "", fullMarks: 100, passMarks: 33 }]);
  const removeSubject = (i: number) => setSubjects((prev) => prev.filter((_, idx) => idx !== i));
  const updateSubject = (i: number, field: keyof SubjectForm, value: string | number) =>
    setSubjects((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const loadGlobalSubjects = () => {
    if (globalSubjects.length === 0) return toast.error("কোনো বিষয় পাওয়া যায়নি");
    setSubjects(globalSubjects.map((s) => ({ name: s.name, fullMarks: 100, passMarks: 33 })));
    toast.success("বিষয় লোড হয়েছে");
  };

  const handleCreateExam = async () => {
    if (!examName.trim()) return toast.error("পরীক্ষার নাম দিন");
    if (!examDate) return toast.error("তারিখ নির্বাচন করুন");
    const validSubjects = subjects.filter((s) => s.name.trim());
    if (validSubjects.length === 0) return toast.error("কমপক্ষে একটি বিষয় যোগ করুন");
    const cls = classes.find((c) => c.class_id === examClassId);
    await createExamMut.mutateAsync({
      name: examName,
      classId: examClassId,
      className: cls?.name || "",
      date: examDate,
      subjects: validSubjects.map((s) => ({ name: s.name, fullMarks: s.fullMarks, passMarks: s.passMarks })),
    });
    setExamName("");
    setExamDate("");
    setSubjects(defaultSubjects());
    toast.success("পরীক্ষা সফলভাবে তৈরি হয়েছে");
  };

  return (
    <>
      {canWrite && (<div className="content-box">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
          নতুন পরীক্ষা তৈরি করুন
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
          <input className="glass-input" placeholder="পরীক্ষার নাম" value={examName} onChange={(e) => setExamName(e.target.value)} />
          <select className="glass-select" value={examClassId} onChange={(e) => setExamClassId(Number(e.target.value))}>
            {classes.map((c) => (
              <option key={c.class_id} value={c.class_id}>{c.name}</option>
            ))}
          </select>
          <input type="date" className="glass-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>বিষয় সমূহ</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: 12 }} onClick={loadGlobalSubjects}>
                <Icon name="fa-sync" size={12} /> বিষয় লোড
              </button>
              <button className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: 12 }} onClick={addSubject}>
                <Icon name="fa-plus" size={12} /> বিষয় যোগ
              </button>
            </div>
          </div>
          {subjects.map((sub, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input className="glass-input" placeholder="বিষয়ের নাম" value={sub.name} onChange={(e) => updateSubject(i, "name", e.target.value)} />
              <input type="number" className="glass-input" placeholder="পূর্ণমান" value={sub.fullMarks} onChange={(e) => updateSubject(i, "fullMarks", Number(e.target.value))} />
              <input type="number" className="glass-input" placeholder="পাশ নম্বর" value={sub.passMarks} onChange={(e) => updateSubject(i, "passMarks", Number(e.target.value))} />
              {subjects.length > 1 && (
                <button className="action-btn" onClick={() => removeSubject(i)}>
                  <Icon name="fa-trash" style={{ color: "#dc3545" }} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={handleCreateExam}>
          <Icon name="fa-save" /> পরীক্ষা তৈরি করুন
        </button>
      </div>)}

      {exams.length > 0 && (
        <div className="content-box">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>তৈরিকৃত পরীক্ষা তালিকা</h3>
          {exams.map((exam) => (
            <div key={exam.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <p style={{ fontWeight: 600 }}>{exam.name}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {exam.className} • {exam.date} • {toBengaliNumber(getExamSubjects(exam.id).length)} বিষয়
                </p>
              </div>
              {canDelete && (<button
                className="action-btn"
                onClick={async () => {
                  await deleteExamMut.mutateAsync(exam.id);
                  toast.success("পরীক্ষা মুছে ফেলা হয়েছে");
                }}
              >
                <Icon name="fa-trash" style={{ color: "#dc3545" }} />
              </button>)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
