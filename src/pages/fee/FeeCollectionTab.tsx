import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/useStudents";
import { usePayments, useAddPayment } from "@/hooks/usePayments";
import { useStudentExpenses } from "@/hooks/useStudentExpenses";
import { useClasses } from "@/hooks/useClasses";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { buildDualReceiptPage, type ReceiptData } from "@/lib/buildReceiptHTML";
import { printReceiptHTML } from "@/lib/printReceipt";
import { emailReceipt, isValidEmail } from "@/lib/emailReceipt";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";

function generateMonthsFromAdmission(admissionDate: string): string[] {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-01-01`;
  const startStr = admissionDate && admissionDate.trim() ? admissionDate : defaultStart;
  const start = new Date(startStr);
  const months: string[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${MONTHS_BENGALI[month]} ${toBengaliNumber(year)}`);
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return months;
}



export default function FeeCollectionTab() {
  const { data: students = [], isLoading } = useStudents();
  const { data: payments = [] } = usePayments();
  const { data: classes = [] } = useClasses();
  const { data: studentExpenses = [] } = useStudentExpenses();
  const institution = useInstitutionInfo();
  const addPayment = useAddPayment();
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [method, setMethod] = useState("নগদ");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const [includeAdmission, setIncludeAdmission] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partialPaymentMode, setPartialPaymentMode] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [includeExamFee, setIncludeExamFee] = useState(false);
  const [examFeeAmount, setExamFeeAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountNote, setDiscountNote] = useState("");
  const [lastReceiptData, setLastReceiptData] = useState<ReceiptData | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const filteredStudents = students
    .filter(s => s.status === "active")
    .filter(s => selectedClassId === "" || s.class_id === selectedClassId)
    .filter(s => {
      if (!studentSearch) return true;
      const q = studentSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q);
    });

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId);

  const allMonths = useMemo(() => {
    if (!selectedStudent) return [];
    return generateMonthsFromAdmission(selectedStudent.admission_date);
  }, [selectedStudent]);

  const studentPayments = payments.filter((p) => p.student_id === selectedStudentId);
  const paidMonths = studentPayments.filter(p => !p.month.startsWith("EXP:")).map((p) => p.month);
  const unpaidMonths = allMonths.filter((m) => !paidMonths.includes(m));

  const studentExpenseList = studentExpenses.filter((e) => e.studentId === selectedStudentId);
  const unpaidExpenses = studentExpenseList.filter(e =>
    !studentPayments.some(p => p.month === `EXP: ${e.description}` && p.amount === e.amount)
  );

  const toggleMonth = (m: string) => setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const toggleExpense = (id: string) => setSelectedExpenseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAllUnpaid = () => setSelectedMonths([...unpaidMonths]);

  const admissionFeePaid = studentPayments.some(p => p.fee_type === "Admission" || p.month === "ভর্তি ফি");
  const admissionFeeAmount = selectedStudent && !admissionFeePaid && includeAdmission ? selectedStudent.admission_fee : 0;
  const feeTotal = selectedStudent ? selectedMonths.length * selectedStudent.monthly_fee : 0;
  const expenseTotal = unpaidExpenses.filter(e => selectedExpenseIds.includes(e.id)).reduce((sum, e) => sum + e.amount, 0);
  const parsedExamFee = includeExamFee ? (parseFloat(examFeeAmount) || 0) : 0;
  const parsedDiscount = parseFloat(discountAmount) || 0;

  // Partial payment calculations
  const parsedCustomAmount = parseFloat(customAmount) || 0;
  const partialFeeAmount = partialPaymentMode && parsedCustomAmount > 0 ? parsedCustomAmount : feeTotal;
  const partialDue = partialPaymentMode ? Math.max(0, feeTotal - parsedCustomAmount) : 0;

  const grandTotal = Math.max(0, partialPaymentMode
    ? partialFeeAmount + expenseTotal + admissionFeeAmount + parsedExamFee - parsedDiscount
    : feeTotal + expenseTotal + admissionFeeAmount + parsedExamFee - parsedDiscount);

  // Validation: partial amount cannot exceed full fee total
  const isPartialAmountValid = !partialPaymentMode || (parsedCustomAmount > 0 && parsedCustomAmount <= feeTotal);

  const handleSubmit = async () => {
    if (!selectedStudent || (feeTotal + expenseTotal + admissionFeeAmount + parsedExamFee) <= 0) { toast.error("অন্তত একটি মাস বা খরচ নির্বাচন করুন"); return; }

    if (partialPaymentMode && selectedMonths.length === 0) {
      toast.error("আংশিক পরিশোধের জন্য অন্তত একটি মাস নির্বাচন করুন");
      return;
    }
    if (partialPaymentMode && !isPartialAmountValid) {
      toast.error("সঠিক আংশিক পরিমাণ লিখুন");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}`;

    const receiptItems: { label: string; amount: number }[] = [];
    setIsSubmitting(true);

    try {
      if (partialPaymentMode && selectedMonths.length > 0) {
        // Partial mode: create a single payment record for the first selected month
        const firstMonth = selectedMonths[0];
        await addPayment.mutateAsync({
          student_id: selectedStudent.student_id,
          receipt_no: receiptNo,
          fee_type: "Partial",
          amount: parsedCustomAmount,
          payment_date: today,
          month: firstMonth,
          method,
        });
        receiptItems.push({
          label: `আংশিক ফি - ${selectedMonths.join(", ")}`,
          amount: parsedCustomAmount,
        });
      } else {
        // Normal mode: Monthly fees
        for (const month of selectedMonths) {
          await addPayment.mutateAsync({
            student_id: selectedStudent.student_id,
            receipt_no: receiptNo,
            fee_type: "Monthly",
            amount: selectedStudent.monthly_fee,
            payment_date: today,
            month,
            method,
          });
          receiptItems.push({ label: `মাসিক ফি - ${month}`, amount: selectedStudent.monthly_fee });
        }
      }

      // Admission fee
      if (admissionFeeAmount > 0 && selectedStudent) {
        await addPayment.mutateAsync({
          student_id: selectedStudent.student_id,
          receipt_no: receiptNo,
          fee_type: "Admission",
          amount: selectedStudent.admission_fee,
          payment_date: today,
          month: "ভর্তি ফি",
          method,
        });
        receiptItems.push({ label: "ভর্তি ফি", amount: selectedStudent.admission_fee });
      }

      // Expenses
      for (const exp of unpaidExpenses.filter(e => selectedExpenseIds.includes(e.id))) {
        await addPayment.mutateAsync({
          student_id: selectedStudent.student_id,
          receipt_no: receiptNo,
          fee_type: "Other",
          amount: exp.amount,
          payment_date: today,
          month: `EXP: ${exp.description}`,
          method,
        });
        receiptItems.push({ label: exp.description, amount: exp.amount });
      }

      // Exam fee
      if (parsedExamFee > 0 && selectedStudent) {
        await addPayment.mutateAsync({
          student_id: selectedStudent.student_id,
          receipt_no: receiptNo,
          fee_type: "Exam",
          amount: parsedExamFee,
          payment_date: today,
          month: "পরীক্ষা ফি",
          method,
        });
        receiptItems.push({ label: "পরীক্ষা ফি", amount: parsedExamFee });
      }

      // Generate receipt using unified template (landscape, 2 copies)
      const todayBn = new Date().toLocaleDateString("bn-BD");
      const receiptData: ReceiptData = {
        institution,
        receiptTitle: partialPaymentMode ? "আংশিক ফি আদায় রসিদ" : "ফি আদায় রসিদ",
        receiptNo,
        date: todayBn,
        infoRows: [
          { label: "ছাত্রের নাম", value: selectedStudent.name },
          { label: "আইডি", value: selectedStudent.student_id },
          { label: "শ্রেণি", value: selectedStudent.class_name },
          { label: "রোল", value: selectedStudent.roll || "—" },
        ],
        items: receiptItems,
        summary: partialPaymentMode
          ? { total: feeTotal + expenseTotal + admissionFeeAmount + parsedExamFee, discount: parsedDiscount, paid: grandTotal, due: partialDue }
          : { total: grandTotal + parsedDiscount, discount: parsedDiscount, paid: grandTotal, due: 0 },
        method,
      };
      const pageHTML = buildDualReceiptPage(receiptData);
      printReceiptHTML(pageHTML, "landscape", { primaryColor: institution.receiptPrimaryColor });
      setLastReceiptData(receiptData);
      toast.success(partialPaymentMode ? "আংশিক পরিশোধ সফল হয়েছে!" : "সফলভাবে আদায় হয়েছে!");
      setSelectedMonths([]);
      setSelectedExpenseIds([]);
      setIncludeAdmission(false);
      setPartialPaymentMode(false);
      setCustomAmount("");
      setIncludeExamFee(false);
      setExamFeeAmount("");
      setDiscountAmount("");
      setDiscountNote("");
    } catch (err) {
      toast.error("আদায়ে সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Skeleton className="h-64" style={{ borderRadius: 10 }} />;

  return (
    <div>
      {/* Student Selection */}
      <div className="content-box">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
          <Icon name="fa-user-graduate" /> ছাত্র নির্বাচন
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>শ্রেণি</label>
            <select className="glass-select" value={selectedClassId} onChange={(e) => { setSelectedClassId(e.target.value ? Number(e.target.value) : ""); setSelectedStudentId(""); }}>
              <option value="">-- সকল শ্রেণি --</option>
              {classes.map((c) => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>আইডি/নাম দিয়ে সার্চ</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="fa-search" size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </span>
              <input className="glass-input" style={{ paddingLeft: 40 }} placeholder="আইডি বা নাম লিখুন..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <select className="glass-select" value={selectedStudentId} onChange={(e) => { setSelectedStudentId(e.target.value); setSelectedMonths([]); setSelectedExpenseIds([]); setIncludeAdmission(false); setPartialPaymentMode(false); setCustomAmount(""); setIncludeExamFee(false); setExamFeeAmount(""); setDiscountAmount(""); setDiscountNote(""); setLastReceiptData(null); }}>
          <option value="">-- ছাত্র নির্বাচন করুন ({toBengaliNumber(filteredStudents.length)} জন) --</option>
          {filteredStudents.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id}) - {s.class_name}</option>)}
        </select>
      </div>

      {/* Fee & Expense Selection */}
      {selectedStudent && (
        <div className="content-box">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
            <Icon name="fa-money-check-alt" /> ফি ও খরচ আদায়
          </h3>

          {/* Student info summary */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: 12, background: 'rgba(212,175,55,0.05)', borderRadius: 8, flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>নাম:</span> <strong>{selectedStudent.name}</strong></div>
            <div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>শ্রেণি:</span> <strong>{selectedStudent.class_name}</strong></div>
            <div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>মাসিক ফি:</span> <strong style={{ color: '#d4af37' }}>{formatTaka(selectedStudent.monthly_fee)}</strong></div>
            <div><span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>ভর্তি ফি:</span> <strong style={{ color: admissionFeePaid ? '#28a745' : '#d4af37' }}>{admissionFeePaid ? 'পরিশোধিত ✓' : formatTaka(selectedStudent.admission_fee)}</strong></div>
          </div>

          {/* Admission Fee */}
          {selectedStudent.admission_fee > 0 && !admissionFeePaid && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 10 }}>
                ভর্তি ফি — {formatTaka(selectedStudent.admission_fee)}
              </h4>
              <button onClick={() => setIncludeAdmission(!includeAdmission)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s',
                background: includeAdmission ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: includeAdmission ? '#d4af37' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${includeAdmission ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                fontWeight: includeAdmission ? 700 : 400,
              }}>
                {includeAdmission && <Icon name="fa-check" size={10} style={{ marginRight: 4 }} />}
                ভর্তি ফি — {formatTaka(selectedStudent.admission_fee)}
              </button>
            </div>
          )}

          {/* Monthly fees */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 10 }}>
              <h4 style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>মাসিক ফি — {formatTaka(selectedStudent.monthly_fee)}/মাস</h4>
              {unpaidMonths.length > 0 && (
                <button className="btn-outline-gold" style={{ fontSize: 11, padding: '4px 10px' }} onClick={selectAllUnpaid}>
                  <Icon name="fa-check-double" /> সকল নির্বাচন
                </button>
              )}
            </div>
            {unpaidMonths.length === 0 ? (
              <p style={{ fontSize: 13, color: '#28a745' }}>সকল মাসের ফি পরিশোধিত ✓</p>
            ) : (
              <>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
                  বকেয়া মাস নির্বাচন করুন ({toBengaliNumber(unpaidMonths.length)} মাস বকেয়া):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {unpaidMonths.map((m) => (
                    <button key={m} onClick={() => toggleMonth(m)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'all 0.3s',
                      background: selectedMonths.includes(m) ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: selectedMonths.includes(m) ? '#d4af37' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${selectedMonths.includes(m) ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      fontWeight: selectedMonths.includes(m) ? 700 : 400,
                    }}>
                      {selectedMonths.includes(m) && <Icon name="fa-check" size={10} style={{ marginRight: 4 }} />}
                      {m}
                    </button>
                  ))}
                </div>
            </>
            )}
          </div>

          {/* Partial Payment Toggle */}
          {selectedMonths.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: partialPaymentMode ? 'rgba(212,175,55,0.08)' : 'transparent',
                border: `1px solid ${partialPaymentMode ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.3s',
              }}>
                {/* Toggle Switch */}
                <button
                  onClick={() => { setPartialPaymentMode(!partialPaymentMode); setCustomAmount(""); }}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    background: partialPaymentMode
                      ? 'linear-gradient(135deg, #d4af37, #c5a028)'
                      : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.3s',
                    flexShrink: 0,
                    padding: 0,
                  }}
                  aria-label="আংশিক পরিশোধ টগল"
                >
                  <span style={{
                    position: 'absolute',
                    top: 3,
                    left: partialPaymentMode ? 23 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: partialPaymentMode ? '#d4af37' : 'rgba(255,255,255,0.7)' }}>
                    <Icon name="fa-hand-holding-usd" size={13} style={{ marginRight: 6 }} />
                    আংশিক পরিশোধ
                  </span>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, margin: 0 }}>
                    পূর্ণ ফি-র পরিবর্তে আংশিক টাকা পরিশোধ করুন
                  </p>
                </div>
              </div>

              {/* Partial Payment Input & Summary */}
              {partialPaymentMode && (
                <div style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(212,175,55,0.04)',
                  border: '1px solid rgba(212,175,55,0.15)',
                }}>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'block', fontWeight: 600 }}>
                    <Icon name="fa-coins" size={12} style={{ marginRight: 6 }} />
                    পরিশোধের পরিমাণ (টাকা)
                  </label>
                  <div style={{ position: 'relative', marginBottom: 12 }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 15, fontWeight: 700, color: '#d4af37',
                    }}>৳</span>
                    <input
                      className="glass-input"
                      type="number"
                      min="1"
                      max={feeTotal}
                      step="1"
                      placeholder={`সর্বোচ্চ ${formatTaka(feeTotal)}`}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      style={{
                        paddingLeft: 36,
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                      }}
                    />
                  </div>

                  {/* Partial payment visual summary */}
                  {parsedCustomAmount > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 8,
                    }}>
                      {/* Total Fee */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>মোট ফি</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{formatTaka(feeTotal)}</p>
                      </div>
                      {/* Paying Now */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(40,167,69,0.08)',
                        border: '1px solid rgba(40,167,69,0.2)',
                        textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 10, color: 'rgba(40,167,69,0.8)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>আংশিক পরিশোধ</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: '#28a745', margin: 0 }}>{formatTaka(parsedCustomAmount)}</p>
                      </div>
                      {/* Remaining Due */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: partialDue > 0 ? 'rgba(220,53,69,0.08)' : 'rgba(40,167,69,0.08)',
                        border: `1px solid ${partialDue > 0 ? 'rgba(220,53,69,0.2)' : 'rgba(40,167,69,0.2)'}`,
                        textAlign: 'center',
                      }}>
                        <p style={{ fontSize: 10, color: partialDue > 0 ? 'rgba(220,53,69,0.8)' : 'rgba(40,167,69,0.8)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>অবশিষ্ট বকেয়া</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: partialDue > 0 ? '#dc3545' : '#28a745', margin: 0 }}>{formatTaka(partialDue)}</p>
                      </div>
                    </div>
                  )}

                  {/* Progress bar showing payment proportion */}
                  {parsedCustomAmount > 0 && feeTotal > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min(100, (parsedCustomAmount / feeTotal) * 100)}%`,
                          height: '100%',
                          borderRadius: 3,
                          background: parsedCustomAmount > feeTotal
                            ? 'linear-gradient(90deg, #dc3545, #c82333)'
                            : 'linear-gradient(90deg, #d4af37, #28a745)',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'right', margin: '4px 0 0 0' }}>
                        {toBengaliNumber(Math.min(100, Math.round((parsedCustomAmount / feeTotal) * 100)))}% পরিশোধ
                      </p>
                    </div>
                  )}

                  {/* Validation warning */}
                  {parsedCustomAmount > feeTotal && (
                    <p style={{ fontSize: 12, color: '#dc3545', marginTop: 8, margin: '8px 0 0 0' }}>
                      <Icon name="fa-exclamation-triangle" size={11} style={{ marginRight: 4 }} />
                      আংশিক পরিমাণ মোট ফি ({formatTaka(feeTotal)}) এর বেশি হতে পারবে না
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Expenses */}
          {unpaidExpenses.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 10 }}>
                অন্যান্য বকেয়া খরচ
              </h4>
              {unpaidExpenses.map((e) => (
                <button key={e.id} onClick={() => toggleExpense(e.id)} style={{
                  width: '100%', display: 'flex', justifyContent: 'space-between', padding: '8px 14px',
                  borderRadius: 8, marginBottom: 6, fontSize: 13, cursor: 'pointer', transition: 'all 0.3s', textAlign: 'left',
                  background: selectedExpenseIds.includes(e.id) ? 'rgba(212,175,55,0.15)' : 'transparent',
                  color: selectedExpenseIds.includes(e.id) ? '#d4af37' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${selectedExpenseIds.includes(e.id) ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  <span>{e.description}</span>
                  <span>{formatTaka(e.amount)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Exam Fee */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 10 }}>
              <Icon name="fa-file-alt" size={12} style={{ marginRight: 6 }} /> পরীক্ষা ফি
            </h4>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              background: includeExamFee ? 'rgba(212,175,55,0.08)' : 'transparent',
              border: `1px solid ${includeExamFee ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.3s',
            }}>
              <button
                onClick={() => { setIncludeExamFee(!includeExamFee); if (includeExamFee) setExamFeeAmount(""); }}
                style={{
                  position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: includeExamFee ? 'linear-gradient(135deg, #d4af37, #c5a028)' : 'rgba(255,255,255,0.12)',
                  transition: 'background 0.3s', flexShrink: 0, padding: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: includeExamFee ? 23 : 3, width: 18, height: 18,
                  borderRadius: '50%', background: '#fff', transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
              <span style={{ fontSize: 13, fontWeight: 600, color: includeExamFee ? '#d4af37' : 'rgba(255,255,255,0.7)' }}>
                পরীক্ষা ফি যোগ করুন
              </span>
            </div>
            {includeExamFee && (
              <div style={{ marginTop: 10, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 700, color: '#d4af37' }}>৳</span>
                <input className="glass-input" type="number" min="0" placeholder="পরীক্ষা ফি পরিমাণ" value={examFeeAmount} onChange={(e) => setExamFeeAmount(e.target.value)} style={{ paddingLeft: 36, fontSize: 15, fontWeight: 600 }} />
              </div>
            )}
          </div>

          {/* Discount / Waiver */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6, marginBottom: 10 }}>
              <Icon name="fa-percent" size={12} style={{ marginRight: 6 }} /> ছাড় / মওকুফ
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 700, color: '#28a745' }}>৳</span>
                <input className="glass-input" type="number" min="0" placeholder="ছাড়ের পরিমাণ" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} style={{ paddingLeft: 36, fontSize: 15, fontWeight: 600 }} />
              </div>
              <input className="glass-input" placeholder="ছাড়ের কারণ (ঐচ্ছিক)" value={discountNote} onChange={(e) => setDiscountNote(e.target.value)} />
            </div>
            {parsedDiscount > 0 && (
              <p style={{ fontSize: 12, color: '#28a745', marginTop: 6, margin: '6px 0 0 0' }}>
                <Icon name="fa-check-circle" size={11} style={{ marginRight: 4 }} />
                {formatTaka(parsedDiscount)} ছাড় প্রয়োগ হবে{discountNote ? ` — ${discountNote}` : ''}
              </p>
            )}
          </div>

          {/* Total & Submit */}
          {grandTotal > 0 && (
            <div className="content-box" style={{ background: 'rgba(212,175,55,0.05)', padding: 12, marginBottom: 12 }}>
              {partialPaymentMode && feeTotal > 0 ? (
                <>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    মাসিক ফি ({toBengaliNumber(selectedMonths.length)} মাস): <span style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>{formatTaka(feeTotal)}</span>
                  </p>
                  <p style={{ fontSize: 13, color: '#28a745' }}>
                    <Icon name="fa-hand-holding-usd" size={11} style={{ marginRight: 4 }} />
                    আংশিক পরিশোধ: <strong>{formatTaka(parsedCustomAmount)}</strong>
                  </p>
                  {partialDue > 0 && (
                    <p style={{ fontSize: 13, color: '#dc3545' }}>
                      <Icon name="fa-exclamation-circle" size={11} style={{ marginRight: 4 }} />
                      অবশিষ্ট বকেয়া: <strong>{formatTaka(partialDue)}</strong>
                    </p>
                  )}
                </>
              ) : (
                feeTotal > 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>মাসিক ফি ({toBengaliNumber(selectedMonths.length)} মাস): <strong style={{ color: '#d4af37' }}>{formatTaka(feeTotal)}</strong></p>
              )}
              {admissionFeeAmount > 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>ভর্তি ফি: <strong style={{ color: '#d4af37' }}>{formatTaka(admissionFeeAmount)}</strong></p>}
              {expenseTotal > 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>অন্যান্য খরচ: <strong style={{ color: '#d4af37' }}>{formatTaka(expenseTotal)}</strong></p>}
              {parsedExamFee > 0 && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>পরীক্ষা ফি: <strong style={{ color: '#d4af37' }}>{formatTaka(parsedExamFee)}</strong></p>}
              {parsedDiscount > 0 && <p style={{ fontSize: 13, color: '#28a745' }}>ছাড়: <strong>-{formatTaka(parsedDiscount)}</strong>{discountNote ? ` (${discountNote})` : ''}</p>}
              <p style={{ fontSize: 15, fontWeight: 800, color: '#d4af37', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, marginTop: 8 }}>
                {partialPaymentMode ? 'মোট পরিশোধ' : 'সর্বমোট'}: {formatTaka(grandTotal)}
              </p>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 6, display: 'block' }}>পদ্ধতি</label>
            <select className="glass-select" value={method} onChange={(e) => setMethod(e.target.value)}>
              {["নগদ", "বিকাশ", "রকেট", "নগদ (মোবাইল)"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <button
            className="btn-gold"
            style={{ width: '100%' }}
            onClick={handleSubmit}
            disabled={(feeTotal + expenseTotal + admissionFeeAmount + parsedExamFee) <= 0 || isSubmitting || addPayment.isPending || (partialPaymentMode && !isPartialAmountValid)}
          >
            <Icon name="fa-check-circle" /> {isSubmitting ? "প্রক্রিয়াকরণ হচ্ছে..." : partialPaymentMode ? `আংশিক আদায় করুন — ${formatTaka(grandTotal)}` : `আদায় করুন — ${formatTaka(grandTotal)}`}
          </button>

          {/* Email Receipt After Payment */}
          {lastReceiptData && selectedStudent && (
            <div style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 10,
              background: 'rgba(40,167,69,0.06)',
              border: '1px solid rgba(40,167,69,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="fa-check-circle" size={16} style={{ color: '#28a745' }} />
                <span style={{ fontSize: 13, color: '#28a745', fontWeight: 600 }}>রসিদ তৈরি হয়েছে</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn-outline-gold"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={() => {
                    const pageHTML = buildDualReceiptPage(lastReceiptData);
                    printReceiptHTML(pageHTML, 'landscape', { primaryColor: institution.receiptPrimaryColor });
                  }}
                >
                  <Icon name="fa-print" size={13} /> পুনরায় প্রিন্ট
                </button>
                <button
                  className="btn-outline-gold"
                  style={{ padding: '6px 14px', fontSize: 12, opacity: isSendingEmail ? 0.6 : 1 }}
                  disabled={isSendingEmail}
                  onClick={async () => {
                    const email = selectedStudent.guardian_email || '';
                    if (!email) {
                      toast.error('অভিভাবকের ইমেইল নেই। ছাত্র প্রোফাইলে অভিভাবকের ইমেইল যোগ করুন।');
                      return;
                    }
                    if (!isValidEmail(email)) {
                      toast.error(`"${email}" একটি বৈধ ইমেইল নয়। সঠিক ইমেইল (যেমন: name@example.com) যোগ করুন।`);
                      return;
                    }
                    setIsSendingEmail(true);
                    try {
                      const result = await emailReceipt(email, lastReceiptData);
                      if (result.success) {
                        toast.success(`রসিদ ইমেইল পাঠানো হয়েছে: ${email}`);
                      } else {
                        toast.error(result.error || 'ইমেইল পাঠানো ব্যর্থ হয়েছে');
                      }
                    } catch {
                      toast.error('ইমেইল পাঠানো ব্যর্থ হয়েছে');
                    } finally {
                      setIsSendingEmail(false);
                    }
                  }}
                >
                  <Icon name="fa-envelope" size={13} /> {isSendingEmail ? 'পাঠানো হচ্ছে...' : 'ইমেইল রসিদ'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
