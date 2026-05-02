import { useMemo } from "react";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import Icon from "@/components/Icon";
import type { StudentRow } from "@/hooks/useStudents";
import type { PaymentRow } from "@/hooks/usePayments";

function generateMonthsFromAdmission(admissionDate: string): string[] {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-01-01`;
  const startStr = admissionDate && admissionDate.trim() ? admissionDate : defaultStart;
  const start = new Date(startStr);
  const months: string[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    months.push(`${MONTHS_BENGALI[month]} ${toBengaliNumber(year)}`);
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return months;
}

interface Props {
  student: StudentRow;
  payments: PaymentRow[];
}

export default function FeeStatusSection({ student, payments }: Props) {
  const studentPayments = payments.filter((p) => p.student_id === student.student_id);
  const allMonths = useMemo(() => generateMonthsFromAdmission(student.admission_date), [student.admission_date]);
  const paidMonths = studentPayments.filter(p => !p.month.startsWith("EXP:")).map((p) => p.month);

  const totalExpected = allMonths.length * student.monthly_fee;
  const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = totalExpected - totalPaid;

  const summaryCards = [
    { label: "মোট প্রত্যাশিত", value: formatTaka(totalExpected), icon: "fa-calculator", bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
    { label: "মোট পরিশোধ", value: formatTaka(totalPaid), icon: "fa-check-circle", bg: "rgba(52,211,153,0.15)", color: "#34d399" },
    { label: "মোট বকেয়া", value: formatTaka(totalDue > 0 ? totalDue : 0), icon: "fa-exclamation-triangle", bg: totalDue > 0 ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)", color: totalDue > 0 ? "#f87171" : "#34d399" },
  ];

  return (
    <div className="content-box">
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#d4af37", marginBottom: 16 }}>
        <Icon name="fa-money-bill-wave" /> ফি স্ট্যাটাস
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {summaryCards.map((card, i) => (
          <div key={i} style={{ background: card.bg, borderRadius: 10, padding: 14, textAlign: "center" }}>
            <Icon name={card.icon} size={18} style={{ color: card.color, marginBottom: 6 }} />
            <div style={{ fontSize: 18, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 6 }}>
        মাসভিত্তিক বিবরণ — {formatTaka(student.monthly_fee)}/মাস
      </h4>

      {/* Mobile card list */}
      <div className="mobile-card-list">
        {allMonths.map((m) => {
          const isPaid = paidMonths.includes(m);
          return (
            <div key={m} className="mobile-card-item">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{m}</span>
                {isPaid ? (
                  <span className="badge-success" style={{ fontSize: 11 }}>
                    <Icon name="fa-check" size={10} /> পরিশোধিত
                  </span>
                ) : (
                  <span style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                    <Icon name="fa-times" size={10} /> বকেয়া
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                পরিমাণ: {formatTaka(student.monthly_fee)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="desktop-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>মাস</th>
              <th>পরিমাণ</th>
              <th>অবস্থা</th>
            </tr>
          </thead>
          <tbody>
            {allMonths.map((m) => {
              const isPaid = paidMonths.includes(m);
              return (
                <tr key={m}>
                  <td style={{ fontWeight: 600 }}>{m}</td>
                  <td>{formatTaka(student.monthly_fee)}</td>
                  <td>
                    {isPaid ? (
                      <span className="badge-success" style={{ fontSize: 11 }}>
                        <Icon name="fa-check" size={10} /> পরিশোধিত
                      </span>
                    ) : (
                      <span style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        <Icon name="fa-times" size={10} /> বকেয়া
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
