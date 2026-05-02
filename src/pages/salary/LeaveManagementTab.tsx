import { useState, useMemo } from "react";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import { toBengaliNumber } from "@/lib/constants";
import type { StaffRow } from "@/hooks/useStaff";
import { useLeaveRequests, useAddLeaveRequest, useUpdateLeaveRequestStatus, useDeleteLeaveRequest } from "@/hooks/useLeaveRequests";

const LEAVE_TYPES = ["নৈমিত্তিক ছুটি", "অসুস্থতার ছুটি", "ব্যক্তিগত ছুটি", "বিশেষ ছুটি"];
const STATUS_MAP: Record<string, { label: string; style: React.CSSProperties }> = {
  pending: { label: "অপেক্ষমান", style: { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" } },
  approved: { label: "অনুমোদিত", style: { background: "rgba(40,167,69,0.15)", color: "#28a745" } },
  rejected: { label: "প্রত্যাখ্যাত", style: { background: "rgba(220,53,69,0.15)", color: "#dc3545" } },
};

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
}

const lbl: React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" };
const badge: React.CSSProperties = { display: "inline-block", padding: "4px 12px", borderRadius: 50, fontSize: 12, fontWeight: 600 };

interface LeaveManagementTabProps { staffList: StaffRow[] }

export default function LeaveManagementTab({ staffList }: LeaveManagementTabProps) {
  const { data: leaveRequests = [], isLoading } = useLeaveRequests();
  const addLeave = useAddLeaveRequest();
  const updateStatus = useUpdateLeaveRequestStatus();
  const deleteLeave = useDeleteLeaveRequest();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ staffId: "", leaveType: LEAVE_TYPES[0], startDate: "", endDate: "", days: 0, reason: "" });
  const activeStaff = useMemo(() => staffList.filter((s) => s.status === "active"), [staffList]);

  const stats = useMemo(() => {
    const p = leaveRequests.filter((r) => r.status === "pending").length;
    const a = leaveRequests.filter((r) => r.status === "approved").length;
    const rj = leaveRequests.filter((r) => r.status === "rejected").length;
    return { total: leaveRequests.length, pending: p, approved: a, rejected: rj };
  }, [leaveRequests]);

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const u = { ...formData, [field]: value };
    if (u.startDate && u.endDate) u.days = calcDays(u.startDate, u.endDate);
    setFormData(u);
  };

  const resetForm = () => { setFormData({ staffId: "", leaveType: LEAVE_TYPES[0], startDate: "", endDate: "", days: 0, reason: "" }); setShowForm(false); };

  const handleSubmit = async () => {
    if (!formData.staffId || !formData.startDate || !formData.endDate) { toast.error("সকল তথ্য পূরণ করুন"); return; }
    if (formData.days <= 0) { toast.error("ছুটির দিনসংখ্যা সঠিক নয়"); return; }
    await addLeave.mutateAsync({ staffId: formData.staffId, leaveType: formData.leaveType, startDate: formData.startDate, endDate: formData.endDate, days: formData.days, reason: formData.reason });
    toast.success("ছুটির আবেদন সংরক্ষণ হয়েছে"); resetForm();
  };

  const handleApprove = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: "approved" }); toast.success("ছুটি অনুমোদিত হয়েছে");
  };
  const handleReject = async (id: string) => {
    const note = window.prompt("প্রত্যাখ্যানের কারণ লিখুন:");
    if (note === null) return;
    await updateStatus.mutateAsync({ id, status: "rejected", rejectionNote: note }); toast.success("ছুটি প্রত্যাখ্যাত হয়েছে");
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("এই ছুটির আবেদন মুছে ফেলতে চান?")) return;
    await deleteLeave.mutateAsync(id); toast.success("ছুটির আবেদন মুছে ফেলা হয়েছে");
  };

  const getStaffName = (staffId: string) => staffList.find((s) => s.id === staffId)?.name || "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}><Icon name="fa-plus" /> নতুন ছুটির আবেদন</button>
      </div>

      {showForm && (
        <div className="content-box" style={{ animation: "fadeInUp 0.3s ease" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>নতুন ছুটির আবেদন</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={lbl}>স্টাফ নির্বাচন</label>
              <select className="glass-select" value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}>
                <option value="">-- নির্বাচন করুন --</option>
                {activeStaff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>ছুটির ধরন</label>
              <select className="glass-select" value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}>
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>শুরু তারিখ</label>
              <input type="date" className="glass-input" value={formData.startDate} onChange={(e) => handleDateChange("startDate", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>শেষ তারিখ</label>
              <input type="date" className="glass-input" value={formData.endDate} onChange={(e) => handleDateChange("endDate", e.target.value)} />
            </div>
            <div>
              <label style={lbl}>দিন সংখ্যা</label>
              <input type="number" className="glass-input" value={formData.days || ""} readOnly style={{ opacity: 0.7 }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>কারণ</label>
            <textarea className="glass-input" rows={3} placeholder="ছুটির কারণ লিখুন..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} style={{ resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-gold" onClick={handleSubmit} disabled={addLeave.isPending}><Icon name="fa-save" /> আবেদন জমা দিন</button>
            <button className="btn-outline-gold" onClick={resetForm}>বাতিল</button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
        {([
          { label: "মোট আবেদন", value: stats.total, color: "#d4af37" },
          { label: "অপেক্ষমান", value: stats.pending, color: "#f59e0b" },
          { label: "অনুমোদিত", value: stats.approved, color: "#28a745" },
          { label: "প্রত্যাখ্যাত", value: stats.rejected, color: "#dc3545" },
        ] as const).map((s) => (
          <div key={s.label} className="content-box" style={{ padding: 14, marginBottom: 0, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{toBengaliNumber(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Leave Requests Table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>স্টাফ নাম</th><th>ছুটির ধরন</th><th>শুরু তারিখ</th><th>শেষ তারিখ</th><th>দিন</th><th>অবস্থা</th><th style={{ textAlign: "center" }}>একশন</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "rgba(255,255,255,0.4)" }}>লোড হচ্ছে...</td></tr>
              ) : leaveRequests.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "rgba(255,255,255,0.4)" }}>কোনো ছুটির আবেদন নেই</td></tr>
              ) : leaveRequests.map((req) => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 600 }}>{getStaffName(req.staffId)}</td>
                  <td>{req.leaveType}</td>
                  <td>{req.startDate}</td>
                  <td>{req.endDate}</td>
                  <td>{toBengaliNumber(req.days)}</td>
                  <td>
                    <span style={{ ...badge, ...(STATUS_MAP[req.status]?.style || {}) }}>
                      {STATUS_MAP[req.status]?.label || req.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {req.status === "pending" && (
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        <button className="action-btn" title="অনুমোদন" onClick={() => handleApprove(req.id)} style={{ color: "#28a745", borderColor: "rgba(40,167,69,0.3)" }}>
                          <Icon name="fa-check" size={14} />
                        </button>
                        <button className="action-btn" title="প্রত্যাখ্যান" onClick={() => handleReject(req.id)} style={{ color: "#dc3545", borderColor: "rgba(220,53,69,0.3)" }}>
                          <Icon name="fa-times" size={14} />
                        </button>
                        <button className="action-btn" title="মুছুন" onClick={() => handleDelete(req.id)} style={{ color: "#dc3545" }}>
                          <Icon name="fa-trash" size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
