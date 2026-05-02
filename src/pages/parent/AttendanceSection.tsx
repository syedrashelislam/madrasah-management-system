import { useMemo } from "react";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import type { AttendanceRow } from "@/hooks/useAttendance";

interface Props {
  studentId: string;
  attendance: AttendanceRow[];
}

export default function AttendanceSection({ studentId, attendance }: Props) {
  const studentAttendance = useMemo(() => {
    const filtered = attendance.filter((a) => a.studentId === studentId);
    // Sort by date descending, take last 30 days
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().split("T")[0];
    return sorted.filter((a) => a.date >= cutoff);
  }, [studentId, attendance]);

  const totalPresent = studentAttendance.filter((a) => a.status === "present").length;
  const totalAbsent = studentAttendance.filter((a) => a.status === "absent").length;
  const total = studentAttendance.length;
  const rate = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

  const summaryCards = [
    { label: "মোট উপস্থিত", value: toBengaliNumber(totalPresent), icon: "fa-check-circle", bg: "rgba(52,211,153,0.15)", color: "#34d399" },
    { label: "মোট অনুপস্থিত", value: toBengaliNumber(totalAbsent), icon: "fa-times-circle", bg: "rgba(248,113,113,0.15)", color: "#f87171" },
    { label: "হাজিরা হার", value: `${toBengaliNumber(rate)}%`, icon: "fa-chart-pie", bg: "rgba(212,175,55,0.15)", color: "#d4af37" },
  ];

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${toBengaliNumber(d.getDate())}/${toBengaliNumber(d.getMonth() + 1)}/${toBengaliNumber(d.getFullYear())}`;
    } catch { return dateStr; }
  };

  return (
    <div className="content-box">
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
        <Icon name="fa-clipboard-check" /> হাজিরা (শেষ ৩০ দিন)
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        {summaryCards.map((card, i) => (
          <div key={i} style={{ background: card.bg, borderRadius: 10, padding: 14, textAlign: "center" }}>
            <Icon name={card.icon} size={18} style={{ color: card.color, marginBottom: 6 }} />
            <div style={{ fontSize: 20, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {studentAttendance.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 20 }}>
          <Icon name="fa-info-circle" /> কোনো হাজিরা তথ্য পাওয়া যায়নি
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
          {studentAttendance.map((a) => {
            const isPresent = a.status === "present";
            return (
              <div
                key={a.id}
                style={{
                  padding: "8px 6px",
                  borderRadius: 8,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  background: isPresent ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                  border: `1px solid ${isPresent ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                  color: isPresent ? "#34d399" : "#f87171",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{formatDate(a.date)}</div>
                <div style={{ marginTop: 2 }}>
                  <Icon name={isPresent ? "fa-check" : "fa-times"} size={10} />{" "}
                  {isPresent ? "উপস্থিত" : "অনুপস্থিত"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
