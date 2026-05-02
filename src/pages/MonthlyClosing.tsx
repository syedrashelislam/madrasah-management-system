import { useTransactions } from "@/hooks/useTransactions";
import { usePayments } from "@/hooks/usePayments";
import { useStaff } from "@/hooks/useStaff";
import { useStudents } from "@/hooks/useStudents";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";

export default function MonthlyClosing() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: payments = [] } = usePayments();
  const { data: staff = [] } = useStaff();
  const { data: students = [] } = useStudents();
  const [selectedMonth] = useState(new Date().getMonth());
  const [selectedYear] = useState(2025);
  const [closed, setClosed] = useState(false);

  if (isLoading) return <div><div className="page-header"><h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-calendar-check" style={{ marginLeft: 8 }} /> মাসিক ক্লোজিং</h2></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-20" style={{ borderRadius: 10 }} />)}</div></div>;

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const activeStaff = staff.filter((s) => s.status === "active");
  const totalSalary = activeStaff.reduce((a, s) => a + s.salary, 0);
  const paidSalary = transactions.filter((t) => t.type === "expense" && (t.category === "শিক্ষক বেতন" || t.category === "কর্মচারী বেতন" || t.category === "রান্নাঘরের কর্মচারী বেতন")).reduce((a, t) => a + t.amount, 0);
  const dueSalary = totalSalary - paidSalary;
  const activeStudents = students.filter((s) => s.status === "active");
  const totalExpectedFees = activeStudents.reduce((a, s) => a + s.monthly_fee, 0);
  const totalCollectedFees = payments.reduce((a, p) => a + p.amount, 0);
  const totalDueFees = totalExpectedFees * 5 - totalCollectedFees;
  const balance = totalIncome - totalExpense;

  const summaryItems = [
    { label: "মোট আয়", value: formatTaka(totalIncome), color: "#28a745", icon: "fa-chart-line" },
    { label: "মোট খরচ", value: formatTaka(totalExpense), color: "#dc3545", icon: "fa-arrow-down" },
    { label: "মোট বেতন (নির্ধারিত)", value: formatTaka(totalSalary), color: "#a855f7", icon: "fa-wallet" },
    { label: "পরিশোধ করা বেতন", value: formatTaka(paidSalary), color: "#34d399", icon: "fa-check-circle" },
    { label: "বকেয়া বেতন", value: formatTaka(dueSalary > 0 ? dueSalary : 0), color: "#fbbf24", icon: "fa-exclamation-circle" },
    { label: "মোট বকেয়া ফি", value: formatTaka(totalDueFees > 0 ? totalDueFees : 0), color: "#f97316", icon: "fa-user-clock" },
    { label: "মাস শেষে ব্যালেন্স", value: formatTaka(balance), color: balance >= 0 ? "#d4af37" : "#dc3545", icon: "fa-money-bill-wave" },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-calendar-check" style={{ marginLeft: 8 }} /> মাসিক ক্লোজিং</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>মাস শেষে আয়-ব্যয়ের সামারি</p>
        </div>
        <div className="content-box" style={{ padding: '8px 16px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="fa-calendar" style={{ color: '#d4af37' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS_BENGALI[selectedMonth]} {toBengaliNumber(selectedYear)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {summaryItems.map((item, i) => (
          <div key={i} className="summary-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="icon-box" style={{ background: `${item.color}20` }}><Icon name={item.icon} style={{ color: item.color }} /></div>
            <div><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{item.label}</p><p style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</p></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="content-box">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#28a745', marginBottom: 12 }}><Icon name="fa-arrow-up" /> আয়ের বিবরণ</h3>
          {transactions.filter((t) => t.type === "income").map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div><p style={{ fontSize: 14 }}>{t.description}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.category} • {t.date}</p></div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#28a745' }}>{formatTaka(t.amount)}</span>
            </div>
          ))}
          {transactions.filter(t => t.type === "income").length === 0 && <p style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)' }}>কোনো আয় নেই</p>}
        </div>
        <div className="content-box">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#dc3545', marginBottom: 12 }}><Icon name="fa-arrow-down" /> খরচের বিবরণ</h3>
          {transactions.filter((t) => t.type === "expense").map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div><p style={{ fontSize: 14 }}>{t.description}</p><p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.category} • {t.date}</p></div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#dc3545' }}>{formatTaka(t.amount)}</span>
            </div>
          ))}
          {transactions.filter(t => t.type === "expense").length === 0 && <p style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)' }}>কোনো খরচ নেই</p>}
        </div>
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}><h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-users" /> স্টাফ বেতন স্থিতি</h3></div>
        <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>নাম</th><th>পদবী</th><th>নির্ধারিত বেতন</th><th>অবস্থা</th></tr></thead><tbody>{activeStaff.map((s) => (<tr key={s.id}><td style={{ fontWeight: 600 }}>{s.name}</td><td style={{ color: 'rgba(255,255,255,0.6)' }}>{s.role}</td><td>{formatTaka(s.salary)}</td><td><span className="badge-gold">বকেয়া</span></td></tr>))}</tbody></table></div>
      </div>

      <div className="content-box" style={{ textAlign: 'center', padding: 30 }}>
        {closed ? (
          <div><Icon name="fa-lock" size={28} style={{ color: '#d4af37', display: 'block', marginBottom: 12 }} /><p style={{ fontSize: 14, fontWeight: 600, color: '#d4af37' }}>এই মাস সফলভাবে ক্লোজ করা হয়েছে</p></div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>সকল হিসাব যাচাই করে মাস ক্লোজ করুন</p>
            <button className="btn-gold" style={{ padding: '12px 32px', fontSize: 16 }} onClick={() => { setClosed(true); toast.success(`${MONTHS_BENGALI[selectedMonth]} ${toBengaliNumber(selectedYear)} - মাস সফলভাবে ক্লোজ হয়েছে`); }}><Icon name="fa-lock" /> মাস ক্লোজ করুন</button>
          </div>
        )}
      </div>
    </div>
  );
}
