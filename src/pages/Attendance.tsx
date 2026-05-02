import { useMemo, useState } from "react";
import { useStaff } from "@/hooks/useStaff";
import { useTeacherAttendance, useUpsertTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { toBengaliNumber } from "@/lib/constants";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";
import PageQuickNav from "@/components/PageQuickNav";

type AttendanceStatus = "present" | "absent";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: string; color: string; bg: string; border: string }> = {
  present: { label: "উপস্থিত",   icon: "fa-check-circle", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.4)"  },
  absent:  { label: "অনুপস্থিত", icon: "fa-times-circle", color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)"  },
};

export default function Attendance() {
  const { data: staff = [], isLoading } = useStaff();
  const { data: attendance = [] } = useTeacherAttendance();
  const upsertAttendance = useUpsertTeacherAttendance();
  const { canWrite } = useUserRole();

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({});
  const [search, setSearch] = useState("");

  const teachers = useMemo(() => staff.filter(m => m.status === "active"), [staff]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? teachers.filter(t =>
          t.name.toLowerCase().includes(q) ||
          (t.designation || "").toLowerCase().includes(q) ||
          (t.staff_id || "").toLowerCase().includes(q)
        )
      : teachers;
  }, [teachers, search]);

  const dailySavedMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    attendance.filter(row => row.date === date).forEach(row => { map[row.staffId] = row.status; });
    return map;
  }, [attendance, date]);

  const mergedRecords = { ...dailySavedMap, ...records };
  const presentCount  = Object.values(mergedRecords).filter(v => v === "present").length;
  const absentCount   = Object.values(mergedRecords).filter(v => v === "absent").length;
  const markedCount   = Object.keys(mergedRecords).length;
  const unmarkedCount = teachers.length - markedCount;

  const setStatus   = (staffId: string, status: AttendanceStatus) =>
    setRecords(prev => ({ ...prev, [staffId]: status }));

  const markAll = (status: AttendanceStatus) => {
    const bulk: Record<string, AttendanceStatus> = {};
    teachers.forEach(t => { bulk[t.id] = status; });
    setRecords(bulk);
    toast.success(`সকলকে "${STATUS_CONFIG[status].label}" করা হয়েছে`);
  };

  const loadSaved = () => { setRecords(dailySavedMap); toast.success("সংরক্ষিত হাজিরা লোড হয়েছে"); };

  const handleSave = () => {
    const payload = Object.entries(mergedRecords).map(([staffId, status]) => ({ staffId, date, status }));
    if (!payload.length) { toast.error("কোনো স্টাফ হাজিরা নির্বাচন হয়নি"); return; }
    upsertAttendance.mutate(payload, {
      onSuccess: () => {
        setRecords({});
        toast.success(`${toBengaliNumber(payload.length)} জনের হাজিরা সংরক্ষণ হয়েছে`);
      }
    });
  };

  const dateLabel  = new Date(date).toLocaleDateString("bn-BD", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const progressPct = teachers.length > 0 ? Math.round((markedCount / teachers.length) * 100) : 0;

  if (isLoading) {
    return (
      <div>
        <PageQuickNav />
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="fa-user-check" /> স্টাফ হাজিরা
          </h2>
        </div>
        <Skeleton className="h-64" style={{ borderRadius: 14 }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* ══ Quick Nav ══ */}
      <PageQuickNav />

      {/* ══ Page Header ══ */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#d4af37", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <Icon name="fa-user-check" /> স্টাফ হাজিরা
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4 }}>{dateLabel}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="att-desktop-actions">
            <button className="btn-outline-gold" style={{ fontSize: 13, padding: "9px 18px" }} onClick={loadSaved}>
              <Icon name="fa-cloud-download-alt" size={13} /> লোড
            </button>
            {canWrite && (
              <button className="btn-gold" style={{ fontSize: 13, padding: "9px 20px" }} onClick={handleSave} disabled={upsertAttendance.isPending}>
                <Icon name="fa-save" size={13} /> {upsertAttendance.isPending ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ Stats Cards ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "মোট",        value: teachers.length,  color: "#d4af37", icon: "fa-users"        },
          { label: "উপস্থিত",    value: presentCount,     color: "#22c55e", icon: "fa-check-circle" },
          { label: "অনুপস্থিত",  value: absentCount,      color: "#ef4444", icon: "fa-times-circle" },
          { label: "বাকি",       value: unmarkedCount,    color: "#94a3b8", icon: "fa-clock"        },
        ].map(st => (
          <div key={st.label} style={{
            background: "var(--th-card-bg)", border: `1px solid ${st.color}22`,
            borderRadius: 14, padding: "14px 10px", textAlign: "center",
            boxShadow: "var(--th-shadow)",
          }}>
            <Icon name={st.icon} size={18} style={{ color: st.color, marginBottom: 6, display: "block" }} />
            <p style={{ fontSize: 22, fontWeight: 800, color: st.color, margin: 0, lineHeight: 1 }}>{toBengaliNumber(st.value)}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "4px 0 0", lineHeight: 1.2 }}>{st.label}</p>
          </div>
        ))}
      </div>

      {/* ══ Progress Bar ══ */}
      <div style={{ background: "var(--th-card-bg)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>হাজিরা অগ্রগতি</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: progressPct === 100 ? "#22c55e" : "#d4af37" }}>{toBengaliNumber(progressPct)}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 8, transition: "width 0.5s ease",
            width: `${progressPct}%`,
            background: progressPct === 100
              ? "linear-gradient(90deg,#22c55e,#16a34a)"
              : "linear-gradient(90deg,#d4af37,#f5cc4e)"
          }} />
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
          {toBengaliNumber(markedCount)} জনের হাজিরা দেওয়া হয়েছে — {toBengaliNumber(teachers.length - markedCount)} জন বাকি
        </p>
      </div>

      {/* ══ Controls ══ */}
      <div className="content-box" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block", fontWeight: 600 }}>
              তারিখ নির্বাচন
            </label>
            <input type="date" className="glass-input" value={date}
              onChange={e => { setDate(e.target.value); setRecords({}); }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block", fontWeight: 600 }}>
              স্টাফ খুঁজুন
            </label>
            <div style={{ position: "relative" }}>
              <input className="glass-input" placeholder="নাম বা পদবী..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 38 }} />
              <Icon name="fa-search" size={13} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
            </div>
          </div>
        </div>

        {canWrite && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => markAll("present")}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="fa-check-double" size={13} /> সবাই উপস্থিত
            </button>
            <button onClick={() => markAll("absent")}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="fa-times" size={13} /> সবাই অনুপস্থিত
            </button>
          </div>
        )}
      </div>

      {/* ══ Mobile Cards ══ */}
      <div className="att-mobile-cards">
        {filtered.map(member => {
          const status = mergedRecords[member.id];
          return (
            <div key={member.id} style={{
              background: "var(--th-card-bg)",
              border: `1px solid ${status === "present" ? "rgba(34,197,94,0.28)" : status === "absent" ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 14, padding: "14px 16px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 12,
              transition: "border-color 0.2s",
            }}>
              {/* Left accent */}
              {status && (
                <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: "0 3px 3px 0", background: STATUS_CONFIG[status].color }} />
              )}
              {/* Avatar */}
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: status ? STATUS_CONFIG[status].bg : "rgba(255,255,255,0.07)",
                border: `2px solid ${status ? STATUS_CONFIG[status].color + "40" : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="fa-user" size={18} style={{ color: status ? STATUS_CONFIG[status].color : "rgba(255,255,255,0.3)" }} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: "#fff", margin: "0 0 2px" }}>{member.name}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  {member.designation || member.role || "স্টাফ"}
                  {member.staff_id && <> · {member.staff_id}</>}
                </p>
              </div>

              {/* Buttons */}
              {canWrite ? (
                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  {(["present", "absent"] as AttendanceStatus[]).map(s => (
                    <button key={s} onClick={() => setStatus(member.id, s)}
                      title={STATUS_CONFIG[s].label}
                      style={{
                        width: 44, height: 44, borderRadius: 12, cursor: "pointer",
                        border: `1.5px solid ${status === s ? STATUS_CONFIG[s].color : "rgba(255,255,255,0.12)"}`,
                        background: status === s ? STATUS_CONFIG[s].bg : "rgba(255,255,255,0.04)",
                        color: status === s ? STATUS_CONFIG[s].color : "rgba(255,255,255,0.28)",
                        fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.18s",
                        WebkitTapHighlightColor: "transparent",
                      }}>
                      <Icon name={STATUS_CONFIG[s].icon} size={20} />
                    </button>
                  ))}
                </div>
              ) : (
                status ? (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, background: STATUS_CONFIG[status].bg, color: STATUS_CONFIG[status].color, border: `1px solid ${STATUS_CONFIG[status].border}` }}>
                    {STATUS_CONFIG[status].label}
                  </span>
                ) : null
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "rgba(255,255,255,0.3)" }}>
            <Icon name="fa-search" size={32} style={{ marginBottom: 12, display: "block" }} />
            কোনো স্টাফ পাওয়া যায়নি
          </div>
        )}
      </div>

      {/* ══ Desktop Table ══ */}
      <div className="att-desktop-table content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left", paddingLeft: 20 }}>নাম</th>
                <th>পদবী</th>
                <th>আইডি</th>
                <th style={{ textAlign: "center", minWidth: 220 }}>হাজিরা</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => {
                const status = mergedRecords[member.id];
                return (
                  <tr key={member.id}>
                    <td style={{ textAlign: "left", paddingLeft: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: status ? STATUS_CONFIG[status].bg : "rgba(255,255,255,0.06)", border: `1.5px solid ${status ? STATUS_CONFIG[status].color + "40" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name="fa-user" size={14} style={{ color: status ? STATUS_CONFIG[status].color : "rgba(255,255,255,0.3)" }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{member.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "rgba(255,255,255,0.65)" }}>{member.designation || member.role || "স্টাফ"}</td>
                    <td style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{member.staff_id}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                        {canWrite && (["present", "absent"] as AttendanceStatus[]).map(s => (
                          <button key={s} onClick={() => setStatus(member.id, s)}
                            style={{ padding: "7px 18px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.18s", border: `1.5px solid ${status === s ? STATUS_CONFIG[s].color : "rgba(255,255,255,0.12)"}`, background: status === s ? STATUS_CONFIG[s].bg : "rgba(255,255,255,0.04)", color: status === s ? STATUS_CONFIG[s].color : "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon name={STATUS_CONFIG[s].icon} size={13} />
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        {!canWrite && status && (
                          <span style={{ padding: "6px 14px", borderRadius: 9, fontSize: 13, fontWeight: 700, background: STATUS_CONFIG[status].bg, color: STATUS_CONFIG[status].color, border: `1px solid ${STATUS_CONFIG[status].border}` }}>
                            {STATUS_CONFIG[status].label}
                          </span>
                        )}
                        {!canWrite && !status && <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 50, color: "rgba(255,255,255,0.3)" }}>
                    কোনো স্টাফ পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Floating Save Button (Mobile only) ══ */}
      {canWrite && (
        <button onClick={handleSave} disabled={upsertAttendance.isPending}
          className="att-fab"
          style={{
            position: "fixed", bottom: 82, right: 20, zIndex: 999,
            height: 52, paddingInline: 22, borderRadius: 26,
            background: markedCount > 0 ? "linear-gradient(135deg,#d4af37,#b8960c)" : "rgba(255,255,255,0.1)",
            border: "none", cursor: markedCount > 0 ? "pointer" : "default",
            boxShadow: markedCount > 0 ? "0 4px 20px rgba(212,175,55,0.4)" : "none",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 14, fontWeight: 700, color: markedCount > 0 ? "#0a1f0a" : "rgba(255,255,255,0.3)",
            fontFamily: "'Hind Siliguri','Noto Sans Bengali',sans-serif",
            transition: "all 0.3s",
          }}>
          <Icon name="fa-save" size={15} />
          {upsertAttendance.isPending ? "সংরক্ষণ হচ্ছে..." : `সংরক্ষণ (${toBengaliNumber(markedCount)})`}
        </button>
      )}

      <style>{`
        @media (min-width: 768px) {
          .att-mobile-cards  { display: none !important; }
          .att-fab           { display: none !important; }
        }
        @media (max-width: 767px) {
          .att-desktop-table   { display: none !important; }
          .att-desktop-actions { display: none !important; }
        }
      `}</style>
    </div>
  );
}
