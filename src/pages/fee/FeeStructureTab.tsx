import { useState, useMemo } from "react";
import { useClasses } from "@/hooks/useClasses";
import { useFeeStructures, useAddFeeStructure, useUpdateFeeStructure, useDeleteFeeStructure, FeeStructureRow } from "@/hooks/useFeeStructures";
import { useStudents } from "@/hooks/useStudents";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";
import FeeTypeBadges, { getCycleBadge, getCycleLabel } from "./FeeTypeBadges";
import FeeStructureSummary from "./FeeStructureSummary";
import BatchApplyModal from "./BatchApplyModal";
import FeeGroupSection from "./FeeGroupSection";

const LABEL_STYLE: React.CSSProperties = { fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 };
const HELP_STYLE: React.CSSProperties = { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 };

export default function FeeStructureTab() {
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: feeStructures = [], isLoading: loadingFS } = useFeeStructures();
  const { data: students = [] } = useStudents();
  const addFS = useAddFeeStructure();
  const updateFS = useUpdateFeeStructure();
  const deleteFS = useDeleteFeeStructure();
  const { isSuperAdmin, canWrite } = useUserRole();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ classId: 0, monthlyFee: 0, admissionFee: 0, examFee: 0, otherFee: 0, otherFeeLabel: "" });
  const [showBatch, setShowBatch] = useState(false);
  const [batchPending, setBatchPending] = useState(false);

  const classData = useMemo(() => {
    return classes.map((cls) => {
      const fs = feeStructures.find(f => f.classId === cls.class_id);
      const activeStudents = students.filter(s => s.status === "active" && s.class_id === cls.class_id);
      const avgFee = activeStudents.length > 0
        ? activeStudents.reduce((s, st) => s + st.monthly_fee, 0) / activeStudents.length
        : 0;
      return { classId: cls.class_id, className: cls.name, studentCount: activeStudents.length, feeStructure: fs || null, avgFee: Math.round(avgFee) };
    });
  }, [classes, feeStructures, students]);

  const startEdit = (fs: FeeStructureRow) => {
    setEditingId(fs.id);
    setForm({ classId: fs.classId, monthlyFee: fs.monthlyFee, admissionFee: fs.admissionFee, examFee: fs.examFee, otherFee: fs.otherFee, otherFeeLabel: fs.otherFeeLabel });
    setShowForm(true);
  };

  const startAdd = (classId: number) => {
    setEditingId(null);
    setForm({ classId, monthlyFee: 0, admissionFee: 0, examFee: 0, otherFee: 0, otherFeeLabel: "" });
    setShowForm(true);
  };

  const handleSave = () => {
    if (form.monthlyFee <= 0) { toast.error("মাসিক ফি দিন"); return; }
    const cls = classes.find(c => c.class_id === form.classId);
    if (!cls) { toast.error("শ্রেণি নির্বাচন করুন"); return; }
    if (editingId) {
      updateFS.mutate({ id: editingId, monthlyFee: form.monthlyFee, admissionFee: form.admissionFee, examFee: form.examFee, otherFee: form.otherFee, otherFeeLabel: form.otherFeeLabel });
    } else {
      addFS.mutate({ classId: form.classId, className: cls.name, monthlyFee: form.monthlyFee, admissionFee: form.admissionFee, examFee: form.examFee, otherFee: form.otherFee, otherFeeLabel: form.otherFeeLabel });
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => { if (confirm("এই ফি কাঠামো মুছে ফেলতে চান?")) deleteFS.mutate(id); };

  const handleBatchApply = async (batchForm: { monthlyFee: number; admissionFee: number; examFee: number; otherFee: number; otherFeeLabel: string }) => {
    if (batchForm.monthlyFee <= 0) { toast.error("মাসিক ফি দিন"); return; }
    setBatchPending(true);
    try {
      for (const cls of classes) {
        const existing = feeStructures.find(f => f.classId === cls.class_id);
        if (existing) {
          await updateFS.mutateAsync({ id: existing.id, ...batchForm });
        } else {
          await addFS.mutateAsync({ classId: cls.class_id, className: cls.name, ...batchForm });
        }
      }
      toast.success(`${toBengaliNumber(classes.length)}টি শ্রেণিতে ফি কাঠামো প্রয়োগ হয়েছে`);
      setShowBatch(false);
    } catch { toast.error("ব্যাচ প্রয়োগে সমস্যা হয়েছে"); }
    setBatchPending(false);
  };

  const totalFormFee = form.monthlyFee + form.admissionFee + form.examFee + form.otherFee;

  if (loadingClasses || loadingFS) return <Skeleton className="h-64" style={{ borderRadius: 10 }} />;

  return (
    <div>
      {/* Summary Stats */}
      <FeeStructureSummary classData={classData} />

      {/* Fee Type Badges */}
      <FeeTypeBadges />

      {/* Header + Actions */}
      <div className="content-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 4 }}>
              <Icon name="fa-list-alt" /> শ্রেণি অনুযায়ী ফি কাঠামো
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>প্রতি শ্রেণির ফি নির্ধারণ করুন — ভর্তি ফি, মাসিক ফি, পরীক্ষা ফি</p>
          </div>
          {canWrite && (
            <button className="btn-outline-gold" onClick={() => setShowBatch(true)} style={{ fontSize: 12, padding: "7px 16px" }}>
              <Icon name="fa-share" size={13} /> সকল শ্রেণিতে প্রয়োগ
            </button>
          )}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && canWrite && (
        <div className="content-box" style={{ border: "1px solid rgba(212,175,55,0.3)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
            <Icon name={editingId ? "fa-edit" : "fa-plus"} /> {editingId ? "ফি কাঠামো সম্পাদনা" : "ফি কাঠামো যোগ"}
          </h4>

          {/* Class selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={LABEL_STYLE}>শ্রেণি নির্বাচন করুন</label>
            <select className="glass-select" value={form.classId} onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })} disabled={!!editingId} style={{ maxWidth: 280 }}>
              <option value={0}>-- নির্বাচন --</option>
              {classes.filter(c => editingId || !feeStructures.some(f => f.classId === c.class_id)).map(c => (
                <option key={c.class_id} value={c.class_id}>{c.name}</option>
              ))}
            </select>
            <div style={HELP_STYLE}>যে শ্রেণির জন্য ফি নির্ধারণ করতে চান</div>
          </div>

          {/* Fee fields in grouped sections */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 14 }}>
            {/* Monthly Fee */}
            <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 8, padding: 12 }}>
              <label style={{ ...LABEL_STYLE, color: "#d4af37", fontWeight: 600 }}>
                <Icon name="fa-calendar" size={12} /> মাসিক ফি (৳) <span style={{ color: "#dc3545" }}>*</span>
              </label>
              <input className="glass-input" type="number" value={form.monthlyFee || ""} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })} placeholder="0" />
              <div style={HELP_STYLE}>প্রতি মাসে ছাত্র থেকে আদায়যোগ্য ফি</div>
              {getCycleLabel("monthly")}
            </div>
            {/* Admission Fee */}
            <div style={{ background: "rgba(40,167,69,0.04)", border: "1px solid rgba(40,167,69,0.12)", borderRadius: 8, padding: 12 }}>
              <label style={{ ...LABEL_STYLE, color: "#28a745", fontWeight: 600 }}>
                <Icon name="fa-user-plus" size={12} /> ভর্তি ফি (৳)
              </label>
              <input className="glass-input" type="number" value={form.admissionFee || ""} onChange={(e) => setForm({ ...form, admissionFee: Number(e.target.value) })} placeholder="0" />
              <div style={HELP_STYLE}>ভর্তির সময় এককালীন আদায়যোগ্য</div>
              {getCycleLabel("onetime")}
            </div>
            {/* Exam Fee */}
            <div style={{ background: "rgba(91,192,222,0.04)", border: "1px solid rgba(91,192,222,0.12)", borderRadius: 8, padding: 12 }}>
              <label style={{ ...LABEL_STYLE, color: "#5bc0de", fontWeight: 600 }}>
                <Icon name="fa-clipboard-check" size={12} /> পরীক্ষা ফি (৳)
              </label>
              <input className="glass-input" type="number" value={form.examFee || ""} onChange={(e) => setForm({ ...form, examFee: Number(e.target.value) })} placeholder="0" />
              <div style={HELP_STYLE}>প্রতি পরীক্ষা/সেমিস্টারে আদায়যোগ্য</div>
              {getCycleLabel("semester")}
            </div>
            {/* Other Fee */}
            <div style={{ background: "rgba(232,168,124,0.04)", border: "1px solid rgba(232,168,124,0.12)", borderRadius: 8, padding: 12 }}>
              <label style={{ ...LABEL_STYLE, color: "#e8a87c", fontWeight: 600 }}>
                <Icon name="fa-coins" size={12} /> অন্যান্য ফি (৳)
              </label>
              <input className="glass-input" type="number" value={form.otherFee || ""} onChange={(e) => setForm({ ...form, otherFee: Number(e.target.value) })} placeholder="0" />
              <div style={HELP_STYLE}>কাস্টম ফি — নিচে লেবেল দিন</div>
              {getCycleLabel("custom")}
              {form.otherFee > 0 && (
                <div style={{ marginTop: 8 }}>
                  <input className="glass-input" value={form.otherFeeLabel} onChange={(e) => setForm({ ...form, otherFeeLabel: e.target.value })} placeholder="যেমন: লাইব্রেরি ফি" style={{ fontSize: 12 }} />
                </div>
              )}
            </div>
          </div>

          {/* Total preview */}
          {totalFormFee > 0 && (
            <div style={{
              background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 14,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                <Icon name="fa-calculator" /> প্রতি ছাত্রের সর্বমোট ফি (সকল ধরন)
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#d4af37" }}>{formatTaka(totalFormFee)}</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-gold" onClick={handleSave} disabled={addFS.isPending || updateFS.isPending}>
              <Icon name="fa-save" /> সংরক্ষণ
            </button>
            <button className="btn-outline-gold" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <Icon name="fa-times" /> বাতিল
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>শ্রেণি</th>
                <th><span>মাসিক ফি</span><br />{getCycleBadge("monthly")}</th>
                <th><span>ভর্তি ফি</span><br />{getCycleBadge("onetime")}</th>
                <th><span>পরীক্ষা ফি</span><br />{getCycleBadge("semester")}</th>
                <th><span>অন্যান্য</span><br />{getCycleBadge("custom")}</th>
                <th>ছাত্র সংখ্যা</th>
                {canWrite && <th style={{ textAlign: "center" }}>একশন</th>}
              </tr>
            </thead>
            <tbody>
              {classData.map((c) => (
                <tr key={c.classId}>
                  <td style={{ fontWeight: 600 }}>{c.className}</td>
                  <td style={{ color: "#d4af37", fontWeight: 700 }}>
                    {c.feeStructure ? formatTaka(c.feeStructure.monthlyFee) : (c.avgFee > 0 ? <span style={{ opacity: 0.5 }}>{formatTaka(c.avgFee)} <span style={{ fontSize: 10 }}>(গড়)</span></span> : "—")}
                  </td>
                  <td>{c.feeStructure && c.feeStructure.admissionFee > 0 ? formatTaka(c.feeStructure.admissionFee) : "—"}</td>
                  <td>{c.feeStructure && c.feeStructure.examFee > 0 ? formatTaka(c.feeStructure.examFee) : "—"}</td>
                  <td>
                    {c.feeStructure && c.feeStructure.otherFee > 0 ? (
                      <span>{formatTaka(c.feeStructure.otherFee)} {c.feeStructure.otherFeeLabel && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>({c.feeStructure.otherFeeLabel})</span>}</span>
                    ) : "—"}
                  </td>
                  <td style={{ color: "rgba(255,255,255,0.6)" }}>{toBengaliNumber(c.studentCount)} জন</td>
                  {canWrite && (
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        {c.feeStructure ? (
                          <>
                            <button className="action-btn" onClick={() => startEdit(c.feeStructure!)} title="সম্পাদনা"><Icon name="fa-edit" /></button>
                            {isSuperAdmin && <button className="action-btn" onClick={() => handleDelete(c.feeStructure!.id)} title="মুছুন"><Icon name="fa-trash" style={{ color: "#dc3545" }} /></button>}
                          </>
                        ) : (
                          <button className="btn-outline-gold" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => startAdd(c.classId)}>
                            <Icon name="fa-plus" /> যোগ
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {classData.length === 0 && (
                <tr><td colSpan={canWrite ? 7 : 6} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>কোনো শ্রেণি পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Group Section */}
      <FeeGroupSection canWrite={canWrite} />

      {/* Batch Apply Modal */}
      <BatchApplyModal open={showBatch} onClose={() => setShowBatch(false)} onApply={handleBatchApply} isPending={batchPending} classCount={classes.length} />
    </div>
  );
}
