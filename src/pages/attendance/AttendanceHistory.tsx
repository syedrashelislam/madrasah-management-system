/**
 * AttendanceHistory — Full day-by-day attendance record for a single student.
 * Displays a monthly calendar grid + stats with month navigation.
 * Used inside StudentProfile.
 */
import { useMemo, useState } from "react";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import type { AttendanceRow } from "@/hooks/useAttendance";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  present: { label: "উপস্থিত", color: "#28a745", icon: "fa-check-circle" },
  absent:  { label: "অনুপস্থিত", color: "#dc3545", icon: "fa-times-circle" },
  late:    { label: "বিলম্বে", color: "#f97316", icon: "fa-clock" },
  leave:   { label: "ছুটি", color: "#6366f1", icon: "fa-calendar-minus" },
};

const BN_WEEKDAYS = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"];
const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

const gold = "#d4af37";

interface Props {
  studentId: string;
  allAttendance: AttendanceRow[];
}

export default function AttendanceHistory({ studentId, allAttendance }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Filter attendance for this student + month
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthlyRecords = useMemo(() => {
    return allAttendance
      .filter(a => a.studentId === studentId && a.date.startsWith(monthPrefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allAttendance, studentId, monthPrefix]);

  // Build date→status map
  const dateStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    monthlyRecords.forEach(r => { map[r.date] = r.status; });
    return map;
  }, [monthlyRecords]);

  // Stats
  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
    monthlyRecords.forEach(r => {
      s.total++;
      if (r.status === "present") s.present++;
      else if (r.status === "absent") s.absent++;
      else if (r.status === "late") s.late++;
      else if (r.status === "leave") s.leave++;
    });
    return s;
  }, [monthlyRecords]);

  const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  // Overall lifetime stats
  const lifetimeStats = useMemo(() => {
    const records = allAttendance.filter(a => a.studentId === studentId);
    const s = { present: 0, absent: 0, late: 0, leave: 0, total: records.length };
    records.forEach(r => {
      if (r.status === "present") s.present++;
      else if (r.status === "absent") s.absent++;
      else if (r.status === "late") s.late++;
      else if (r.status === "leave") s.leave++;
    });
    return s;
  }, [allAttendance, studentId]);

  const lifetimeRate = lifetimeStats.total > 0 ? Math.round(((lifetimeStats.present + lifetimeStats.late) / lifetimeStats.total) * 100) : 0;

  // Calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDow = (firstDay.getDay() + 1) % 7;
  const totalCells = Math.ceil((daysInMonth + startDow) / 7) * 7;
  const todayStr = today.toISOString().split("T")[0];

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div>
      {/* Overall lifetime attendance bar */}
      <div style={{
        padding: 16, borderRadius: 12, marginBottom: 16,
        background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>সর্বকালীন উপস্থিতি হার</span>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: lifetimeRate >= 80 ? "#28a745" : lifetimeRate >= 60 ? "#ffc107" : "#dc3545",
          }}>
            {toBengaliNumber(lifetimeRate)}%
          </span>
        </div>
        <div style={{ width: "100%", height: 10, borderRadius: 6, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{
            width: `${lifetimeRate}%`, height: "100%", borderRadius: 6, transition: "width 0.6s ease",
            background: lifetimeRate >= 80
              ? "linear-gradient(90deg, #28a745, #34d058)"
              : lifetimeRate >= 60 ? "linear-gradient(90deg, #ffc107, #ffdb4d)"
              : "linear-gradient(90deg, #dc3545, #f06070)",
          }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <span key={key} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, display: "inline-block" }} />
              {cfg.label}: {toBengaliNumber((lifetimeStats as any)[key])}
            </span>
          ))}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            মোট: {toBengaliNumber(lifetimeStats.total)} দিন
          </span>
        </div>
      </div>

      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={goPrev} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "rgba(255,255,255,0.7)",
        }}>
          <Icon name="fa-chevron-right" size={12} />
        </button>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: gold }}>
          {BN_MONTHS[month]} {toBengaliNumber(year)}
        </h4>
        <button onClick={goNext} style={{
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "6px 12px", cursor: "pointer", color: "rgba(255,255,255,0.7)",
        }}>
          <Icon name="fa-chevron-left" size={12} />
        </button>
      </div>

      {/* Monthly stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 14 }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{
            textAlign: "center", padding: "10px 8px", borderRadius: 10,
            background: `${cfg.color}10`, border: `1px solid ${cfg.color}25`,
          }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: cfg.color }}>{toBengaliNumber((stats as any)[key])}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{cfg.label}</p>
          </div>
        ))}
        <div style={{
          textAlign: "center", padding: "10px 8px", borderRadius: 10,
          background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)",
        }}>
          <p style={{
            fontSize: 20, fontWeight: 800,
            color: attendanceRate >= 80 ? "#28a745" : attendanceRate >= 60 ? "#ffc107" : "#dc3545",
          }}>
            {toBengaliNumber(attendanceRate)}%
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>হার</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {BN_WEEKDAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", padding: "6px 0" }}>
            {d}
          </div>
        ))}

        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum = idx - startDow + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          if (!isValid) return <div key={idx} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const status = dateStatusMap[dateStr];
          const cfg = status ? STATUS_CONFIG[status] : null;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          return (
            <div
              key={idx}
              title={cfg ? `${cfg.label}` : isFuture ? "" : "হাজিরা নেওয়া হয়নি"}
              style={{
                position: "relative", textAlign: "center", borderRadius: 8,
                padding: "6px 2px", minHeight: 44,
                background: cfg ? `${cfg.color}12` : "rgba(255,255,255,0.02)",
                border: isToday ? `2px solid ${gold}` : cfg ? `1px solid ${cfg.color}30` : "1px solid rgba(255,255,255,0.05)",
                opacity: isFuture ? 0.3 : 1,
                transition: "all 0.15s",
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: isToday ? 800 : 500,
                color: isToday ? gold : "rgba(255,255,255,0.7)",
                display: "block",
              }}>
                {toBengaliNumber(dayNum)}
              </span>
              {cfg && (
                <Icon name={cfg.icon} size={10} style={{ color: cfg.color, marginTop: 2 }} />
              )}
              {!cfg && !isFuture && (
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", display: "block", marginTop: 2 }}>—</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Day-by-day log table */}
      {monthlyRecords.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
            দিনভিত্তিক বিস্তারিত — {BN_MONTHS[month]} {toBengaliNumber(year)}
          </h4>
          <div className="mobile-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>বার</th>
                  <th>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRecords.map(r => {
                  const d = new Date(r.date);
                  const dayName = BN_WEEKDAYS[(d.getDay() + 1) % 7];
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.present;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>
                        {d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{dayName}</td>
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: `${cfg.color}20`, color: cfg.color,
                        }}>
                          <Icon name={cfg.icon} size={10} /> {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
