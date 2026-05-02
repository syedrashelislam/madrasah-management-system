import { useParams, useNavigate } from "react-router-dom";
import { useStudent, useUpdateStudent } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useStudentExpenses, useAddStudentExpense } from "@/hooks/useStudentExpenses";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import { useAttendance } from "@/hooks/useAttendance";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { useExams, useAllExamSubjects, useStudentMarkEntries } from "@/hooks/useExams";
import { createHoverPrefetchProps } from "@/lib/prefetch";
import AttendanceHistory from "./attendance/AttendanceHistory";
import { ArrowRight, Printer, Edit, Camera, Plus, Download, Eye, FileText, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { generateMonthsFromAdmission, printReceipt as printPaymentReceipt } from "./payment-history/helpers";
import { buildDualRegistrationPage } from "@/lib/buildRegistrationFormHTML";
import { printReceiptHTML } from "@/lib/printReceipt";
import Icon from "@/components/Icon";

const gold = "#d4af37";
const muted = "rgba(255,255,255,0.5)";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: student, isLoading } = useStudent(id);
  const { data: allPayments = [] } = usePayments();
  const { data: allExpenses = [] } = useStudentExpenses();
  const { data: allAttendance = [] } = useAttendance();
  const updateStudent = useUpdateStudent();
  const addExpense = useAddStudentExpense();
  const navigate = useNavigate();
  const institution = useInstitutionInfo();
  const { data: allExams = [] } = useExams();
  const { data: allExamSubjects = [] } = useAllExamSubjects();
  const { data: studentMarks = [] } = useStudentMarkEntries(student?.student_id);

  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Student portal credentials
  const [showCredDialog, setShowCredDialog] = useState(false);
  const [credPassword, setCredPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);

  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 6; i++) pw += chars.charAt(Math.floor(Math.random() * chars.length));
    setCredPassword(pw);
  }, []);

  const saveCredentials = async () => {
    if (!credPassword.trim() || !student) return;
    setCredSaving(true);
    const { error } = await supabase.from('students').update({ login_password: credPassword.trim() }).eq('student_id', student.student_id);
    setCredSaving(false);
    if (error) { toast.error('পাসওয়ার্ড সংরক্ষণ ব্যর্থ'); return; }
    toast.success('ছাত্র পোর্টাল পাসওয়ার্ড সংরক্ষিত হয়েছে');
    setShowCredDialog(false);
  };

  // Payment history month navigation
  const now = new Date();
  const [paymentMonth, setPaymentMonth] = useState(now.getMonth());
  const [paymentYear, setPaymentYear] = useState(now.getFullYear());

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-5 gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
    </div>
  );

  if (!student) return <div className="text-center py-20 text-muted-foreground">ছাত্র পাওয়া যায়নি</div>;

  const studentPayments = allPayments.filter((p) => p.student_id === student.student_id);
  const studentExps = allExpenses.filter((e) => e.studentId === student.student_id);

  const admDateStr = student.admission_date && student.admission_date.trim() ? student.admission_date : null;
  const admDate = admDateStr ? new Date(admDateStr) : new Date();
  const validAdmDate = isNaN(admDate.getTime()) ? new Date() : admDate;
  const totalMonths = Math.max(1, (now.getFullYear() - validAdmDate.getFullYear()) * 12 + (now.getMonth() - validAdmDate.getMonth()) + 1);
  const totalFeeExpected = totalMonths * (student.monthly_fee || 0);
  const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalExpenses = studentExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const admissionFee = student.admission_fee || 0;
  const totalDue = totalFeeExpected - totalPaid + totalExpenses + admissionFee;

  const admissionFeePaid = studentPayments.some(p => p.month?.includes("ভর্তি") || p.fee_type?.includes("ভর্তি"));

  const allMonths = generateMonthsFromAdmission(student.admission_date);
  const paidMonthSet = new Set(studentPayments.filter(p => p.month && !p.month.startsWith("EXP:")).map(p => p.month));
  const monthPaymentMap = new Map<string, typeof studentPayments>();
  studentPayments.forEach(p => {
    const monthKey = p.month || "";
    const arr = monthPaymentMap.get(monthKey) || [];
    arr.push(p);
    monthPaymentMap.set(monthKey, arr);
  });

  // Filter monthly payments for selected month/year
  const selectedMonthLabel = `${MONTHS_BENGALI[paymentMonth]} ${toBengaliNumber(paymentYear)}`;
  const monthlyPaymentsForSelected = studentPayments.filter(p => {
    if (p.month?.startsWith("EXP:") || p.month === "ভর্তি ফি" || p.fee_type === "Admission") return false;
    return p.month === selectedMonthLabel;
  });

  const photoSrc = student.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=1a7a4f&textColor=ffffff`;
  const studentRouteId = student.student_id || student.id || id;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateStudent.mutate({ student_id: student.student_id, photo_url: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddExpense = () => {
    if (!expenseDesc.trim() || !expenseAmount) return;
    addExpense.mutate({
      studentId: student.student_id,
      description: expenseDesc.trim(),
      amount: Number(expenseAmount),
      date: new Date().toISOString().slice(0, 10),
    }, { onSuccess: () => { setExpenseDesc(""); setExpenseAmount(""); setShowExpenseDialog(false); } });
  };

  const printIdCard = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<html><head><title>আইডি কার্ড</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box;font-family:'Noto Sans Bengali',sans-serif}body{display:flex;justify-content:center;align-items:center;min-height:100vh}.card{width:2.125in;height:3.375in;border:2px solid #1a7a4f;border-radius:8px;padding:12px;text-align:center}.header{font-size:9px;font-weight:700;color:#1a7a4f;margin-bottom:4px}.sub{font-size:7px;color:#666;margin-bottom:8px}.photo{width:60px;height:60px;border-radius:50%;margin:0 auto 6px;border:2px solid #1a7a4f;object-fit:cover}.name{font-size:10px;font-weight:700}.info{font-size:8px;color:#333;margin-top:3px}</style></head><body><div class="card"><div class="header">${institution.name}</div><div class="sub">${institution.address}</div><img class="photo" src="${photoSrc}"/><div class="name">${student.name}</div><div class="info">আইডি: ${student.student_id}</div><div class="info">শ্রেণি: ${student.class_name}</div><div class="info">রক্তের গ্রুপ: ${student.blood_group}</div></div><script>window.print();window.close();</script></body></html>`);
  };

  const printRegistrationForm = () => {
    const pageHTML = buildDualRegistrationPage(student, institution);
    printReceiptHTML(pageHTML, "landscape", { primaryColor: institution.receiptPrimaryColor });
  };

  const printReceipt = (p: typeof studentPayments[0]) => {
    printPaymentReceipt(p, student, institution, studentPayments);
  };

  const goToPrevMonth = () => {
    if (paymentMonth === 0) { setPaymentMonth(11); setPaymentYear(y => y - 1); }
    else { setPaymentMonth(m => m - 1); }
  };
  const goToNextMonth = () => {
    if (paymentMonth === 11) { setPaymentMonth(0); setPaymentYear(y => y + 1); }
    else { setPaymentMonth(m => m + 1); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/students")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors" {...createHoverPrefetchProps("/students")}>
        <ArrowRight className="w-4 h-4 rotate-180" /> ছাত্র তালিকায় ফিরুন
      </button>

      {/* Header Card with All Details */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative group">
            <img src={photoSrc} alt={student.name} className="w-24 h-24 rounded-xl object-cover border-2 border-border/30" />
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          <div className="flex-1 space-y-1">
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-sm text-muted-foreground">{student.student_id} • {student.class_name}{student.section ? ` • ${student.section}` : ""}{student.roll ? ` • রোল: ${student.roll}` : ""}</p>
            {student.admission_no && <p className="text-xs text-muted-foreground font-mono">ভর্তি নং: {student.admission_no}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${student.status === "active" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                {student.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-xs" style={{
                background: (student.admission_status || 'approved') === 'approved' ? 'rgba(40,167,69,0.15)' : (student.admission_status || 'approved') === 'pending' ? 'rgba(255,193,7,0.15)' : 'rgba(220,53,69,0.15)',
                color: (student.admission_status || 'approved') === 'approved' ? '#28a745' : (student.admission_status || 'approved') === 'pending' ? '#ffc107' : '#dc3545',
              }}>
                {(student.admission_status || 'approved') === 'approved' ? '✓ অনুমোদিত' : (student.admission_status || 'approved') === 'pending' ? '⏳ অপেক্ষমান' : '✗ বাতিল'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={printRegistrationForm} className="gap-1.5 border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground"><FileText className="w-3.5 h-3.5" /> ভর্তি ফরম</Button>
            <Button variant="outline" size="sm" onClick={printIdCard} className="gap-1.5 border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground"><Printer className="w-3.5 h-3.5" /> আইডি কার্ড</Button>
            <Button variant="outline" size="sm" onClick={() => { setShowCredDialog(true); if (!credPassword) generatePassword(); }} className="gap-1.5 border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground"><Icon name="fa-key" size={14} /> পোর্টাল পাসওয়ার্ড</Button>
            <Button size="sm" onClick={() => navigate(`/students/${studentRouteId}/edit`)} className="gap-1.5" {...createHoverPrefetchProps(`/students/${studentRouteId}/edit`)}><Edit className="w-3.5 h-3.5" /> সম্পাদনা</Button>
          </div>
        </div>

        {/* Admission Status Actions */}
        {(student.admission_status === 'pending') && (
          <div className="mt-4 p-4 rounded-lg border border-yellow-500/30" style={{ background: 'rgba(255,193,7,0.06)' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#ffc107' }}>⏳ ভর্তি আবেদন অপেক্ষমান</p>
                <p className="text-xs text-muted-foreground mt-1">এই ছাত্রের ভর্তি আবেদন এখনও অনুমোদিত হয়নি। অনুমোদন বা বাতিল করুন।</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { if (confirm('ভর্তি অনুমোদন করতে চান?')) updateStudent.mutate({ student_id: student.student_id, admission_status: 'approved', status: 'active' } as any); }} className="gap-1.5" style={{ background: '#28a745', borderColor: '#28a745' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> অনুমোদন
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { if (confirm('ভর্তি বাতিল করতে চান?')) updateStudent.mutate({ student_id: student.student_id, admission_status: 'rejected', status: 'inactive' } as any); }} className="gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> বাতিল
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* All Student Details in organized sections */}
        <div className="mt-6 space-y-5">
          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="fa-user" size={12} /> ব্যক্তিগত তথ্য
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "ছাত্রের নাম", value: student.name },
                { label: "শ্রেণি", value: student.class_name },
                { label: "সেকশন/শাখা", value: student.section },
                { label: "রোল নম্বর", value: student.roll },
                { label: "জন্ম তারিখ", value: student.date_of_birth || "—" },
                { label: "রক্তের গ্রুপ", value: student.blood_group },
                { label: "ধর্ম", value: student.religion },
                { label: "জন্ম নিবন্ধন নং", value: student.birth_reg_no },
                { label: "ঠিকানা", value: student.address },
              ].map((item, i) => (
                <div key={i} className="space-y-1"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value || "—"}</p></div>
              ))}
            </div>
          </div>

          {/* Guardian/Family Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="fa-users" size={12} /> অভিভাবক/পরিবারের তথ্য
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "বাবার নাম", value: student.father_name },
                { label: "মায়ের নাম", value: student.mother_name },
                { label: "অভিভাবকের নাম", value: student.guardian_name },
                { label: "অভিভাবকের মোবাইল", value: student.guardian_phone },
                { label: "হোয়াটসঅ্যাপ", value: student.guardian_whatsapp },
                { label: "অভিভাবকের ইমেইল", value: student.guardian_email },
                { label: "জরুরি যোগাযোগ", value: student.emergency_contact },
              ].map((item, i) => (
                <div key={i} className="space-y-1"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value || "—"}</p></div>
              ))}
            </div>
          </div>

          {/* Admission/Fee Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="fa-graduation-cap" size={12} /> ভর্তি ও আর্থিক তথ্য
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "ভর্তি নম্বর", value: student.admission_no },
                { label: "ভর্তির তারিখ", value: student.admission_date },
                { label: "ভর্তির অবস্থা", value: (student.admission_status || 'approved') === 'approved' ? 'অনুমোদিত' : (student.admission_status || 'approved') === 'pending' ? 'অপেক্ষমান' : 'বাতিল' },
                { label: "মাসিক ফি", value: formatTaka(student.monthly_fee) },
                { label: "ভর্তি ফি", value: formatTaka(student.admission_fee || 0) },
                { label: "পূর্ববর্তী প্রতিষ্ঠান", value: student.previous_institution },
              ].map((item, i) => (
                <div key={i} className="space-y-1"><p className="text-xs text-muted-foreground">{item.label}</p><p className="text-sm font-medium">{item.value || "—"}</p></div>
              ))}
            </div>
          </div>

          {/* Medical Notes */}
          {student.medical_notes && student.medical_notes.trim() && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Icon name="fa-heartbeat" size={12} /> চিকিৎসা সংক্রান্ত তথ্য
              </h3>
              <p className="text-sm bg-secondary/20 rounded-lg p-3">{student.medical_notes}</p>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> ডকুমেন্টস</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "মায়ের এনআইডি", src: student.mother_nid_photo },
              { label: "বাবার এনআইডি", src: student.father_nid_photo },
              { label: "জন্ম নিবন্ধন", src: student.birth_cert_photo },
            ].map((doc, i) => (
              <div key={i} className="rounded-lg border border-border/30 bg-secondary/20 p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">{doc.label}</p>
                {doc.src ? (
                  <>
                    <img src={doc.src} alt={doc.label} className="w-full h-28 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setPreviewImage(doc.src); setPreviewTitle(doc.label); }} />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground" onClick={() => { setPreviewImage(doc.src); setPreviewTitle(doc.label); }}><Eye className="w-3 h-3" /> দেখুন</Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground" onClick={() => { const a = document.createElement("a"); a.href = doc.src; a.download = `${student.student_id}-${doc.label}.png`; a.click(); }}><Download className="w-3 h-3" /> ডাউনলোড</Button>
                    </div>
                  </>
                ) : (<p className="text-xs text-muted-foreground/60 text-center py-6">আপলোড করা হয়নি</p>)}
            </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "মোট প্রত্যাশিত ফি", value: formatTaka(totalFeeExpected), color: gold, sub: `${toBengaliNumber(totalMonths)} মাস`, icon: "fa-file-invoice-dollar" },
          { label: "ভর্তি ফি", value: formatTaka(admissionFee), color: "#ffc107", icon: "fa-coins", badge: admissionFeePaid ? "পরিশোধিত" : "বকেয়া", badgePaid: admissionFeePaid },
          { label: "মোট পরিশোধ", value: formatTaka(totalPaid), color: "#28a745", icon: "fa-hand-holding-usd" },
          { label: "অন্যান্য খরচ", value: formatTaka(totalExpenses), color: "#ff9800", icon: "fa-money-bill-wave" },
          { label: "মোট বকেয়া", value: formatTaka(Math.max(0, totalDue)), color: totalDue > 0 ? "#dc3545" : "#28a745", icon: "fa-exclamation-circle" },
        ].map((c, i) => (
          <div key={i} className="summary-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="icon-box" style={{ background: `${c.color}20`, color: c.color }}>
              <Icon name={c.icon} size={24} />
            </div>
            <div>
              <p style={{ fontSize: 11, color: muted }}>{c.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</p>
              {c.sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{c.sub}</p>}
              {c.badge && (
                <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: c.badgePaid ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)", color: c.badgePaid ? "#28a745" : "#dc3545" }}>
                  {c.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Attendance History — Full monthly calendar + day-by-day log */}
      <div className="content-box">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="fa-user-check" size={18} /> হাজিরা ইতিহাস
        </h3>
        <AttendanceHistory studentId={student.student_id} allAttendance={allAttendance} />
      </div>

      {/* Academic Performance */}
      {(() => {
        const studentExamIds = [...new Set(studentMarks.map(m => m.examId))];
        const studentExams = studentExamIds
          .map(eid => {
            const exam = allExams.find(e => e.id === eid);
            if (!exam) return null;
            const subjects = allExamSubjects.filter(s => s.examId === eid);
            const marks = studentMarks.filter(m => m.examId === eid);
            const totalObtained = marks.reduce((s, m) => s + m.marks, 0);
            const totalFull = subjects.reduce((s, sb) => s + sb.fullMarks, 0) || marks.length * 100;
            const percentage = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0;
            const allPassed = marks.every(m => {
              const sub = subjects.find(s => s.name === m.subjectName);
              return m.marks >= (sub?.passMarks ?? 33);
            });
            return { exam, subjects, marks, totalObtained, totalFull, percentage, allPassed };
          })
          .filter(Boolean);

        if (studentExams.length === 0) return null;

        return (
          <div className="content-box">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="fa-chart-line" size={18} /> পরীক্ষার ফলাফল ও একাডেমিক পারফর্ম্যান্স
            </h3>
            <div style={{ display: "grid", gap: 16 }}>
              {studentExams.map((item) => {
                if (!item) return null;
                const { exam, subjects, marks, totalObtained, totalFull, percentage, allPassed } = item;
                return (
                  <div key={exam.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", background: "rgba(212,175,55,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>{exam.name}</p>
                        <p style={{ fontSize: 11, color: muted }}>{exam.className} • {exam.date || "—"}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: allPassed ? "rgba(40,167,69,0.15)" : "rgba(220,53,69,0.15)", color: allPassed ? "#28a745" : "#dc3545" }}>
                          {allPassed ? "✓ পাস" : "✗ অকৃতকার্য"}
                        </span>
                        <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: percentage >= 80 ? "rgba(40,167,69,0.15)" : percentage >= 50 ? "rgba(255,193,7,0.15)" : "rgba(220,53,69,0.15)", color: percentage >= 80 ? "#28a745" : percentage >= 50 ? "#ffc107" : "#dc3545" }}>
                          {toBengaliNumber(percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="mobile-scroll">
                      <table className="data-table" style={{ marginBottom: 0 }}>
                        <thead><tr><th>বিষয়</th><th>প্রাপ্ত নম্বর</th><th>পূর্ণ নম্বর</th><th>পাস নম্বর</th><th>ফলাফল</th></tr></thead>
                        <tbody>
                          {marks.map((m) => {
                            const sub = subjects.find(s => s.name === m.subjectName);
                            const fullM = sub?.fullMarks ?? 100;
                            const passM = sub?.passMarks ?? 33;
                            const passed = m.marks >= passM;
                            const pct = fullM > 0 ? Math.round((m.marks / fullM) * 100) : 0;
                            return (
                              <tr key={m.id}>
                                <td style={{ fontWeight: 600 }}>{m.subjectName}</td>
                                <td style={{ fontWeight: 700, color: passed ? "#28a745" : "#dc3545" }}>{toBengaliNumber(m.marks)}</td>
                                <td>{toBengaliNumber(fullM)}</td>
                                <td>{toBengaliNumber(passM)}</td>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: passed ? "rgba(40,167,69,0.2)" : "rgba(220,53,69,0.2)", color: passed ? "#28a745" : "#dc3545" }}>
                                      {passed ? "পাস" : "ফেল"}
                                    </span>
                                    <span style={{ fontSize: 10, color: muted }}>{toBengaliNumber(pct)}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          <tr style={{ background: "rgba(212,175,55,0.04)", fontWeight: 700 }}>
                            <td style={{ fontWeight: 700, color: gold }}>মোট</td>
                            <td style={{ fontWeight: 700, color: gold }}>{toBengaliNumber(totalObtained)}</td>
                            <td>{toBengaliNumber(totalFull)}</td>
                            <td>—</td>
                            <td><span style={{ fontSize: 12, fontWeight: 700, color: percentage >= 80 ? "#28a745" : percentage >= 50 ? "#ffc107" : "#dc3545" }}>{toBengaliNumber(percentage)}%</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Outstanding Balance Breakdown */}
      {(() => {
        const unpaidMonthCount = allMonths.filter(m => !paidMonthSet.has(m)).length;
        const monthlyDue = unpaidMonthCount * student.monthly_fee;
        const totalExpectedAll = totalFeeExpected + admissionFee + totalExpenses;
        const paidPercent = totalExpectedAll > 0 ? Math.min(100, Math.round((totalPaid / totalExpectedAll) * 100)) : 0;
        return (
          <div className="content-box">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="fa-chart-bar" size={18} /> বকেয়া বিস্তারিত বিশ্লেষণ
            </h3>

            {/* Progress Bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: muted }}>পেমেন্ট সম্পন্নতা</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: paidPercent >= 80 ? "#28a745" : paidPercent >= 50 ? "#ffc107" : "#dc3545" }}>
                  {toBengaliNumber(paidPercent)}%
                </span>
              </div>
              <div style={{ width: "100%", height: 12, borderRadius: 8, background: "rgba(255,255,255,0.08)", overflow: "hidden", position: "relative" }}>
                <div
                  style={{
                    width: `${paidPercent}%`,
                    height: "100%",
                    borderRadius: 8,
                    background: paidPercent >= 80
                      ? "linear-gradient(90deg, #28a745, #34d058)"
                      : paidPercent >= 50
                        ? "linear-gradient(90deg, #ffc107, #ffdb4d)"
                        : "linear-gradient(90deg, #dc3545, #f06070)",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
                মোট প্রত্যাশিত {formatTaka(totalExpectedAll)} এর মধ্যে {formatTaka(totalPaid)} পরিশোধিত
              </p>
            </div>

            {/* Breakdown Items */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {/* Monthly Fee Due */}
              <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(220,53,69,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc3545" }}>
                    <Icon name="fa-calendar-times" size={16} />
                  </div>
                  <span style={{ fontSize: 12, color: muted }}>মাসিক ফি বকেয়া</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: monthlyDue > 0 ? "#dc3545" : "#28a745" }}>
                  {formatTaka(monthlyDue)}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                  {toBengaliNumber(unpaidMonthCount)} মাস × {formatTaka(student.monthly_fee)}
                </p>
              </div>

              {/* Admission Fee Status */}
              <div style={{ padding: "14px 16px", borderRadius: 10, background: admissionFeePaid ? "rgba(40,167,69,0.08)" : "rgba(255,193,7,0.08)", border: `1px solid ${admissionFeePaid ? "rgba(40,167,69,0.2)" : "rgba(255,193,7,0.2)"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: admissionFeePaid ? "rgba(40,167,69,0.15)" : "rgba(255,193,7,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: admissionFeePaid ? "#28a745" : "#ffc107" }}>
                    <Icon name="fa-coins" size={16} />
                  </div>
                  <span style={{ fontSize: 12, color: muted }}>ভর্তি ফি</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: admissionFeePaid ? "#28a745" : "#ffc107" }}>
                  {formatTaka(admissionFee)}
                </p>
                <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: admissionFeePaid ? "rgba(40,167,69,0.2)" : "rgba(255,193,7,0.2)", color: admissionFeePaid ? "#28a745" : "#ffc107" }}>
                  {admissionFeePaid ? "✓ পরিশোধিত" : "✗ অপরিশোধিত"}
                </span>
              </div>

              {/* Other Expenses */}
              <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,152,0,0.08)", border: "1px solid rgba(255,152,0,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,152,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff9800" }}>
                    <Icon name="fa-money-bill-wave" size={16} />
                  </div>
                  <span style={{ fontSize: 12, color: muted }}>অন্যান্য খরচ</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: totalExpenses > 0 ? "#ff9800" : "rgba(255,255,255,0.6)" }}>
                  {formatTaka(totalExpenses)}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                  {toBengaliNumber(studentExps.length)} টি খরচ
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Month-by-Month Reconciliation */}
      <div className="content-box">
        <h3 style={{ fontSize: 16, fontWeight: 700, color: gold, marginBottom: 14 }}>
          <Icon name="fa-calendar-alt" style={{ marginLeft: 6 }} /> মাসভিত্তিক হিসাব
        </h3>
        {allMonths.length === 0 ? (
          <p style={{ textAlign: "center", color: muted, padding: 20 }}>কোনো মাস পাওয়া যায়নি</p>
        ) : (
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
        )}
      </div>

      {/* Monthly Payment History with Month Selector */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold">মাসিক পেমেন্ট ইতিহাস</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevMonth} className="p-1.5 h-8 w-8 border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center" style={{ color: gold }}>
              {MONTHS_BENGALI[paymentMonth]} {toBengaliNumber(paymentYear)}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth} className="p-1.5 h-8 w-8 border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {monthlyPaymentsForSelected.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {selectedMonthLabel} মাসে কোনো মাসিক পেমেন্ট পাওয়া যায়নি
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">রসিদ নং</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">মাস</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">তারিখ</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">পরিমাণ</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">পদ্ধতি</th>
                  <th className="py-2 px-3 text-right text-muted-foreground font-medium">প্রিন্ট</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPaymentsForSelected.map((p) => (
                  <tr key={p.id} className="border-b border-border/10">
                    <td className="py-2.5 px-3 text-right">{p.receipt_no || p.id.slice(0, 8)}</td>
                    <td className="py-2.5 px-3 text-right">{p.month}</td>
                    <td className="py-2.5 px-3 text-right">{p.payment_date}</td>
                    <td className="py-2.5 px-3 text-right text-primary font-medium">{formatTaka(p.amount)}</td>
                    <td className="py-2.5 px-3 text-right">{p.method}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button onClick={() => printReceipt(p)} className="text-muted-foreground hover:text-primary transition-colors"><Printer className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Other Expenses */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">অন্যান্য খরচ</h3>
          <Button size="sm" variant="outline" onClick={() => setShowExpenseDialog(true)} className="gap-1.5 border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground"><Plus className="w-3.5 h-3.5" /> খরচ যোগ করুন</Button>
        </div>
        {studentExps.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-6">কোনো অন্যান্য খরচ নেই</p>) : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border/30"><th className="py-2 px-3 text-right text-muted-foreground font-medium">বিবরণ</th><th className="py-2 px-3 text-right text-muted-foreground font-medium">তারিখ</th><th className="py-2 px-3 text-right text-muted-foreground font-medium">পরিমাণ</th></tr></thead><tbody>
            {studentExps.map((exp) => (<tr key={exp.id} className="border-b border-border/10"><td className="py-2.5 px-3 text-right">{exp.description}</td><td className="py-2.5 px-3 text-right">{exp.date}</td><td className="py-2.5 px-3 text-right text-yellow-400 font-medium">{formatTaka(exp.amount)}</td></tr>))}
          </tbody></table></div>
        )}
      </div>

      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="glass-card border-border/30"><DialogHeader><DialogTitle>অন্যান্য খরচ যোগ করুন</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><label className="text-xs text-muted-foreground">বিবরণ</label><input className="glass-input w-full" placeholder="যেমন: বই ক্রয়, ইউনিফর্ম..." value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} /></div>
            <div className="space-y-1.5"><label className="text-xs text-muted-foreground">পরিমাণ (টাকা)</label><input type="number" className="glass-input w-full" placeholder="০" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowExpenseDialog(false)} className="border-border/50">বাতিল</Button><Button onClick={handleAddExpense}>যোগ করুন</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="glass-card border-border/30 max-w-lg"><DialogHeader><DialogTitle>{previewTitle}</DialogTitle></DialogHeader>
          {previewImage && (<div className="space-y-3"><img src={previewImage} alt={previewTitle} className="w-full rounded-lg" /><Button variant="outline" className="w-full gap-2 border-border/50" onClick={() => { const a = document.createElement("a"); a.href = previewImage; a.download = `${student.student_id}-${previewTitle}.png`; a.click(); }}><Download className="w-4 h-4" /> ডাউনলোড করুন</Button></div>)}
        </DialogContent>
      </Dialog>
      <Dialog open={showCredDialog} onOpenChange={setShowCredDialog}>
        <DialogContent className="glass-card border-border/30">
          <DialogHeader><DialogTitle>ছাত্র পোর্টাল পাসওয়ার্ড</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">ছাত্র আইডি</label>
              <div className="glass-input w-full flex items-center px-3 py-2 text-sm font-mono opacity-70">{student.student_id}</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">পাসওয়ার্ড</label>
              <div className="flex gap-2">
                <input className="glass-input flex-1 font-mono text-lg tracking-widest" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} placeholder="পাসওয়ার্ড লিখুন" />
                <Button variant="outline" size="sm" onClick={generatePassword} className="border-border/50 bg-secondary/30 hover:bg-secondary/50 text-foreground whitespace-nowrap">
                  <Icon name="fa-random" size={12} /> তৈরি করুন
                </Button>
              </div>
            </div>
            {student.login_password && (
              <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
                <span className="font-semibold">বর্তমান পাসওয়ার্ড:</span> <span className="font-mono">{student.login_password}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCredDialog(false)} className="border-border/50">বাতিল</Button>
            <Button onClick={saveCredentials} disabled={credSaving || !credPassword.trim()}>
              {credSaving ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড সংরক্ষণ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
