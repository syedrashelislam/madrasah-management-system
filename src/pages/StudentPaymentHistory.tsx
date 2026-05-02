import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useClasses } from "@/hooks/useClasses";
import { useStudentExpenses } from "@/hooks/useStudentExpenses";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { generateMonthsFromAdmission, printReceipt, buildReceiptDataForPayment } from "./payment-history/helpers";
import { emailReceipt, isValidEmail } from "@/lib/emailReceipt";

const gold = "#d4af37";
const muted = "rgba(255,255,255,0.5)";

export default function StudentPaymentHistory() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: payments = [] } = usePayments();
  const { data: classes = [] } = useClasses();
  const { data: expenses = [] } = useStudentExpenses();
  const institution = useInstitutionInfo();

  const [classFilter, setClassFilter] = useState<number | "">(""); 
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [emailingId, setEmailingId] = useState<string | null>(null);

  const filteredStudents = useMemo(() =>
    students
      .filter(s => s.status === "active")
      .filter(s => classFilter === "" || s.class_id === classFilter)
      .filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q);
      }),
    [students, classFilter, search]
  );

  const student = useMemo(() => students.find(s => s.student_id === selectedId), [students, selectedId]);

  const studentPayments = useMemo(
    () => payments.filter(p => p.student_id === selectedId).sort((a, b) => b.payment_date.localeCompare(a.payment_date)),
    [payments, selectedId]
  );

  const studentExpenses = useMemo(
    () => expenses.filter(e => e.studentId === selectedId),
    [expenses, selectedId]
  );

  const allMonths = useMemo(
    () => student ? generateMonthsFromAdmission(student.admission_date) : [],
    [student]
  );

  const { totalExpected, admissionFee, totalPaid, totalExpenseAmt, totalDue, paidMonthSet, monthPaymentMap } = useMemo(() => {
    if (!student) return { totalExpected: 0, admissionFee: 0, totalPaid: 0, totalExpenseAmt: 0, totalDue: 0, paidMonthSet: new Set<string>(), monthPaymentMap: new Map() };
    
    const expected = allMonths.length * student.monthly_fee;
    const adm = student.admission_fee || 0;
    
    // Separate payments by type
    const monthlyPayments = studentPayments.filter(p => !p.month.startsWith("EXP:") && p.month !== "ভর্তি ফি" && p.fee_type !== "Admission");
    const admissionPayments = studentPayments.filter(p => p.fee_type === "Admission" || p.month === "ভর্তি ফি");
    const expensePayments = studentPayments.filter(p => p.month.startsWith("EXP:"));
    
    const monthlyPaid = monthlyPayments.reduce((s, p) => s + p.amount, 0);
    const admissionPaid = admissionPayments.reduce((s, p) => s + p.amount, 0);
    const expensePaid = expensePayments.reduce((s, p) => s + p.amount, 0);
    
    const totalPaidAll = studentPayments.reduce((s, p) => s + p.amount, 0);
    const exp = studentExpenses.reduce((s, e) => s + e.amount, 0);
    
    const monthlyDue = Math.max(0, expected - monthlyPaid);
    const admissionDue = Math.max(0, adm - admissionPaid);
    const expenseDue = Math.max(0, exp - expensePaid);
    const due = monthlyDue + admissionDue + expenseDue;
    
    const pms = new Set(monthlyPayments.map(p => p.month));
    const mpm = new Map<string, typeof studentPayments>();
    studentPayments.forEach(p => {
      const arr = mpm.get(p.month) || [];
      arr.push(p);
      mpm.set(p.month, arr);
    });
    return { totalExpected: expected, admissionFee: adm, totalPaid: totalPaidAll, totalExpenseAmt: exp, totalDue: due, paidMonthSet: pms, monthPaymentMap: mpm };
  }, [student, allMonths, studentPayments, studentExpenses]);

  const handleEmailReceipt = async (p: typeof studentPayments[0]) => {
    if (!student) return;
    const recipientEmail = student.guardian_email || "";
    if (!recipientEmail) {
      toast.error("এই ছাত্রের অভিভাবকের ইমেইল নেই। ছাত্র প্রোফাইলে অভিভাবকের ইমেইল যোগ করুন।");
      return;
    }
    if (!isValidEmail(recipientEmail)) {
      toast.error(`"${recipientEmail}" একটি বৈধ ইমেইল নয়। ছাত্র প্রোফাইলে সঠিক ইমেইল (যেমন: name@example.com) যোগ করুন।`);
      return;
    }
    setEmailingId(p.id);
    try {
      const receiptData = buildReceiptDataForPayment(p, student, institution, studentPayments);
      const result = await emailReceipt(recipientEmail, receiptData);
      if (result.success) {
        toast.success(`ইমেইল ক্লায়েন্ট খোলা হয়েছে — ${recipientEmail} এ রসিদ পাঠান`);
      } else {
        toast.error(result.error || "ইমেইল পাঠানো ব্যর্থ হয়েছে");
      }
    } catch {
      toast.error("ইমেইল পাঠানো ব্যর্থ হয়েছে");
    } finally {
      setEmailingId(null);
    }
  };

  const photoSrc = student?.photo_url || (student ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=1a7a4f&textColor=ffffff` : "");

  const summaryCards = student ? [
    { label: "মোট প্রত্যাশিত ফি", value: formatTaka(totalExpected), color: gold, sub: `${toBengaliNumber(allMonths.length)} মাস`, icon: "fa-file-invoice-dollar" },
    { label: "ভর্তি ফি", value: formatTaka(admissionFee), color: "#ffc107", icon: "fa-coins" },
    { label: "মোট পরিশোধ", value: formatTaka(totalPaid), color: "#28a745", icon: "fa-hand-holding-usd" },
    { label: "অন্যান্য খরচ", value: formatTaka(totalExpenseAmt), color: "#ff9800", icon: "fa-money-bill-wave" },
    { label: "মোট বকেয়া", value: formatTaka(Math.max(0, totalDue)), color: totalDue > 0 ? "#dc3545" : "#28a745", icon: "fa-exclamation-circle" },
  ] : [];

  if (loadingStudents) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton className="h-8 w-60" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: gold }}>
          <Icon name="fa-history" style={{ marginLeft: 8 }} /> ছাত্র পেমেন্ট ইতিহাস
        </h2>
        <p style={{ color: muted, fontSize: 14, marginTop: 4 }}>ছাত্র নির্বাচন করে বিস্তারিত পেমেন্ট তথ্য দেখুন</p>
      </div>

      {/* Selection Filters */}
      <div className="content-box" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 12, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 4 }}>শ্রেণি নির্বাচন</label>
          <select className="glass-select" value={classFilter} onChange={e => { setClassFilter(e.target.value === "" ? "" : Number(e.target.value)); setSelectedId(""); }}>
            <option value="">সকল শ্রেণি</option>
            {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 4 }}>নাম/আইডি দিয়ে খুঁজুন</label>
          <input className="glass-input" placeholder="নাম বা আইডি লিখুন..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: muted, display: "block", marginBottom: 4 }}>ছাত্র নির্বাচন</label>
          <select className="glass-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">-- ছাত্র নির্বাচন করুন --</option>
            {filteredStudents.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
          </select>
        </div>
      </div>

      {!student && (
        <div className="content-box" style={{ textAlign: "center", padding: 60 }}>
          <Icon name="fa-user-graduate" size={48} style={{ color: "rgba(212,175,55,0.3)" }} />
          <p style={{ color: muted, marginTop: 12, fontSize: 15 }}>উপরে থেকে একজন ছাত্র নির্বাচন করুন</p>
        </div>
      )}

      {student && (
        <>
          {/* Student Info Card */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 20, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <img src={photoSrc} alt={student.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", border: `2px solid ${gold}` }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{student.name}</h3>
              <p style={{ fontSize: 13, color: muted }}>{student.student_id} • {student.class_name}</p>
              <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
                {[
                  { l: "অভিভাবক", v: student.guardian_name },
                  { l: "ফোন", v: student.guardian_phone },
                  { l: "ভর্তি", v: student.admission_date },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                    <span style={{ color: gold }}>{item.l}:</span> {item.v || "—"}
                  </span>
                ))}
              </div>
            </div>
            <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: student.status === "active" ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)", color: student.status === "active" ? "#28a745" : "#dc3545" }}>
              {student.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
          </div>

          {/* Financial Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            {summaryCards.map((c, i) => (
              <div key={i} className="summary-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="icon-box" style={{ background: `${c.color}20`, color: c.color }}>
                  <Icon name={c.icon} size={24} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: muted }}>{c.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</p>
                  {c.sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{c.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Month-by-Month Reconciliation */}
          <div className="content-box">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 14 }}>
              <Icon name="fa-calendar-alt" style={{ marginLeft: 6 }} /> মাসভিত্তিক হিসাব
            </h3>
            <div className="mobile-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>মাস</th>
                    <th>প্রত্যাশিত</th>
                    <th>পরিশোধিত</th>
                    <th>অবস্থা</th>
                    <th>তারিখ</th>
                    <th>পদ্ধতি</th>
                  </tr>
                </thead>
                <tbody>
                  {allMonths.map(m => {
                    const pArr = monthPaymentMap.get(m) || [];
                    const paidAmt = pArr.reduce((s, p) => s + p.amount, 0);
                    const isPaid = paidMonthSet.has(m);
                    return (
                      <tr key={m}>
                        <td style={{ fontWeight: 600 }}>{m}</td>
                        <td>{formatTaka(student.monthly_fee)}</td>
                        <td style={{ color: isPaid ? "#28a745" : "#dc3545", fontWeight: 600 }}>{isPaid ? formatTaka(paidAmt) : "—"}</td>
                        <td>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: isPaid ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)", color: isPaid ? "#28a745" : "#dc3545" }}>
                            {isPaid ? "পরিশোধিত" : "বকেয়া"}
                          </span>
                        </td>
                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{pArr[0]?.payment_date || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{pArr[0]?.method || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {allMonths.length === 0 && <p style={{ textAlign: "center", color: muted, padding: 20 }}>কোনো মাস পাওয়া যায়নি</p>}
          </div>

          {/* Payment History Table */}
          <div className="content-box">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 14 }}>
              <Icon name="fa-money-check-alt" style={{ marginLeft: 6 }} /> পেমেন্ট ইতিহাস
            </h3>
            {studentPayments.length === 0 ? (
              <p style={{ textAlign: "center", color: muted, padding: 30 }}>কোনো পেমেন্ট পাওয়া যায়নি</p>
            ) : (
              <div className="mobile-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>রসিদ নং</th>
                      <th>মাস/বিবরণ</th>
                      <th>তারিখ</th>
                      <th>পরিমাণ</th>
                      <th>পদ্ধতি</th>
                      <th>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPayments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.receipt_no || p.id.slice(0, 8)}</td>
                        <td>{p.month}</td>
                        <td>{p.payment_date}</td>
                        <td style={{ color: "#28a745", fontWeight: 700 }}>{formatTaka(p.amount)}</td>
                        <td>{p.method}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <button className="btn-outline-gold" style={{ padding: "4px 12px", fontSize: 12 }} onClick={() => printReceipt(p, student, institution, studentPayments)}>
                              <Icon name="fa-print" size={13} /> প্রিন্ট
                            </button>
                            <button
                              className="btn-outline-gold"
                              style={{ padding: "4px 12px", fontSize: 12, opacity: emailingId === p.id ? 0.6 : 1 }}
                              disabled={emailingId === p.id}
                              onClick={() => handleEmailReceipt(p)}
                            >
                              <Icon name="fa-envelope" size={13} /> {emailingId === p.id ? "পাঠানো হচ্ছে..." : "ইমেইল"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Expense Reconciliation */}
          <div className="content-box">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 14 }}>
              <Icon name="fa-coins" style={{ marginLeft: 6 }} /> অন্যান্য খরচ
            </h3>
            {studentExpenses.length === 0 ? (
              <p style={{ textAlign: "center", color: muted, padding: 30 }}>কোনো অন্যান্য খরচ নেই</p>
            ) : (
              <div className="mobile-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>বিবরণ</th>
                      <th>তারিখ</th>
                      <th>পরিমাণ</th>
                      <th>অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentExpenses.map(exp => {
                      const expPaid = studentPayments.some(p => p.month === `EXP: ${exp.description}` && p.amount === exp.amount);
                      return (
                        <tr key={exp.id}>
                          <td style={{ fontWeight: 600 }}>{exp.description}</td>
                          <td style={{ color: "rgba(255,255,255,0.6)" }}>{exp.date}</td>
                          <td style={{ color: "#ff9800", fontWeight: 700 }}>{formatTaka(exp.amount)}</td>
                          <td>
                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: expPaid ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)", color: expPaid ? "#28a745" : "#dc3545" }}>
                              {expPaid ? "পরিশোধিত" : "অপরিশোধিত"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
