import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useTransactions } from "@/hooks/useTransactions";
import { useStaff } from "@/hooks/useStaff";
import { useNotices } from "@/hooks/useNotices";
import { useAttendance } from "@/hooks/useAttendance";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend, Area, AreaChart,
} from "recharts";
import { useClasses } from "@/hooks/useClasses";
import Icon from "@/components/Icon";
import DataSectionSkeleton from "@/components/DataSectionSkeleton";

const CATEGORY_COLORS = ['#d4af37','#34d399','#f87171','#60a5fa','#fbbf24','#a855f7','#f97316','#ec4899','#14b8a6','#84cc16'];

const tooltipStyle = {
  background: 'var(--th-card-bg)',
  border: '1px solid rgba(var(--th-accent-rgb), 0.3)',
  borderRadius: 10,
  color: 'var(--th-text)',
  fontSize: 12,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: transactions = [], isLoading: loadingTransactions } = useTransactions();
  const { data: staff = [], isLoading: loadingStaff } = useStaff();
  const { data: notices = [], isLoading: loadingNotices } = useNotices();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: attendance = [], isLoading: loadingAttendance } = useAttendance();

  const isLoading = loadingStudents || loadingPayments || loadingTransactions || loadingStaff || loadingNotices || loadingClasses || loadingAttendance;

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === "active").length;
  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const totalCollected = payments.reduce((a, p) => a + p.amount, 0);
  const totalSalaryDue = staff.filter(s => s.status === "active").reduce((a, s) => a + s.salary, 0);
  const balance = totalIncome - totalExpense;

  const totalExpectedFees = students.filter(s => s.status === 'active').reduce((sum, s) => {
    const now = new Date();
    const startStr = s.admission_date && s.admission_date.trim() ? s.admission_date : `${now.getFullYear()}-01-01`;
    const start = new Date(startStr);
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
    return sum + (s.monthly_fee * Math.max(0, months));
  }, 0);
  const totalDueFees = Math.max(0, totalExpectedFees - totalCollected);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === today);
  const todayPresent = todayAttendance.filter(a => a.status === 'present' || a.status === 'উপস্থিত').length;

  const summaryCards = [
    { label: "মোট ছাত্র", value: toBengaliNumber(totalStudents), sub: `সক্রিয়: ${toBengaliNumber(activeStudents)}`, icon: "fa-users", color: "#d4af37", bg: "rgba(212,175,55,0.15)" },
    { label: "আজকের হাজিরা", value: toBengaliNumber(todayPresent), sub: `${toBengaliNumber(activeStudents)} জনের মধ্যে`, icon: "fa-clipboard-check", color: "#60a5fa", bg: "rgba(59,130,246,0.15)" },
    { label: "মোট আয়", value: formatTaka(totalIncome), sub: "সকল উৎস", icon: "fa-chart-line", color: "#34d399", bg: "rgba(52,211,153,0.15)" },
    { label: "মোট খরচ", value: formatTaka(totalExpense), sub: "সকল খাত", icon: "fa-arrow-down", color: "#f87171", bg: "rgba(248,113,113,0.15)" },
    { label: "বকেয়া ফি", value: formatTaka(totalDueFees > 0 ? totalDueFees : 0), sub: "ছাত্রদের বকেয়া", icon: "fa-exclamation-circle", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
    { label: "ব্যালেন্স", value: formatTaka(balance), sub: balance >= 0 ? "উদ্বৃত্ত" : "ঘাটতি", icon: "fa-money-bill-wave", color: balance >= 0 ? "#d4af37" : "#f87171", bg: balance >= 0 ? "rgba(212,175,55,0.15)" : "rgba(248,113,113,0.15)" },
  ];

  const quickActions = [
    { label: 'ফি আদায়', icon: 'fa-hand-holding-usd', route: '/fees', color: '#d4af37' },
    { label: 'ছাত্র হাজিরা', icon: 'fa-clipboard-check', route: '/student-attendance', color: '#60a5fa' },
    { label: 'স্টাফ হাজিরা', icon: 'fa-user-check', route: '/attendance', color: '#34d399' },
    { label: 'নতুন ভর্তি', icon: 'fa-user-plus', route: '/students/new', color: '#a855f7' },
    { label: 'নোটিশ', icon: 'fa-bullhorn', route: '/notices', color: '#f97316' },
    { label: 'রিপোর্ট', icon: 'fa-chart-line', route: '/reports', color: '#ec4899' },
  ];

  const classData = classes.map(c => ({ name: c.name, students: students.filter(s => s.class_id === c.class_id).length }));
  const pieData = [
    { name: "আয়", value: totalIncome || 1, color: "#34d399" },
    { name: "ব্যয়", value: totalExpense || 1, color: "#f87171" },
  ];

  const monthlyFinanceData = (() => {
    const months: { month: string; income: number; expense: number; profit: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = MONTHS_BENGALI[d.getMonth()].slice(0, 3);
      const inc = transactions.filter(t => t.type === 'income' && t.date?.startsWith(yearMonth)).reduce((s, t) => s + t.amount, 0);
      const exp = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(yearMonth)).reduce((s, t) => s + t.amount, 0);
      months.push({ month: monthLabel, income: inc, expense: exp, profit: inc - exp });
    }
    return months;
  })();

  const incomeCategoryData = (() => {
    const m: Record<string, number> = {};
    transactions.filter(t => t.type === 'income').forEach(t => { m[t.category || 'অন্যান্য'] = (m[t.category || 'অন্যান্য'] || 0) + t.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  const expenseCategoryData = (() => {
    const m: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => { m[t.category || 'অন্যান্য'] = (m[t.category || 'অন্যান্য'] || 0) + t.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  })();

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <h2 style={{ fontSize: 20, fontWeight: 700 }} className="page-heading-accent">
          <Icon name="fa-tachometer-alt" style={{ marginLeft: 8 }} /> ড্যাশবোর্ড
        </h2>
        <p className="page-subtitle">মাদ্রাসার সামগ্রিক অবস্থা</p>
      </div>

      {isLoading ? (
        <DataSectionSkeleton rows={5} columns={4} cards={4} />
      ) : (
        <>
          {/* ── ১. Summary Cards — Mobile: 2-col grid, Desktop: horizontal scroll ── */}
          <div className="dash-cards-grid">
            {summaryCards.map((card, i) => (
              <div key={i} className="dash-stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="dash-stat-icon" style={{ background: card.bg }}>
                  <Icon name={card.icon} size={18} style={{ color: card.color }} />
                </div>
                <div className="dash-stat-body">
                  <p className="dash-stat-label">{card.label}</p>
                  <p className="dash-stat-value" style={{ color: card.color }}>{card.value}</p>
                  <p className="dash-stat-sub">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── ২. Quick Actions — Mobile 3x2, Desktop flex ── */}
          <div className="content-box" style={{ marginBottom: 16 }}>
            <h3 className="section-heading" style={{ marginBottom: 12, fontSize: 14 }}>
              <Icon name="fa-bolt" /> কুইক অ্যাক্সেস
            </h3>
            <div className="dash-quick-grid">
              {quickActions.map(item => (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className="dash-quick-btn"
                  style={{ '--qa-color': item.color } as React.CSSProperties}
                >
                  <Icon name={item.icon} size={20} style={{ color: item.color }} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── ৩. Profit/Loss ── */}
          <div className="content-box" style={{ marginBottom: 16 }}>
            <h3 className="section-heading" style={{ marginBottom: 12, fontSize: 14 }}>
              <Icon name="fa-balance-scale" /> আর্থিক সারসংক্ষেপ
            </h3>
            <div className="dash-finance-grid">
              <div className="dash-finance-item" style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>মোট আয়</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#34d399', margin: 0 }}>{formatTaka(totalIncome)}</p>
              </div>
              <div className="dash-finance-item" style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>মোট খরচ</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#f87171', margin: 0 }}>{formatTaka(totalExpense)}</p>
              </div>
              <div className="dash-finance-item" style={{ background: balance >= 0 ? 'rgba(212,175,55,0.08)' : 'rgba(248,113,113,0.08)', borderColor: balance >= 0 ? 'rgba(212,175,55,0.2)' : 'rgba(248,113,113,0.2)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>{balance >= 0 ? 'নিট লাভ' : 'নিট ক্ষতি'}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: balance >= 0 ? '#d4af37' : '#f87171', margin: 0 }}>{formatTaka(Math.abs(balance))}</p>
              </div>
              <div className="dash-finance-item" style={{ background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>মাসিক বেতন</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa', margin: 0 }}>{formatTaka(totalSalaryDue)}</p>
              </div>
            </div>
          </div>

          {/* ── ৪. Monthly Chart ── */}
          <div className="content-box" style={{ marginBottom: 16 }}>
            <h3 className="section-heading" style={{ marginBottom: 12, fontSize: 14 }}>
              <Icon name="fa-chart-line" /> মাসিক আয়-ব্যয় (১২ মাস)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyFinanceData}>
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)"/>
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}/>
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={35}/>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`৳${v.toLocaleString('en-IN')}`, '']}/>
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}/>
                <Area type="monotone" dataKey="income" name="আয়" stroke="#34d399" fill="url(#ig)" strokeWidth={2}/>
                <Area type="monotone" dataKey="expense" name="ব্যয়" stroke="#f87171" fill="url(#eg)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── ৫. Class + Pie side by side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="content-box">
              <h3 className="section-heading" style={{ marginBottom: 12, fontSize: 13 }}>শ্রেণি অনুযায়ী ছাত্র</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={classData}>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}/>
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}/>
                  <Tooltip contentStyle={tooltipStyle}/>
                  <Bar dataKey="students" fill="#d4af37" radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="content-box">
              <h3 className="section-heading" style={{ marginBottom: 12, fontSize: 13 }}>আয় বনাম ব্যয়</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({name}) => name}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── ৬. Category breakdown (desktop only scrollable on mobile) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
            {incomeCategoryData.length > 0 && (
              <div className="content-box">
                <h3 className="section-heading" style={{ marginBottom: 10, fontSize: 13, color: '#34d399' }}>
                  <Icon name="fa-chart-pie"/> আয়ের খাত
                </h3>
                <CategoryLegend data={incomeCategoryData} accentColor="#34d399"/>
              </div>
            )}
            {expenseCategoryData.length > 0 && (
              <div className="content-box">
                <h3 className="section-heading" style={{ marginBottom: 10, fontSize: 13, color: '#f87171' }}>
                  <Icon name="fa-chart-pie"/> খরচের খাত
                </h3>
                <CategoryLegend data={expenseCategoryData} accentColor="#f87171"/>
              </div>
            )}
          </div>

          {/* ── ৭. Recent transactions ── */}
          <div className="content-box" style={{ padding: 0, marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
              <h3 className="section-heading" style={{ fontSize: 13 }}>
                <Icon name="fa-exchange-alt" style={{ marginLeft: 8 }}/> সাম্প্রতিক লেনদেন
              </h3>
            </div>
            <div className="mobile-scroll">
              <table className="data-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr><th>তারিখ</th><th>বিবরণ</th><th>ধরন</th><th>পরিমাণ</th></tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map(t => (
                    <tr key={t.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{t.date}</td>
                      <td style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                      <td><span className={t.type === "income" ? "badge-success" : "badge-gold"}>{t.type === "income" ? "আয়" : "ব্যয়"}</span></td>
                      <td style={{ fontWeight: 700, color: t.type === "income" ? '#34d399' : '#f87171', whiteSpace: 'nowrap' }}>
                        {t.type === "income" ? '+' : '-'}{formatTaka(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.4)' }}>
                      <Icon name="fa-inbox" size={24} style={{ display: 'block', margin: '0 auto 8px' }}/> কোনো লেনদেন নেই
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── ৮. Notices ── */}
          {notices.length > 0 && (
            <div className="content-box" style={{ marginBottom: 16 }}>
              <h3 className="section-heading" style={{ marginBottom: 10, fontSize: 13 }}>
                <Icon name="fa-bell"/> গুরুত্বপূর্ণ নোটিশ
              </h3>
              {notices.slice(0, 3).map(n => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: n.priority === "high" ? '#f87171' : '#60a5fa' }}/>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, wordBreak: 'break-word' }}>{n.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, wordBreak: 'break-word' }}>{n.content}</p>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0, whiteSpace: 'nowrap' }}>{n.date}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CategoryLegend({ data, accentColor }: { data: { name: string; value: number }[]; accentColor: string }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      {data.slice(0, 6).map((cat, i) => (
        <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: CATEGORY_COLORS[i % CATEGORY_COLORS.length], flexShrink: 0 }}/>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{cat.name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>{formatTaka(cat.value)}</span>
        </div>
      ))}
    </div>
  );
}
