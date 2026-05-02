import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useAttendance, useUpsertAttendance } from "@/hooks/useAttendance";
import { toBengaliNumber } from "@/lib/constants";
import { showToast } from "@/lib/showToast";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { sendBulkSms, isSmsApiConfigured } from "@/lib/bulkSmsApi";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { useUserRole } from "@/hooks/useUserRole";
import AttendanceCalendar from "./attendance/AttendanceCalendar";
import PageQuickNav from "@/components/PageQuickNav";

type ViewMode = "list" | "calendar";
type AttendanceStatus = "present" | "absent" | "late" | "leave";

const statusConfig: Record<AttendanceStatus, { label: string; icon: string; color: string; bg: string; border: string }> = {
  present: { label: "উপস্থিত", icon: "fa-check-circle", color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.4)" },
  absent:  { label: "অনুপস্থিত", icon: "fa-times-circle", color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.4)" },
  late:    { label: "বিলম্বে", icon: "fa-clock", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)" },
  leave:   { label: "ছুটি", icon: "fa-calendar-minus", color: "#818cf8", bg: "rgba(129,140,248,0.12)", border: "rgba(129,140,248,0.4)" },
};

export default function StudentAttendance() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: attendance = [] } = useAttendance();
  const upsertAttendance = useUpsertAttendance();
  const institution = useInstitutionInfo();
  const { canWrite } = useUserRole();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [sendingAbsentSms, setSendingAbsentSms] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const effectiveClassId = selectedClassId ?? (classes.length > 0 ? classes[0].class_id : null);

  const filteredStudents = useMemo(
    () => students.filter(s => s.status === "active" && s.class_id === effectiveClassId).sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0)),
    [students, effectiveClassId]
  );

  const dailySavedMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    attendance.filter(row => row.date === date).forEach(row => {
      const match = filteredStudents.find(s => s.student_id === row.studentId || s.id === row.studentId);
      if (match) map[match.student_id] = row.status as AttendanceStatus;
    });
    return map;
  }, [attendance, date, filteredStudents]);

  const mergedRecords = { ...dailySavedMap, ...records };
  const presentCount = filteredStudents.filter(s => mergedRecords[s.student_id] === "present").length;
  const absentCount = filteredStudents.filter(s => mergedRecords[s.student_id] === "absent").length;
  const lateCount = filteredStudents.filter(s => mergedRecords[s.student_id] === "late").length;
  const leaveCount = filteredStudents.filter(s => mergedRecords[s.student_id] === "leave").length;
  const unmarkedCount = filteredStudents.filter(s => !mergedRecords[s.student_id]).length;

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setRecords(prev => ({ ...prev, [studentId]: status }));

  const setAllStatus = (status: AttendanceStatus) => {
    const bulk: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => { bulk[s.student_id] = status; });
    setRecords(bulk);
  };

  const loadSavedRecords = () => { setRecords(dailySavedMap); showToast.success("সংরক্ষিত হাজিরা লোড হয়েছে"); };

  const handleSave = () => {
    const payload = filteredStudents.filter(s => mergedRecords[s.student_id]).map(s => ({ studentId: s.student_id, date, status: mergedRecords[s.student_id] }));
    if (!payload.length) { showToast.warning("কোনো ছাত্রের হাজিরা নির্বাচন করা হয়নি"); return; }
    upsertAttendance.mutate(payload, {
      onSuccess: () => { setRecords({}); setAttendanceSaved(true); showToast.success(`${toBengaliNumber(payload.length)} জন ছাত্রের হাজিরা সংরক্ষণ হয়েছে`); }
    });
  };

  const absentStudentsForSms = useMemo(() => filteredStudents.filter(s => mergedRecords[s.student_id] === "absent"), [filteredStudents, mergedRecords]);

  const handleAbsentSms = async () => {
    const configured = await isSmsApiConfigured();
    if (!configured) { showToast.error("SMS API কনফিগার করা হয়নি"); return; }
    const formattedDate = new Date(date).toLocaleDateString("bn-BD");
    const smsRecipients = absentStudentsForSms.filter(s => (s.guardian_phone?.trim().length || 0) >= 8 || (s.contact?.trim().length || 0) >= 8).map(s => ({ phone: s.guardian_phone?.trim() || s.contact?.trim() || "", message: `আসসালামু আলাইকুম। ${institution.name} থেকে জানানো যাচ্ছে যে, ${s.name} আজ (${formattedDate}) অনুপস্থিত ছিল। ধন্যবাদ।` }));
    if (!smsRecipients.length) { showToast.error("অনুপস্থিত ছাত্রদের ফোন নম্বর পাওয়া যায়নি"); return; }
    if (!confirm(`${smsRecipients.length} জন অভিভাবককে SMS পাঠাবেন?`)) return;
    setSendingAbsentSms(true);
    try {
      const result = await sendBulkSms(smsRecipients);
      if (result.sent > 0) showToast.success(`${result.sent}/${result.total} SMS পাঠানো হয়েছে`);
      if (result.failed > 0) showToast.error(`${result.failed} SMS ব্যর্থ হয়েছে`);
    } catch (err: any) { showToast.error(`SMS ব্যর্থ: ${err?.message || "অজানা সমস্যা"}`); }
    setSendingAbsentSms(false);
  };

  const isLoading = loadingStudents || loadingClasses;

  if (isLoading) {
    return (
      <div>
        <PageQuickNav />
        <div className="page-header">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}><Icon name="fa-clipboard-check" style={{ marginLeft: 8 }} /> ছাত্র হাজিরা</h2>
        </div>
        <Skeleton className="h-64" style={{ borderRadius: 10 }} />
      </div>
    );
  }

  const todayFormatted = new Date(date).toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* ══ Quick Nav ══ */}
      <PageQuickNav />

      {/* ══ Page Header ══ */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#d4af37", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          <Icon name="fa-clipboard-check" /> ছাত্র হাজিরা
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>{todayFormatted}</p>
      </div>

      {/* ══ View Toggle ══ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
        {(["list", "calendar"] as ViewMode[]).map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)}
            style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: "pointer", transition: "all 0.2s", border: "none", background: viewMode === mode ? "#d4af37" : "transparent", color: viewMode === mode ? "#0a1f0a" : "rgba(255,255,255,0.55)" }}>
            <Icon name={mode === "list" ? "fa-list" : "fa-calendar-alt"} size={13} style={{ marginLeft: 5 }} />
            {" "}{mode === "list" ? "তালিকা ভিউ" : "ক্যালেন্ডার"}
          </button>
        ))}
      </div>

      {/* ══ Calendar View ══ */}
      {viewMode === "calendar" && (
        <div className="content-box">
          <AttendanceCalendar students={filteredStudents} attendance={attendance}
            onDayClick={dateStr => { setDate(dateStr); setRecords({}); setAttendanceSaved(false); setViewMode("list"); showToast.info(`${dateStr} তারিখের হাজিরা`, { duration: 2000 }); }} />
        </div>
      )}

      {/* ══ List View ══ */}
      {viewMode === "list" && (
        <>
          {/* Controls */}
          <div className="content-box" style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, display: "block" }}>📅 তারিখ</label>
                <input type="date" className="glass-input" value={date}
                  onChange={e => { setDate(e.target.value); setRecords({}); setAttendanceSaved(false); }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 5, display: "block" }}>🏫 শ্রেণি</label>
                <select className="glass-select" value={effectiveClassId ?? ""} onChange={e => { setSelectedClassId(Number(e.target.value)); setRecords({}); setAttendanceSaved(false); }}>
                  {classes.map(cls => <option key={cls.id} value={cls.class_id}>{cls.name}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-outline-gold" onClick={loadSavedRecords} style={{ width: "100%", justifyContent: "center", fontSize: 13 }}>
              <Icon name="fa-download" /> সেভকৃত ডাটা লোড করুন
            </button>
          </div>

          {/* Summary Stats — Horizontal scroll on mobile */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {[
              { label: "মোট", value: filteredStudents.length, color: "#d4af37", icon: "👨‍🎓" },
              { label: "উপস্থিত", value: presentCount, color: "#22c55e", icon: "✅" },
              { label: "অনুপস্থিত", value: absentCount, color: "#ef4444", icon: "❌" },
              { label: "বিলম্বে", value: lateCount, color: "#f97316", icon: "⏱️" },
              { label: "ছুটি", value: leaveCount, color: "#818cf8", icon: "🏖️" },
              { label: "চিহ্নিত নয়", value: unmarkedCount, color: "rgba(255,255,255,0.3)", icon: "⭕" },
            ].map(stat => (
              <div key={stat.label} style={{ flexShrink: 0, background: "var(--th-card-bg)", border: `1px solid ${stat.color}28`, borderRadius: 12, padding: "10px 14px", textAlign: "center", minWidth: 78 }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{stat.icon}</div>
                <p style={{ fontSize: 20, fontWeight: 800, color: stat.color, margin: 0, lineHeight: 1 }}>{toBengaliNumber(stat.value)}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {filteredStudents.length > 0 && (
            <div style={{ marginBottom: 14, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", height: 6 }}>
              <div style={{ height: "100%", width: `${((filteredStudents.length - unmarkedCount) / filteredStudents.length) * 100}%`, background: "linear-gradient(90deg, #d4af37, #22c55e)", borderRadius: 8, transition: "width 0.4s ease" }} />
            </div>
          )}

          {/* Quick-set Buttons */}
          {canWrite && (
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([status, cfg]) => (
                <button key={status} onClick={() => setAllStatus(status)}
                  style={{ flex: "1 1 auto", padding: "9px 8px", borderRadius: 10, border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, minWidth: 90, transition: "all 0.15s" }}>
                  <Icon name={cfg.icon} size={13} /> সকল {cfg.label}
                </button>
              ))}
            </div>
          )}

          {/* ─── Student Attendance Cards (Mobile-first) ─── */}
          {filteredStudents.length === 0 ? (
            <div className="content-box" style={{ textAlign: "center", padding: "50px 24px" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
              <p style={{ color: "rgba(255,255,255,0.45)" }}>{effectiveClassId ? "এই শ্রেণিতে কোনো সক্রিয় ছাত্র নেই" : "একটি শ্রেণি নির্বাচন করুন"}</p>
            </div>
          ) : (
            <div>
              {filteredStudents.map((student, idx) => {
                const selected = mergedRecords[student.student_id] as AttendanceStatus | undefined;
                const cfg = selected ? statusConfig[selected] : null;
                return (
                  <div key={student.student_id}
                    style={{ background: "var(--th-card-bg)", border: `1px solid ${cfg ? cfg.border : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "12px 14px", marginBottom: 8, transition: "border-color 0.2s", position: "relative" }}>
                    {/* Student Info Row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: cfg ? cfg.bg : "rgba(255,255,255,0.08)", border: `2px solid ${cfg ? cfg.border : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: cfg ? cfg.color : "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                        {cfg ? <Icon name={cfg.icon} size={16} /> : toBengaliNumber(idx + 1)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <button onClick={() => navigate(`/students/${student.student_id}`)}
                          style={{ fontWeight: 700, fontSize: 15, color: "#fff", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", transition: "color 0.2s", display: "block", lineHeight: 1.3 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#d4af37"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}>
                          {student.name}
                        </button>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                          রোল: {toBengaliNumber(student.roll || "—")} · {student.student_id}
                        </p>
                      </div>
                      {selected && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: cfg!.bg, color: cfg!.color, border: `1px solid ${cfg!.border}`, flexShrink: 0 }}>
                          {cfg!.label}
                        </span>
                      )}
                    </div>
                    {/* Attendance Buttons */}
                    {canWrite && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                        {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([status, conf]) => {
                          const isSelected = selected === status;
                          return (
                            <button key={status} onClick={() => setStatus(student.student_id, status)}
                              style={{ padding: "10px 4px", borderRadius: 10, border: `1.5px solid ${isSelected ? conf.border : "rgba(255,255,255,0.1)"}`, background: isSelected ? conf.bg : "rgba(255,255,255,0.04)", color: isSelected ? conf.color : "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: isSelected ? 700 : 500, cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, WebkitTapHighlightColor: "transparent" }}
                              onTouchStart={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = conf.bg + "60"; }}
                              onTouchEnd={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}>
                              <Icon name={conf.icon} size={15} />
                              <span style={{ fontSize: 10, lineHeight: 1.2 }}>{conf.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Save + SMS ─── */}
          <div style={{ position: "fixed", bottom: 72, left: 0, right: 0, padding: "12px 16px", background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.08)", zIndex: 100, display: "flex", gap: 8 }}>
            {(attendanceSaved || Object.keys(dailySavedMap).length > 0) && absentStudentsForSms.length > 0 && (
              <button className="btn-outline-gold" onClick={handleAbsentSms} disabled={!canWrite || sendingAbsentSms}
                style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>
                {sendingAbsentSms ? <><Icon name="fa-spinner fa-spin" /> পাঠানো হচ্ছে...</> : <><Icon name="fa-sms" /> অনুপস্থিত SMS ({toBengaliNumber(absentStudentsForSms.length)})</>}
              </button>
            )}
            {canWrite && (
              <button className="btn-gold" onClick={handleSave} disabled={upsertAttendance.isPending}
                style={{ flex: 2, justifyContent: "center", fontSize: 14, padding: "12px 0" }}>
                <Icon name="fa-save" /> {upsertAttendance.isPending ? "সংরক্ষণ হচ্ছে..." : "হাজিরা সংরক্ষণ করুন"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
