import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useTransactions } from "@/hooks/useTransactions";
import { useStaff } from "@/hooks/useStaff";
import { useSalaryPayments } from "@/hooks/useSalaryPayments";
import { useAttendance } from "@/hooks/useAttendance";
import { useTeacherAttendance } from "@/hooks/useTeacherAttendance";
import { useClasses } from "@/hooks/useClasses";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import { buildSingleReportHTML } from "@/lib/buildReportHTML";
import { printReceiptHTML } from "@/lib/printReceipt";
import {
  buildStudentReport,
  buildFeeReport,
  buildIncomeReport,
  buildExpenseReport,
  buildSalaryReport,
  buildMonthlyReport,
  buildStudentAttendanceReport,
  buildStaffAttendanceReport,
  buildYearlyFinancialReport,
} from "@/pages/reports/reportBuilders";
import { useState, useMemo, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";

const TABS = [
  { id: "student", label: "ছাত্র রিপোর্ট", icon: "fa-user-graduate" },
  { id: "fee", label: "ফি রিপোর্ট", icon: "fa-hand-holding-usd" },
  { id: "income", label: "আয় রিপোর্ট", icon: "fa-chart-line" },
  { id: "expense", label: "খরচ রিপোর্ট", icon: "fa-file-invoice-dollar" },
  { id: "salary", label: "বেতন রিপোর্ট", icon: "fa-coins" },
  { id: "monthly", label: "মাসিক রিপোর্ট", icon: "fa-calendar-alt" },
  { id: "student-attendance", label: "ছাত্র হাজিরা", icon: "fa-clipboard-check" },
  { id: "staff-attendance", label: "স্টাফ হাজিরা", icon: "fa-user-check" },
  { id: "yearly", label: "বার্ষিক আর্থিক", icon: "fa-calendar-check" },
];

export default function Reports() {
  const { data: students = [], isLoading } = useStudents();
  const { data: payments = [] } = usePayments();
  const { data: transactions = [] } = useTransactions();
  const { data: staff = [] } = useStaff();
  const { data: salaryPayments = [] } = useSalaryPayments();
  const { data: attendance = [] } = useAttendance();
  const { data: teacherAttendance = [] } = useTeacherAttendance();
  const { data: classes = [] } = useClasses();
  const institution = useInstitutionInfo();
  const [activeTab, setActiveTab] = useState("student");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [attClassId, setAttClassId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const incomeTransactions = useMemo(() => transactions.filter(t => t.type === "income"), [transactions]);
  const expenseTransactions = useMemo(() => transactions.filter(t => t.type === "expense"), [transactions]);

  // Category breakdowns for on-screen display
  const incomeByCat = useMemo(() => {
    const map: Record<string, number> = {};
    incomeTransactions.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([cat, total]) => ({ cat, total })).sort((a, b) => b.total - a.total);
  }, [incomeTransactions]);

  const expenseByCat = useMemo(() => {
    const map: Record<string, number> = {};
    expenseTransactions.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([cat, total]) => ({ cat, total })).sort((a, b) => b.total - a.total);
  }, [expenseTransactions]);

  // Monthly data for on-screen cards
  const monthlyData = useMemo(() => {
    const incomeAmt = incomeTransactions.filter(t => t.date?.startsWith(selectedMonth)).reduce((a, t) => a + t.amount, 0);
    const expenseAmt = expenseTransactions.filter(t => t.date?.startsWith(selectedMonth)).reduce((a, t) => a + t.amount, 0);
    const feeAmt = payments.filter(p => p.payment_date?.startsWith(selectedMonth)).reduce((a, p) => a + p.amount, 0);
    const activeStudents = students.filter(s => s.status === "active").length;
    const activeStaff = staff.filter(s => s.status === "active").length;
    const monthIncomeCat: Record<string, number> = {};
    incomeTransactions.filter(t => t.date?.startsWith(selectedMonth)).forEach(t => { monthIncomeCat[t.category] = (monthIncomeCat[t.category] || 0) + t.amount; });
    const monthExpenseCat: Record<string, number> = {};
    expenseTransactions.filter(t => t.date?.startsWith(selectedMonth)).forEach(t => { monthExpenseCat[t.category] = (monthExpenseCat[t.category] || 0) + t.amount; });
    return { incomeAmt, expenseAmt, feeAmt, activeStudents, activeStaff, monthIncomeCat, monthExpenseCat };
  }, [selectedMonth, incomeTransactions, expenseTransactions, payments, students, staff]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const year = new Date().getFullYear();
    return { value: `${year}-${String(i + 1).padStart(2, '0')}`, label: `${MONTHS_BENGALI[i]} ${toBengaliNumber(year)}` };
  });

  // ── Unified print handler ──
  const handlePrint = useCallback(() => {
    let reportData;
    switch (activeTab) {
      case "student":
        reportData = buildStudentReport(institution, students);
        break;
      case "fee":
        reportData = buildFeeReport(institution, payments);
        break;
      case "income":
        reportData = buildIncomeReport(institution, incomeTransactions);
        break;
      case "expense":
        reportData = buildExpenseReport(institution, expenseTransactions);
        break;
      case "salary":
        reportData = buildSalaryReport(institution, staff);
        break;
      case "monthly":
        reportData = buildMonthlyReport(institution, selectedMonth, incomeTransactions, expenseTransactions, payments, students, staff);
        break;
      case "student-attendance":
        reportData = buildStudentAttendanceReport(institution, selectedMonth, students, attendance, classes, attClassId ?? (classes.length > 0 ? classes[0].class_id : null));
        break;
      case "staff-attendance":
        reportData = buildStaffAttendanceReport(institution, selectedMonth, staff, teacherAttendance);
        break;
      case "yearly":
        reportData = buildYearlyFinancialReport(institution, selectedYear, incomeTransactions, expenseTransactions, payments, salaryPayments);
        break;
      default:
        return;
    }
    const html = buildSingleReportHTML(reportData);
    printReceiptHTML(html, "portrait");
  }, [activeTab, institution, students, payments, incomeTransactions, expenseTransactions, staff, selectedMonth, attendance, teacherAttendance, classes, attClassId, selectedYear, salaryPayments]);

  if (isLoading) return (
    <div>
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-chart-line" style={{ marginLeft: 8 }} /> রিপোর্ট</h2>
      </div>
      <Skeleton className="h-64" style={{ borderRadius: 10 }} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}><Icon name="fa-chart-line" style={{ marginLeft: 8 }} /> রিপোর্ট</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>বিভিন্ন রিপোর্ট দেখুন ও প্রিন্ট করুন</p>
        </div>
        <button className="btn-outline-gold" onClick={handlePrint}><Icon name="fa-print" /> প্রিন্ট</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button key={tab.id} className={activeTab === tab.id ? 'btn-gold' : 'btn-outline-gold'} style={{ padding: '7px 12px', fontSize: 12, whiteSpace: 'nowrap' }} onClick={() => setActiveTab(tab.id)}>
            <Icon name={tab.icon} size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Student Report */}
      {activeTab === "student" && (
        <div>
          <div className="content-box" style={{ padding: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37' }}>ছাত্র রিপোর্ট — মোট: {toBengaliNumber(students.length)}</h3>
              <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                <span style={{ color: '#28a745' }}>সক্রিয়: {toBengaliNumber(students.filter(s => s.status === 'active').length)}</span>
                <span style={{ color: '#dc3545' }}>নিষ্ক্রিয়: {toBengaliNumber(students.filter(s => s.status !== 'active').length)}</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>আইডি</th><th>নাম</th><th>শ্রেণি</th><th>মাসিক ফি</th><th>অবস্থা</th></tr></thead>
                <tbody>{students.map((s) => (
                  <tr key={s.id}>
                    <td>{s.student_id}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.class_name}</td>
                    <td>{formatTaka(s.monthly_fee)}</td>
                    <td><span className={s.status === "active" ? "badge-success" : "badge-gold"}>{s.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fee Report */}
      {activeTab === "fee" && (
        <div>
          <div className="content-box" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4af37' }}>ফি আদায় রিপোর্ট — মোট: {formatTaka(payments.reduce((a, p) => a + p.amount, 0))}</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>তারিখ</th><th>ছাত্র আইডি</th><th>মাস</th><th>ধরন</th><th>পরিমাণ</th></tr></thead>
                <tbody>{payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.payment_date}</td>
                    <td>{p.student_id}</td>
                    <td>{p.month}</td>
                    <td>{p.fee_type}</td>
                    <td style={{ color: '#28a745', fontWeight: 600 }}>{formatTaka(p.amount)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Income Report */}
      {activeTab === "income" && <IncomeExpenseTab type="income" items={incomeTransactions} byCat={incomeByCat} color="#28a745" />}

      {/* Expense Report */}
      {activeTab === "expense" && <IncomeExpenseTab type="expense" items={expenseTransactions} byCat={expenseByCat} color="#dc3545" />}

      {/* Salary Report */}
      {activeTab === "salary" && (
        <div>
          <div className="content-box" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4af37' }}>বেতন রিপোর্ট — সক্রিয় স্টাফ: {toBengaliNumber(staff.filter(s => s.status === 'active').length)}</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>নাম</th><th>পদবী</th><th>বেতন</th><th>অবস্থা</th></tr></thead>
                <tbody>{staff.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.designation || s.role}</td>
                    <td style={{ color: '#d4af37', fontWeight: 600 }}>{formatTaka(s.salary)}</td>
                    <td><span className={s.status === "active" ? "badge-success" : "badge-gold"}>{s.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === "monthly" && (
        <MonthlyTab
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthOptions={monthOptions}
          monthlyData={monthlyData}
        />
      )}

      {/* Student Attendance Report */}
      {activeTab === "student-attendance" && (
        <StudentAttendanceTab
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthOptions={monthOptions}
          students={students}
          attendance={attendance}
          classes={classes}
          attClassId={attClassId}
          setAttClassId={setAttClassId}
        />
      )}

      {/* Staff Attendance Report */}
      {activeTab === "staff-attendance" && (
        <StaffAttendanceTab
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthOptions={monthOptions}
          staff={staff}
          teacherAttendance={teacherAttendance}
        />
      )}

      {/* Yearly Financial Report */}
      {activeTab === "yearly" && (
        <YearlyFinancialTab
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          incomeTransactions={incomeTransactions}
          expenseTransactions={expenseTransactions}
          payments={payments}
          salaryPayments={salaryPayments}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-components (kept in same file for colocation)
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IncomeExpenseTab({ type, items, byCat, color }: { type: string; items: any[]; byCat: { cat: string; total: number }[]; color: string }) {
  const isIncome = type === "income";
  const titleCat = isIncome ? "খাতওয়ারী মোট আয়" : "খাতওয়ারী মোট খরচ";
  const titleDetail = isIncome ? "আয়ের বিস্তারিত তালিকা" : "খরচের বিস্তারিত তালিকা";
  const totalLabel = isIncome ? "মোট আয়" : "মোট খরচ";
  const emptyMsg = isIncome ? "কোনো আয় নেই" : "কোনো খরচ নেই";

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="content-box">
        <h3 style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 16 }}>
          <Icon name="fa-list-ol" /> {titleCat}
        </h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {byCat.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>{emptyMsg}</p>
          ) : byCat.map((item, idx) => {
            const maxVal = byCat[0]?.total || 1;
            const pct = (item.total / maxVal) * 100;
            return (
              <div key={item.cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#d4af37', width: 24, textAlign: 'center' }}>{toBengaliNumber(idx + 1)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.cat}</span>
                    <span style={{ fontSize: 13, color, fontWeight: 700 }}>{formatTaka(item.total)}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                    <div style={{ height: '100%', background: color, borderRadius: 3, width: `${pct}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            );
          })}
          {byCat.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700 }}>{totalLabel}</span>
              <span style={{ fontWeight: 800, color, fontSize: 16 }}>{formatTaka(byCat.reduce((a, c) => a + c.total, 0))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="content-box mobile-card-list" style={{ padding: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 12 }}>{titleDetail}</h3>
        {items.length === 0 ? <p style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.4)' }}>{emptyMsg}</p> : items.map((t) => (
          <div key={t.id} className="mobile-card-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t.date}</span>
              <span style={{ fontSize: 14, color, fontWeight: 700 }}>{formatTaka(t.amount)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ background: `${color}1f`, color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t.category}</span>
              {t.description && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{t.description}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="content-box desktop-table-wrap" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37' }}>{titleDetail}</h3>
        </div>
        <table className="data-table">
          <thead><tr><th>তারিখ</th><th>খাত</th><th>বিবরণ</th><th>পরিমাণ</th></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td style={{ color }}>{t.category}</td>
                <td>{t.description}</td>
                <td style={{ color, fontWeight: 600 }}>{formatTaka(t.amount)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'rgba(255,255,255,0.4)' }}>{emptyMsg}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyTab({ selectedMonth, setSelectedMonth, monthOptions, monthlyData }: {
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  monthOptions: { value: string; label: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  monthlyData: any;
}) {
  return (
    <div>
      <div className="content-box" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>মাস নির্বাচন:</label>
          <select className="glass-select" style={{ maxWidth: 220 }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'মোট আয়', value: formatTaka(monthlyData.incomeAmt), color: '#28a745', icon: 'fa-arrow-up' },
          { label: 'মোট খরচ', value: formatTaka(monthlyData.expenseAmt), color: '#dc3545', icon: 'fa-arrow-down' },
          { label: 'ফি আদায়', value: formatTaka(monthlyData.feeAmt), color: '#d4af37', icon: 'fa-hand-holding-usd' },
          { label: 'নিট', value: formatTaka(monthlyData.incomeAmt - monthlyData.expenseAmt), color: monthlyData.incomeAmt >= monthlyData.expenseAmt ? '#28a745' : '#dc3545', icon: 'fa-balance-scale' },
          { label: 'সক্রিয় ছাত্র', value: toBengaliNumber(monthlyData.activeStudents), color: '#60a5fa', icon: 'fa-user-graduate' },
          { label: 'সক্রিয় স্টাফ', value: toBengaliNumber(monthlyData.activeStaff), color: '#a78bfa', icon: 'fa-users' },
        ].map(card => (
          <div key={card.label} className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
            <Icon name={card.icon} size={20} style={{ color: card.color, marginBottom: 6 }} />
            <p style={{ fontSize: 20, fontWeight: 800, color: card.color }}>{card.value}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{card.label}</p>
          </div>
        ))}
      </div>

      <div className="reports-monthly-grid">
        <div className="content-box">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#28a745', marginBottom: 12 }}><Icon name="fa-plus-circle" /> এই মাসের আয় (খাতওয়ারী)</h4>
          {Object.entries(monthlyData.monthIncomeCat).length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>কোনো আয় নেই</p>
            : Object.entries(monthlyData.monthIncomeCat).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, total]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13 }}>{cat}</span>
                <span style={{ fontSize: 13, color: '#28a745', fontWeight: 700 }}>{formatTaka(total as number)}</span>
              </div>
            ))
          }
          {Object.entries(monthlyData.monthIncomeCat).length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700 }}>
              <span>মোট</span>
              <span style={{ color: '#28a745' }}>{formatTaka(monthlyData.incomeAmt)}</span>
            </div>
          )}
        </div>

        <div className="content-box">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#dc3545', marginBottom: 12 }}><Icon name="fa-minus-circle" /> এই মাসের খরচ (খাতওয়ারী)</h4>
          {Object.entries(monthlyData.monthExpenseCat).length === 0
            ? <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>কোনো খরচ নেই</p>
            : Object.entries(monthlyData.monthExpenseCat).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, total]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13 }}>{cat}</span>
                <span style={{ fontSize: 13, color: '#dc3545', fontWeight: 700 }}>{formatTaka(total as number)}</span>
              </div>
            ))
          }
          {Object.entries(monthlyData.monthExpenseCat).length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700 }}>
              <span>মোট</span>
              <span style={{ color: '#dc3545' }}>{formatTaka(monthlyData.expenseAmt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StudentAttendanceTab({ selectedMonth, setSelectedMonth, monthOptions, students, attendance, classes, attClassId, setAttClassId }: {
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  monthOptions: { value: string; label: string }[];
  students: any[];
  attendance: any[];
  classes: any[];
  attClassId: number | null;
  setAttClassId: (v: number | null) => void;
}) {
  const effectiveClassId = attClassId ?? (classes.length > 0 ? classes[0].class_id : null);

  const monthlyReport = useMemo(() => {
    const activeStudents = students
      .filter((s) => s.status === "active" && (effectiveClassId ? s.class_id === effectiveClassId : true))
      .sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0));

    return activeStudents
      .map((student) => {
        const studentAtt = attendance.filter(
          (row: any) => (row.studentId === student.student_id || row.studentId === student.id) && row.date.startsWith(selectedMonth),
        );
        const presentDays = studentAtt.filter((r: any) => r.status === "present").length;
        const absentDays = studentAtt.filter((r: any) => r.status === "absent").length;
        const lateDays = studentAtt.filter((r: any) => r.status === "late").length;
        const leaveDays = studentAtt.filter((r: any) => r.status === "leave").length;
        const total = presentDays + absentDays + lateDays;
        const percentage = total > 0 ? Math.round(((presentDays + lateDays) / total) * 100) : 0;
        return { student, presentDays, absentDays, lateDays, leaveDays, percentage };
      })
      .filter((item) => item.presentDays > 0 || item.absentDays > 0 || item.lateDays > 0 || item.leaveDays > 0)
      .sort((a, b) => (Number(a.student.roll) || 0) - (Number(b.student.roll) || 0));
  }, [students, attendance, selectedMonth, effectiveClassId]);

  const selectedClassName = classes.find((c) => c.class_id === effectiveClassId)?.name || "সকল শ্রেণি";

  return (
    <div>
      <div className="content-box" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>মাস নির্বাচন</label>
          <select className="glass-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>শ্রেণি</label>
          <select className="glass-select" value={effectiveClassId ?? ""} onChange={(e) => setAttClassId(Number(e.target.value))}>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.class_id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#d4af37' }}>{toBengaliNumber(monthlyReport.length)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>হাজিরাসহ ছাত্র</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#28a745' }}>{toBengaliNumber(monthlyReport.reduce((a, r) => a + r.presentDays, 0))}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট উপস্থিত দিন</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#dc3545' }}>{toBengaliNumber(monthlyReport.reduce((a, r) => a + r.absentDays, 0))}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট অনুপস্থিত দিন</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#f97316' }}>{toBengaliNumber(monthlyReport.reduce((a, r) => a + r.lateDays, 0))}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট বিলম্বে দিন</p>
        </div>
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37' }}>
            <Icon name="fa-clipboard-check" /> ছাত্র হাজিরা — {selectedClassName}
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ক্র.নং</th>
                <th>নাম</th>
                <th>রোল</th>
                <th>উপস্থিত</th>
                <th>বিলম্বে</th>
                <th>অনুপস্থিত</th>
                <th>ছুটি</th>
                <th>শতাংশ</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReport.map((item, idx) => (
                <tr key={item.student.student_id}>
                  <td>{toBengaliNumber(idx + 1)}</td>
                  <td style={{ fontWeight: 600 }}>{item.student.name}</td>
                  <td>{toBengaliNumber(item.student.roll || "—")}</td>
                  <td style={{ color: '#28a745', fontWeight: 700 }}>{toBengaliNumber(item.presentDays)}</td>
                  <td style={{ color: '#f97316', fontWeight: 700 }}>{toBengaliNumber(item.lateDays)}</td>
                  <td style={{ color: '#dc3545', fontWeight: 700 }}>{toBengaliNumber(item.absentDays)}</td>
                  <td style={{ color: '#6366f1', fontWeight: 700 }}>{toBengaliNumber(item.leaveDays)}</td>
                  <td>
                    <span style={{ color: item.percentage >= 75 ? '#28a745' : item.percentage >= 50 ? '#d4af37' : '#dc3545', fontWeight: 700 }}>
                      {toBengaliNumber(item.percentage)}%
                    </span>
                  </td>
                </tr>
              ))}
              {monthlyReport.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.4)' }}>
                    নির্বাচিত মাসে কোনো ছাত্র হাজিরা ডাটা পাওয়া যায়নি
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StaffAttendanceTab({ selectedMonth, setSelectedMonth, monthOptions, staff, teacherAttendance }: {
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  monthOptions: { value: string; label: string }[];
  staff: any[];
  teacherAttendance: any[];
}) {
  const activeStaff = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);

  const monthlyReport = useMemo(() => {
    return activeStaff
      .map((member) => {
        const staffAtt = teacherAttendance.filter(
          (row: any) => row.staffId === member.id && row.date.startsWith(selectedMonth),
        );
        const presentDays = staffAtt.filter((r: any) => r.status === "present").length;
        const absentDays = staffAtt.filter((r: any) => r.status === "absent").length;
        const total = presentDays + absentDays;
        const percentage = total > 0 ? Math.round((presentDays / total) * 100) : 0;
        return { member, presentDays, absentDays, percentage };
      })
      .filter((item) => item.presentDays > 0 || item.absentDays > 0)
      .sort((a, b) => b.absentDays - a.absentDays || a.member.name.localeCompare(b.member.name));
  }, [activeStaff, teacherAttendance, selectedMonth]);

  return (
    <div>
      <div className="content-box" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>মাস নির্বাচন</label>
          <select className="glass-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#d4af37' }}>{toBengaliNumber(activeStaff.length)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>সক্রিয় স্টাফ</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#28a745' }}>{toBengaliNumber(monthlyReport.reduce((a, r) => a + r.presentDays, 0))}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট উপস্থিত দিন</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#dc3545' }}>{toBengaliNumber(monthlyReport.reduce((a, r) => a + r.absentDays, 0))}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট অনুপস্থিত দিন</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}>{toBengaliNumber(monthlyReport.length)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>হাজিরাসহ স্টাফ</p>
        </div>
      </div>

      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37' }}>
            <Icon name="fa-user-check" /> স্টাফ হাজিরা রিপোর্ট
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ক্র.নং</th>
                <th>নাম</th>
                <th>পদবী</th>
                <th>উপস্থিত</th>
                <th>অনুপস্থিত</th>
                <th>শতাংশ</th>
              </tr>
            </thead>
            <tbody>
              {monthlyReport.map((item, idx) => (
                <tr key={item.member.id}>
                  <td>{toBengaliNumber(idx + 1)}</td>
                  <td style={{ fontWeight: 600 }}>{item.member.name}</td>
                  <td>{item.member.designation || item.member.role || "স্টাফ"}</td>
                  <td style={{ color: '#28a745', fontWeight: 700 }}>{toBengaliNumber(item.presentDays)}</td>
                  <td style={{ color: '#dc3545', fontWeight: 700 }}>{toBengaliNumber(item.absentDays)}</td>
                  <td>
                    <span style={{ color: item.percentage >= 75 ? '#28a745' : item.percentage >= 50 ? '#d4af37' : '#dc3545', fontWeight: 700 }}>
                      {toBengaliNumber(item.percentage)}%
                    </span>
                  </td>
                </tr>
              ))}
              {monthlyReport.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.4)' }}>
                    নির্বাচিত মাসে কোনো স্টাফ হাজিরা ডাটা পাওয়া যায়নি
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function YearlyFinancialTab({ selectedYear, setSelectedYear, incomeTransactions, expenseTransactions, payments, salaryPayments }: {
  selectedYear: number;
  setSelectedYear: (v: number) => void;
  incomeTransactions: any[];
  expenseTransactions: any[];
  payments: any[];
  salaryPayments: any[];
}) {
  const yearStr = String(selectedYear);

  const yearlyData = useMemo(() => {
    const yearIncome = incomeTransactions.filter((t) => t.date?.startsWith(yearStr));
    const yearExpense = expenseTransactions.filter((t) => t.date?.startsWith(yearStr));
    const yearFee = payments.filter((p) => p.payment_date?.startsWith(yearStr));
    const yearSalary = salaryPayments.filter((s: any) => s.year === selectedYear);

    const totalIncome = yearIncome.reduce((a: number, t: any) => a + t.amount, 0);
    const totalExpense = yearExpense.reduce((a: number, t: any) => a + t.amount, 0);
    const totalFee = yearFee.reduce((a: number, p: any) => a + p.amount, 0);
    const totalSalary = yearSalary.reduce((a: number, s: any) => a + (s.netPayable || s.amount || 0), 0);
    const net = totalIncome - totalExpense;

    const incomeCat: Record<string, number> = {};
    yearIncome.forEach((t) => { incomeCat[t.category] = (incomeCat[t.category] || 0) + t.amount; });
    const expenseCat: Record<string, number> = {};
    yearExpense.forEach((t) => { expenseCat[t.category] = (expenseCat[t.category] || 0) + t.amount; });

    const monthly = MONTHS_BENGALI.map((name, idx) => {
      const prefix = `${yearStr}-${String(idx + 1).padStart(2, "0")}`;
      const mIncome = yearIncome.filter((t) => t.date?.startsWith(prefix)).reduce((a: number, t: any) => a + t.amount, 0);
      const mExpense = yearExpense.filter((t) => t.date?.startsWith(prefix)).reduce((a: number, t: any) => a + t.amount, 0);
      const mFee = yearFee.filter((p) => p.payment_date?.startsWith(prefix)).reduce((a: number, p: any) => a + p.amount, 0);
      return { name, mIncome, mExpense, mFee, mNet: mIncome - mExpense };
    });

    return { totalIncome, totalExpense, totalFee, totalSalary, net, incomeCat, expenseCat, monthly };
  }, [incomeTransactions, expenseTransactions, payments, salaryPayments, yearStr, selectedYear]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: toBengaliNumber(y) };
  });

  return (
    <div>
      {/* Year Selector */}
      <div className="content-box" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>বছর নির্বাচন:</label>
          <select className="glass-select" style={{ maxWidth: 160 }} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {yearOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { label: "মোট আয়", value: formatTaka(yearlyData.totalIncome), color: "#28a745", icon: "fa-arrow-up" },
          { label: "মোট খরচ", value: formatTaka(yearlyData.totalExpense), color: "#dc3545", icon: "fa-arrow-down" },
          { label: "ফি আদায়", value: formatTaka(yearlyData.totalFee), color: "#d4af37", icon: "fa-hand-holding-usd" },
          { label: "বেতন পরিশোধ", value: formatTaka(yearlyData.totalSalary), color: "#a78bfa", icon: "fa-money-bill-wave" },
          { label: yearlyData.net >= 0 ? "নিট লাভ" : "নিট ক্ষতি", value: formatTaka(Math.abs(yearlyData.net)), color: yearlyData.net >= 0 ? "#28a745" : "#dc3545", icon: "fa-balance-scale" },
        ].map((card) => (
          <div key={card.label} className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
            <Icon name={card.icon} size={20} style={{ color: card.color, marginBottom: 6 }} />
            <p style={{ fontSize: 20, fontWeight: 800, color: card.color }}>{card.value}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{card.label}</p>
          </div>
        ))}
      </div>

      {/* Profit/Loss Banner */}
      <div className="content-box" style={{
        padding: 20, marginBottom: 16, textAlign: "center",
        background: yearlyData.net >= 0 ? "rgba(40,167,69,0.08)" : "rgba(220,53,69,0.08)",
        border: `1px solid ${yearlyData.net >= 0 ? "rgba(40,167,69,0.25)" : "rgba(220,53,69,0.25)"}`,
      }}>
        <Icon name="fa-chart-line" size={28} style={{ color: yearlyData.net >= 0 ? "#28a745" : "#dc3545", marginBottom: 8 }} />
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
          {toBengaliNumber(selectedYear)} সালের {yearlyData.net >= 0 ? "লাভ" : "ক্ষতি"}
        </p>
        <p style={{ fontSize: 32, fontWeight: 900, color: yearlyData.net >= 0 ? "#28a745" : "#dc3545" }}>
          {formatTaka(Math.abs(yearlyData.net))}
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          মোট আয় {formatTaka(yearlyData.totalIncome)} — মোট খরচ {formatTaka(yearlyData.totalExpense)}
        </p>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="content-box" style={{ padding: 0, marginBottom: 16 }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#d4af37" }}><Icon name="fa-table" /> মাসভিত্তিক সারসংক্ষেপ</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>মাস</th>
                <th>আয়</th>
                <th>খরচ</th>
                <th>ফি আদায়</th>
                <th>নিট</th>
              </tr>
            </thead>
            <tbody>
              {yearlyData.monthly.map((m) => (
                <tr key={m.name}>
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td style={{ color: "#28a745", fontWeight: 600 }}>{formatTaka(m.mIncome)}</td>
                  <td style={{ color: "#dc3545", fontWeight: 600 }}>{formatTaka(m.mExpense)}</td>
                  <td style={{ color: "#d4af37", fontWeight: 600 }}>{formatTaka(m.mFee)}</td>
                  <td style={{ color: m.mNet >= 0 ? "#28a745" : "#dc3545", fontWeight: 700 }}>{formatTaka(m.mNet)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid rgba(212,175,55,0.3)" }}>
                <td style={{ fontWeight: 800, color: "#d4af37" }}>মোট</td>
                <td style={{ color: "#28a745", fontWeight: 800 }}>{formatTaka(yearlyData.totalIncome)}</td>
                <td style={{ color: "#dc3545", fontWeight: 800 }}>{formatTaka(yearlyData.totalExpense)}</td>
                <td style={{ color: "#d4af37", fontWeight: 800 }}>{formatTaka(yearlyData.totalFee)}</td>
                <td style={{ color: yearlyData.net >= 0 ? "#28a745" : "#dc3545", fontWeight: 800 }}>{formatTaka(yearlyData.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="reports-monthly-grid">
        <div className="content-box">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#28a745", marginBottom: 12 }}>
            <Icon name="fa-plus-circle" /> বার্ষিক আয় (খাতওয়ারী)
          </h4>
          {Object.entries(yearlyData.incomeCat).length === 0
            ? <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>কোনো আয় নেই</p>
            : Object.entries(yearlyData.incomeCat).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, total]) => {
                const maxVal = Math.max(...Object.values(yearlyData.incomeCat));
                const pct = maxVal > 0 ? ((total as number) / maxVal) * 100 : 0;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{cat}</span>
                      <span style={{ fontSize: 13, color: "#28a745", fontWeight: 700 }}>{formatTaka(total as number)}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                      <div style={{ height: "100%", background: "#28a745", borderRadius: 3, width: `${pct}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })
          }
          {Object.entries(yearlyData.incomeCat).length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, fontWeight: 700, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span>মোট</span>
              <span style={{ color: "#28a745" }}>{formatTaka(yearlyData.totalIncome)}</span>
            </div>
          )}
        </div>

        <div className="content-box">
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#dc3545", marginBottom: 12 }}>
            <Icon name="fa-minus-circle" /> বার্ষিক খরচ (খাতওয়ারী)
          </h4>
          {Object.entries(yearlyData.expenseCat).length === 0
            ? <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>কোনো খরচ নেই</p>
            : Object.entries(yearlyData.expenseCat).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, total]) => {
                const maxVal = Math.max(...Object.values(yearlyData.expenseCat));
                const pct = maxVal > 0 ? ((total as number) / maxVal) * 100 : 0;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{cat}</span>
                      <span style={{ fontSize: 13, color: "#dc3545", fontWeight: 700 }}>{formatTaka(total as number)}</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                      <div style={{ height: "100%", background: "#dc3545", borderRadius: 3, width: `${pct}%`, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })
          }
          {Object.entries(yearlyData.expenseCat).length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, fontWeight: 700, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <span>মোট</span>
              <span style={{ color: "#dc3545" }}>{formatTaka(yearlyData.totalExpense)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
