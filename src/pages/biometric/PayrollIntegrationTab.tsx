import { useMemo, useState } from "react";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import Icon from "@/components/Icon";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { useStaff } from "@/hooks/useStaff";
import { useSalaryPayments } from "@/hooks/useSalaryPayments";

interface Props {
  staffList: Array<{ id: string; name: string; identifier: string; extra: string }>;
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const labelStyle: React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" };
const statBox: React.CSSProperties = { textAlign: "center", padding: 16, marginBottom: 0 };

export default function PayrollIntegrationTab({ staffList }: Props) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: attendance = [] } = useTeacherAttendance();
  const { data: allStaff = [] } = useStaff();
  const { data: payments = [] } = useSalaryPayments();

  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const bengaliMonth = MONTHS_BENGALI[selectedMonth];

  const staffLookup = useMemo(() => {
    const map: Record<string, { name: string; role: string; salary: number }> = {};
    allStaff.forEach((s) => {
      map[s.id] = { name: s.name, role: s.designation || s.role, salary: Number(s.salary) || 0 };
    });
    return map;
  }, [allStaff]);

  const paidSet = useMemo(() => {
    const set = new Set<string>();
    payments
      .filter((p) => p.month === bengaliMonth && p.year === selectedYear)
      .forEach((p) => set.add(p.staffId));
    return set;
  }, [payments, bengaliMonth, selectedYear]);

  const rows = useMemo(() => {
    return staffList.map((staff) => {
      const info = staffLookup[staff.id];
      const baseSalary = info?.salary ?? 0;
      const presentDays = attendance.filter(
        (a) => a.staffId === staff.id && a.date.startsWith(monthPrefix) && a.status === "present",
      ).length;
      const absentDays = Math.max(0, totalDays - presentDays);
      const dailyWage = totalDays > 0 ? baseSalary / totalDays : 0;
      const deduction = Math.round(absentDays * dailyWage);
      const netPayable = Math.max(0, baseSalary - deduction);
      const isPaid = paidSet.has(staff.id);

      return {
        id: staff.id,
        name: info?.name ?? staff.name,
        role: info?.role ?? staff.extra,
        baseSalary, presentDays, absentDays, dailyWage, deduction, netPayable, isPaid,
      };
    });
  }, [staffList, staffLookup, attendance, monthPrefix, totalDays, paidSet]);

  const summary = useMemo(() => ({
    totalStaff: rows.length,
    totalPresent: rows.reduce((s, r) => s + r.presentDays, 0),
    totalAbsent: rows.reduce((s, r) => s + r.absentDays, 0),
    totalBase: rows.reduce((s, r) => s + r.baseSalary, 0),
    totalDeduction: rows.reduce((s, r) => s + r.deduction, 0),
    totalNet: rows.reduce((s, r) => s + r.netPayable, 0),
  }), [rows]);

  return (
    <div>
      {/* Filters */}
      <div className="content-box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={labelStyle}>মাস নির্বাচন</label>
          <select className="glass-select" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
            {MONTHS_BENGALI.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 140px" }}>
          <label style={labelStyle}>বছর</label>
          <select className="glass-select" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{toBengaliNumber(y)}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          <span className="badge-gold" style={{ fontSize: 13 }}>
            <Icon name="fa-calendar" size={12} /> মোট কার্যদিবস: {toBengaliNumber(totalDays)}
          </span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>নাম ও পদবি</th>
                <th style={{ textAlign: "center" }}>উপস্থিত</th>
                <th style={{ textAlign: "center" }}>অনুপস্থিত</th>
                <th style={{ textAlign: "right" }}>মূল বেতন</th>
                <th style={{ textAlign: "right" }}>দৈনিক মজুরি</th>
                <th style={{ textAlign: "right" }}>কর্তন</th>
                <th style={{ textAlign: "right" }}>প্রদেয়</th>
                <th style={{ textAlign: "center" }}>স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
                    কোনো স্টাফ পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{r.role}</div>
                    </td>
                    <td style={{ textAlign: "center", color: "#28a745", fontWeight: 600 }}>
                      {toBengaliNumber(r.presentDays)}
                    </td>
                    <td style={{ textAlign: "center", color: r.absentDays > 0 ? "#dc3545" : "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                      {toBengaliNumber(r.absentDays)}
                    </td>
                    <td style={{ textAlign: "right" }}>{formatTaka(r.baseSalary)}</td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      {formatTaka(Math.round(r.dailyWage))}
                    </td>
                    <td style={{ textAlign: "right", color: r.deduction > 0 ? "#dc3545" : "rgba(255,255,255,0.6)" }}>
                      {formatTaka(r.deduction)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "#d4af37" }}>
                      {formatTaka(r.netPayable)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {r.isPaid ? (
                        <span className="badge-success" style={{ fontSize: 11 }}>
                          <Icon name="fa-check-circle" size={10} /> পরিশোধিত
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 50, fontWeight: 600, background: "rgba(220,53,69,0.15)", color: "#dc3545" }}>
                          বকেয়া
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 4 }}>
        <div className="content-box" style={statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#d4af37" }}>{toBengaliNumber(summary.totalStaff)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট স্টাফ</p>
        </div>
        <div className="content-box" style={statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#28a745" }}>{toBengaliNumber(summary.totalPresent)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট উপস্থিত দিন</p>
        </div>
        <div className="content-box" style={statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#dc3545" }}>{toBengaliNumber(summary.totalAbsent)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট অনুপস্থিত দিন</p>
        </div>
        <div className="content-box" style={statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#17a2b8" }}>{formatTaka(summary.totalBase)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট মূল বেতন</p>
        </div>
        <div className="content-box" style={statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#dc3545" }}>{formatTaka(summary.totalDeduction)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট কর্তন</p>
        </div>
        <div className="content-box" style={statBox}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#d4af37" }}>{formatTaka(summary.totalNet)}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>মোট প্রদেয়</p>
        </div>
      </div>
    </div>
  );
}
