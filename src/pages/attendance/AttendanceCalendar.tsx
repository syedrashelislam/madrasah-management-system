/**
 * AttendanceCalendar — Monthly calendar heatmap for student attendance.
 *
 * Shows a grid of days for the selected month, color-coded by attendance
 * status per student. Clicking a day switches the parent to list view
 * for that date so the teacher can mark/edit.
 */
import { useMemo, useState } from "react";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import type { AttendanceRow } from "@/hooks/useAttendance";
import type { StudentRow } from "@/hooks/useStudents";

const STATUS_COLORS: Record<string, string> = {
  present: "#28a745",
  absent: "#dc3545",
  late: "#f97316",
  leave: "#6366f1",
};

const STATUS_LABELS: Record<string, string> = {
  present: "উপস্থিত",
  absent: "অনুপস্থিত",
  late: "বিলম্বে",
  leave: "ছুটি",
};

const BN_WEEKDAYS = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"];
const BN_MONTHS = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

interface Props {
  students: StudentRow[];
  attendance: AttendanceRow[];
  onDayClick: (dateStr: string) => void;
}

export default function AttendanceCalendar({ students, attendance, onDayClick }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Build a map: "YYYY-MM-DD" → { present: N, absent: N, late: N, leave: N }
  const dailyStats = useMemo(() => {
    const studentIdSet = new Set(students.map(s => s.student_id));
    const map: Record<string, Record<string, number>> = {};

    attendance.forEach(row => {
      if (!studentIdSet.has(row.studentId)) return;
      if (!row.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) return;
      if (!map[row.date]) map[row.date] = { present: 0, absent: 0, late: 0, leave: 0 };
      const status = row.status as string;
      if (map[row.date][status] !== undefined) map[row.date][status]++;
    });

    return map;
  }, [attendance, students, year, month]);

  // Calendar grid generation
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  // JS: 0=Sun → shift so 0=Sat for BD week
  const startDow = (firstDay.getDay() + 1) % 7; // 0=Sat
  const totalCells = Math.ceil((daysInMonth + startDow) / 7) * 7;

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const todayStr = today.toISOString().split("T")[0];
  const totalStudents = students.length;

  return (
    <div>
      {/* Month navigator */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, padding: "8px 0",
      }}>
        <button
          onClick={goPrev}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            color: "rgba(255,255,255,0.7)", transition: "all 0.2s",
          }}
        >
          <Icon name="fa-chevron-right" size={12} />
        </button>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37" }}>
          {BN_MONTHS[month]} {toBengaliNumber(year)}
        </h3>
        <button
          onClick={goNext}
          style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "6px 12px", cursor: "pointer",
            color: "rgba(255,255,255,0.7)", transition: "all 0.2s",
          }}
        >
          <Icon name="fa-chevron-left" size={12} />
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, fontSize: 11 }}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 10, height: 10, borderRadius: 3,
              background: STATUS_COLORS[key], display: "inline-block",
            }} />
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 3,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "inline-block",
          }} />
          <span style={{ color: "rgba(255,255,255,0.5)" }}>হাজিরা নেওয়া হয়নি</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
      }}>
        {/* Weekday headers */}
        {BN_WEEKDAYS.map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: 11, fontWeight: 600,
            color: "rgba(255,255,255,0.4)", padding: "8px 0",
          }}>
            {d}
          </div>
        ))}

        {/* Day cells */}
        {Array.from({ length: totalCells }).map((_, idx) => {
          const dayNum = idx - startDow + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          if (!isValid) return <div key={idx} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const stats = dailyStats[dateStr];
          const hasData = !!stats;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;

          // Determine dominant status for cell color
          let dominantColor = "rgba(255,255,255,0.04)";
          let dominantBorder = "rgba(255,255,255,0.06)";
          if (hasData) {
            const max = Math.max(stats.present, stats.absent, stats.late, stats.leave);
            if (stats.present === max) { dominantColor = "rgba(40,167,69,0.15)"; dominantBorder = "rgba(40,167,69,0.3)"; }
            else if (stats.absent === max) { dominantColor = "rgba(220,53,69,0.15)"; dominantBorder = "rgba(220,53,69,0.3)"; }
            else if (stats.late === max) { dominantColor = "rgba(249,115,22,0.15)"; dominantBorder = "rgba(249,115,22,0.3)"; }
            else { dominantColor = "rgba(99,102,241,0.15)"; dominantBorder = "rgba(99,102,241,0.3)"; }
          }

          return (
            <button
              key={idx}
              onClick={() => !isFuture && onDayClick(dateStr)}
              disabled={isFuture}
              style={{
                position: "relative",
                padding: "8px 4px",
                borderRadius: 8,
                border: isToday ? "2px solid #d4af37" : `1px solid ${dominantBorder}`,
                background: dominantColor,
                cursor: isFuture ? "not-allowed" : "pointer",
                opacity: isFuture ? 0.35 : 1,
                transition: "all 0.2s",
                minHeight: 72,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              {/* Day number */}
              <span style={{
                fontSize: 13, fontWeight: isToday ? 800 : 600,
                color: isToday ? "#d4af37" : "rgba(255,255,255,0.8)",
              }}>
                {toBengaliNumber(dayNum)}
              </span>

              {/* Mini stats */}
              {hasData ? (
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                  {stats.present > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#28a745",
                      background: "rgba(40,167,69,0.2)", padding: "1px 4px", borderRadius: 4,
                    }}>
                      {toBengaliNumber(stats.present)}
                    </span>
                  )}
                  {stats.absent > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#dc3545",
                      background: "rgba(220,53,69,0.2)", padding: "1px 4px", borderRadius: 4,
                    }}>
                      {toBengaliNumber(stats.absent)}
                    </span>
                  )}
                  {stats.late > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#f97316",
                      background: "rgba(249,115,22,0.2)", padding: "1px 4px", borderRadius: 4,
                    }}>
                      {toBengaliNumber(stats.late)}
                    </span>
                  )}
                  {stats.leave > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#6366f1",
                      background: "rgba(99,102,241,0.2)", padding: "1px 4px", borderRadius: 4,
                    }}>
                      {toBengaliNumber(stats.leave)}
                    </span>
                  )}
                </div>
              ) : !isFuture ? (
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>—</span>
              ) : null}

              {/* Attendance percentage bar */}
              {hasData && totalStudents > 0 && (
                <div style={{
                  width: "80%", height: 3, borderRadius: 2,
                  background: "rgba(255,255,255,0.08)", overflow: "hidden",
                }}>
                  <div style={{
                    width: `${Math.round((stats.present / totalStudents) * 100)}%`,
                    height: "100%", borderRadius: 2,
                    background: "#28a745",
                  }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly summary */}
      {(() => {
        const totalDaysWithData = Object.keys(dailyStats).length;
        const allPresent = Object.values(dailyStats).reduce((s, d) => s + d.present, 0);
        const allAbsent = Object.values(dailyStats).reduce((s, d) => s + d.absent, 0);
        const allLate = Object.values(dailyStats).reduce((s, d) => s + d.late, 0);
        const allLeave = Object.values(dailyStats).reduce((s, d) => s + d.leave, 0);
        const totalRecords = allPresent + allAbsent + allLate + allLeave;
        const attendanceRate = totalRecords > 0 ? Math.round((allPresent / totalRecords) * 100) : 0;

        return (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.15)",
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#d4af37", marginBottom: 12 }}>
              <Icon name="fa-chart-pie" size={14} /> মাসিক সারাংশ — {BN_MONTHS[month]} {toBengaliNumber(year)}
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#d4af37" }}>{toBengaliNumber(totalDaysWithData)}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>কার্যদিবস</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#28a745" }}>{toBengaliNumber(allPresent)}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>মোট উপস্থিতি</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#dc3545" }}>{toBengaliNumber(allAbsent)}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>মোট অনুপস্থিতি</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{
                  fontSize: 20, fontWeight: 800,
                  color: attendanceRate >= 80 ? "#28a745" : attendanceRate >= 60 ? "#ffc107" : "#dc3545",
                }}>
                  {toBengaliNumber(attendanceRate)}%
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>উপস্থিতি হার</p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
