import { useState, useMemo, useCallback } from "react";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useClasses } from "@/hooks/useClasses";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import { buildSingleReportHTML } from "@/lib/buildReportHTML";
import { printReceiptHTML } from "@/lib/printReceipt";
import type { ReportData } from "@/lib/buildReportHTML";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";

const currentYear = new Date().getFullYear();
const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: `${MONTHS_BENGALI[i]} ${toBengaliNumber(currentYear)}`,
  label: `${MONTHS_BENGALI[i]} ${toBengaliNumber(currentYear)}`,
  monthIdx: i,
}));

export default function MonthlyFeeReportTab() {
  const { data: students = [], isLoading } = useStudents();
  const { data: payments = [] } = usePayments();
  const { data: classes = [] } = useClasses();
  const institution = useInstitutionInfo();

  const currentMonthIdx = new Date().getMonth();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[currentMonthIdx].value);
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "active"),
    [students],
  );

  const report = useMemo(() => {
    const filtered = selectedClassId === ""
      ? activeStudents
      : activeStudents.filter((s) => s.class_id === selectedClassId);

    const rows = filtered
      .sort((a, b) => (a.class_name || "").localeCompare(b.class_name || "") || (Number(a.roll) || 0) - (Number(b.roll) || 0))
      .map((student) => {
        const paid = payments.find(
          (p) => p.student_id === student.student_id && p.month === selectedMonth && p.fee_type !== "Admission" && p.fee_type !== "Exam",
        );
        return {
          student,
          paidAmount: paid ? paid.amount : 0,
          isPaid: !!paid,
          monthlyFee: student.monthly_fee,
          pending: paid ? Math.max(0, student.monthly_fee - paid.amount) : student.monthly_fee,
          method: paid?.method || "",
          paymentDate: paid?.payment_date || "",
        };
      });

    const totalExpected = rows.reduce((s, r) => s + r.monthlyFee, 0);
    const totalCollected = rows.reduce((s, r) => s + r.paidAmount, 0);
    const totalPending = totalExpected - totalCollected;
    const paidCount = rows.filter((r) => r.isPaid).length;
    const unpaidCount = rows.length - paidCount;
    const collectionRate = rows.length > 0 ? Math.round((paidCount / rows.length) * 100) : 0;

    return { rows, totalExpected, totalCollected, totalPending, paidCount, unpaidCount, collectionRate };
  }, [activeStudents, payments, selectedMonth, selectedClassId]);

  const handlePrint = useCallback(() => {
    const classLabel = selectedClassId === ""
      ? "সকল শ্রেণি"
      : classes.find((c) => c.class_id === selectedClassId)?.name || "";

    const reportData: ReportData = {
      institution,
      reportTitle: `মাসিক ফি আদায় রিপোর্ট — ${selectedMonth}`,
      subtitle: `শ্রেণি: ${classLabel} | মোট ছাত্র: ${toBengaliNumber(report.rows.length)}`,
      summaryCards: [
        { label: "প্রত্যাশিত ফি", value: formatTaka(report.totalExpected), color: "#1a5c1a" },
        { label: "আদায়কৃত", value: formatTaka(report.totalCollected), color: "#28a745" },
        { label: "বকেয়া", value: formatTaka(report.totalPending), color: "#dc3545" },
        { label: "আদায় হার", value: `${toBengaliNumber(report.collectionRate)}%`, color: "#d4af37" },
        { label: "পরিশোধিত", value: toBengaliNumber(report.paidCount), color: "#28a745" },
        { label: "অপরিশোধিত", value: toBengaliNumber(report.unpaidCount), color: "#dc3545" },
      ],
      columns: [
        { header: "ক্র.নং", width: "44px" },
        { header: "আইডি" },
        { header: "নাম" },
        { header: "শ্রেণি" },
        { header: "মাসিক ফি" },
        { header: "আদায়" },
        { header: "বকেয়া" },
        { header: "অবস্থা" },
      ],
      rows: report.rows.map((r, i) => ({
        cells: [
          toBengaliNumber(i + 1),
          r.student.student_id,
          r.student.name,
          r.student.class_name,
          formatTaka(r.monthlyFee),
          r.paidAmount > 0 ? formatTaka(r.paidAmount) : "—",
          r.pending > 0 ? formatTaka(r.pending) : "—",
          r.isPaid ? (r.pending > 0 ? "আংশিক" : "পরিশোধিত ✓") : "বকেয়া",
        ],
      })),
    };

    const html = buildSingleReportHTML(reportData);
    printReceiptHTML(html, "portrait");
  }, [institution, selectedMonth, selectedClassId, classes, report]);

  if (isLoading) return <Skeleton className="h-64" style={{ borderRadius: 10 }} />;

  return (
    <div>
      {/* Controls */}
      <div className="content-box" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>মাস নির্বাচন</label>
          <select className="glass-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>শ্রেণি</label>
          <select className="glass-select" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">সকল শ্রেণি</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.class_id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <button className="btn-outline-gold" onClick={handlePrint}>
          <Icon name="fa-print" /> প্রিন্ট
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <Icon name="fa-money-bill-wave" size={18} style={{ color: "#1a5c1a", marginBottom: 6 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#1a5c1a" }}>{formatTaka(report.totalExpected)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>প্রত্যাশিত ফি</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <Icon name="fa-check-circle" size={18} style={{ color: "#28a745", marginBottom: 6 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#28a745" }}>{formatTaka(report.totalCollected)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>আদায়কৃত</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <Icon name="fa-exclamation-triangle" size={18} style={{ color: "#dc3545", marginBottom: 6 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#dc3545" }}>{formatTaka(report.totalPending)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>বকেয়া</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <Icon name="fa-chart-pie" size={18} style={{ color: "#d4af37", marginBottom: 6 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#d4af37" }}>{toBengaliNumber(report.collectionRate)}%</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>আদায় হার</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <Icon name="fa-user-check" size={18} style={{ color: "#28a745", marginBottom: 6 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#28a745" }}>{toBengaliNumber(report.paidCount)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>পরিশোধিত</p>
        </div>
        <div className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
          <Icon name="fa-user-times" size={18} style={{ color: "#dc3545", marginBottom: 6 }} />
          <p style={{ fontSize: 22, fontWeight: 800, color: "#dc3545" }}>{toBengaliNumber(report.unpaidCount)}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>অপরিশোধিত</p>
        </div>
      </div>

      {/* Collection Progress */}
      <div className="content-box" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>আদায় অগ্রগতি</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#d4af37" }}>{toBengaliNumber(report.collectionRate)}%</span>
        </div>
        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 4,
              width: `${report.collectionRate}%`,
              background: report.collectionRate >= 75
                ? "linear-gradient(90deg, #28a745, #20c997)"
                : report.collectionRate >= 50
                  ? "linear-gradient(90deg, #d4af37, #f0c040)"
                  : "linear-gradient(90deg, #dc3545, #f06070)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(212,175,55,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d4af37" }}>
            <Icon name="fa-list-alt" /> {selectedMonth} — ছাত্রভিত্তিক ফি রিপোর্ট
          </h3>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>মোট: {toBengaliNumber(report.rows.length)} জন</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ক্র.নং</th>
                <th>আইডি</th>
                <th>নাম</th>
                <th>শ্রেণি</th>
                <th>মাসিক ফি</th>
                <th>আদায়</th>
                <th>বকেয়া</th>
                <th>অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r, idx) => (
                <tr key={r.student.student_id}>
                  <td>{toBengaliNumber(idx + 1)}</td>
                  <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{r.student.student_id}</td>
                  <td style={{ fontWeight: 600 }}>{r.student.name}</td>
                  <td>{r.student.class_name}</td>
                  <td style={{ color: "#d4af37", fontWeight: 600 }}>{formatTaka(r.monthlyFee)}</td>
                  <td style={{ color: r.paidAmount > 0 ? "#28a745" : "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                    {r.paidAmount > 0 ? formatTaka(r.paidAmount) : "—"}
                  </td>
                  <td style={{ color: r.pending > 0 ? "#dc3545" : "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                    {r.pending > 0 ? formatTaka(r.pending) : "—"}
                  </td>
                  <td>
                    {r.isPaid ? (
                      r.pending > 0 ? (
                        <span style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>আংশিক</span>
                      ) : (
                        <span style={{ background: "rgba(40,167,69,0.15)", color: "#28a745", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>পরিশোধিত ✓</span>
                      )
                    ) : (
                      <span style={{ background: "rgba(220,53,69,0.15)", color: "#dc3545", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>বকেয়া</span>
                    )}
                  </td>
                </tr>
              ))}
              {report.rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" }}>
                    কোনো ছাত্র পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
