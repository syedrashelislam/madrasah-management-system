import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useStudentExpenses } from "@/hooks/useStudentExpenses";
import { useClasses } from "@/hooks/useClasses";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";
import { openSmsReminder } from "@/lib/smsUtils";
import { sendBulkSms, isSmsApiConfigured } from "@/lib/bulkSmsApi";
import { showToast } from "@/lib/showToast";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";

function countMonthsBetween(startDate: string, endDate: Date): number {
  const start = new Date(startDate);
  return (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth()) + 1;
}

interface DueStudent {
  id: string;
  name: string;
  student_id: string;
  class_name: string;
  dueMonths: number;
  feeDueAmount: number;
  admissionDue: number;
  expDue: number;
  totalDueAmount: number;
  partialPaid: number;
  smsPhone: string;
  whatsappPhone: string;
}

function generateWhatsAppUrl(phone: string, studentName: string, dueAmount: number, madrasaName: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const bdPhone = cleanPhone.startsWith("0") ? "88" + cleanPhone : cleanPhone.startsWith("88") ? cleanPhone : "88" + cleanPhone;
  const message = `আসসালামু আলাইকুম,\n\n${madrasaName} থেকে জানানো যাচ্ছে যে, ${studentName} এর মোট বকেয়া ফি ৳${dueAmount.toLocaleString("en-IN")}।\n\nঅনুগ্রহ করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করুন।\n\nধন্যবাদ।`;
  return `https://wa.me/${bdPhone}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: "inline", verticalAlign: "middle" }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function handlePrintDueList(dueStudents: DueStudent[], totalDueAll: number, totalPartialAll: number, institutionName: string, institutionAddress: string) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  const today = new Date().toLocaleDateString("bn-BD");
  printWindow.document.write(`
    <html>
    <head><title>বকেয়া তালিকা</title>
    <style>
      body { font-family: 'Noto Sans Bengali', sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-bottom: 16px; }
      .header h1 { font-size: 20px; color: #1a3a1a; margin: 0; }
      .header p { font-size: 12px; color: #666; margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      th, td { padding: 8px 10px; text-align: left; border: 1px solid #ddd; font-size: 12px; }
      th { background: #f5f0e0; color: #333; font-weight: 700; }
      .total-row td { font-weight: 800; background: #fdf8e8; }
      .summary { margin-bottom: 16px; font-size: 13px; }
      .partial-badge { display: inline-block; background: #fff3cd; color: #856404; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
      .print-btn { display: block; margin: 20px auto; padding: 8px 24px; background: #d4af37; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
      @media print { .print-btn { display: none; } }
    </style>
    </head>
    <body>
      <div class="header">
        <h1>${institutionName}</h1>
        <p>${institutionAddress}</p>
        <p style="color:#d4af37;font-weight:bold;">বকেয়া ফি তালিকা</p>
        <p>তারিখ: ${today}</p>
      </div>
      <div class="summary">
        <p>মোট বকেয়া ছাত্র: <strong>${dueStudents.length}</strong> | মোট বকেয়া: <strong>৳${totalDueAll.toLocaleString("en-IN")}</strong>${totalPartialAll > 0 ? ` | আংশিক পরিশোধ: <strong style="color:#d4af37;">৳${totalPartialAll.toLocaleString("en-IN")}</strong>` : ""}</p>
      </div>
      <table>
        <thead>
          <tr><th>#</th><th>নাম</th><th>আইডি</th><th>শ্রেণি</th><th>বকেয়া মাস</th><th>আংশিক পরিশোধ</th><th>ফি বকেয়া</th><th>ভর্তি ফি</th><th>খরচ বকেয়া</th><th>সর্বমোট</th><th>স্ট্যাটাস</th></tr>
        </thead>
        <tbody>
          ${dueStudents.map((s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${s.name}</td>
              <td>${s.student_id}</td>
              <td>${s.class_name}</td>
              <td>${Math.max(0, s.dueMonths)} মাস</td>
              <td>${s.partialPaid > 0 ? `<span class="partial-badge">৳${s.partialPaid.toLocaleString("en-IN")}</span>` : "—"}</td>
              <td>৳${s.feeDueAmount.toLocaleString("en-IN")}</td>
              <td>${s.admissionDue > 0 ? "৳" + s.admissionDue.toLocaleString("en-IN") : "—"}</td>
              <td>${s.expDue > 0 ? "৳" + s.expDue.toLocaleString("en-IN") : "—"}</td>
              <td style="font-weight:700;">৳${s.totalDueAmount.toLocaleString("en-IN")}</td>
              <td>${(() => {
                if (s.totalDueAmount <= 0) return '<span style="color:#28a745;font-weight:600;">পরিশোধিত</span>';
                if (s.partialPaid > 0) return '<span style="color:#d4af37;font-weight:600;">আংশিক পরিশোধ</span>';
                if (s.dueMonths >= 3) return '<span style="color:#dc3545;font-weight:600;">অতিরিক্ত বকেয়া</span>';
                return '<span style="color:#f97316;font-weight:600;">বকেয়া</span>';
              })()}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="10" style="text-align:right;">সর্বমোট বকেয়া:</td>
            <td>৳${totalDueAll.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>
      <button class="print-btn" onclick="window.print()">🖨️ প্রিন্ট করুন</button>
    </body></html>
  `);
  printWindow.document.close();
}

export default function FeeDueListTab() {
  const { data: students = [] } = useStudents();
  const { data: payments = [] } = usePayments();
  const { data: studentExpenses = [] } = useStudentExpenses();
  const { data: classes = [] } = useClasses();
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [sendingSms, setSendingSms] = useState(false);
  const institution = useInstitutionInfo();

  const handleBulkSmsReminder = async () => {
    const configured = await isSmsApiConfigured();
    if (!configured) {
      showToast.error('SMS API কনফিগার করা হয়নি। সেটিংস > API সেটিংস থেকে SMS API তথ্য দিন।');
      return;
    }

    const smsRecipients = dueStudents
      .filter(s => s.smsPhone && s.smsPhone.trim().length >= 8)
      .map(s => ({
        phone: s.smsPhone,
        message: `আসসালামু আলাইকুম। ${institution.name} থেকে জানানো যাচ্ছে যে, ${s.name} (${s.student_id}) এর মোট বকেয়া ফি ৳${s.totalDueAmount.toLocaleString('en-IN')}। অনুগ্রহ করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করুন। ধন্যবাদ।`,
      }));

    if (smsRecipients.length === 0) {
      showToast.error('কোনো ছাত্রের অভিভাবকের ফোন নম্বর পাওয়া যায়নি');
      return;
    }

    if (!confirm(`${smsRecipients.length} জন অভিভাবককে SMS রিমাইন্ডার পাঠাতে চান?`)) return;

    setSendingSms(true);
    try {
      const result = await sendBulkSms(smsRecipients);
      if (result.sent > 0) {
        showToast.success(`${result.sent}/${result.total} SMS সফলভাবে পাঠানো হয়েছে`);
      }
      if (result.failed > 0) {
        showToast.error(`${result.failed} SMS পাঠানো ব্যর্থ হয়েছে`);
      }
    } catch (err: any) {
      showToast.error(`SMS পাঠানো ব্যর্থ: ${err?.message || 'অজানা সমস্যা'}`);
    }
    setSendingSms(false);
  };

  const dueStudents: DueStudent[] = students
    .filter((s) => s.status === "active")
    .filter(s => classFilter === "" || s.class_id === classFilter)
    .map((s) => {
      const now = new Date();
      const defaultStart = `${now.getFullYear()}-01-01`;
      const startStr = s.admission_date && s.admission_date.trim() ? s.admission_date : defaultStart;
      const totalMonths = countMonthsBetween(startStr, now);

      // Get monthly payments (exclude expense and admission payments)
      const monthlyPayments = payments.filter(
        (p) => p.student_id === s.student_id && !p.month.startsWith("EXP:") && p.month !== "ভর্তি ফি"
      );

      // Group by month and sum amounts to handle partial payments
      const monthPaymentMap: Record<string, number> = {};
      for (const p of monthlyPayments) {
        monthPaymentMap[p.month] = (monthPaymentMap[p.month] || 0) + p.amount;
      }

      // Count fully paid months (where total payments >= monthly_fee)
      const fullyPaidMonths = Object.values(monthPaymentMap).filter(
        (sum) => sum >= s.monthly_fee
      ).length;

      // Calculate partial amounts (months with some payment but not fully paid)
      const partialPaid = Object.values(monthPaymentMap)
        .filter((sum) => sum > 0 && sum < s.monthly_fee)
        .reduce((total, sum) => total + sum, 0);

      const dueMonths = totalMonths - fullyPaidMonths;
      const feeDueAmount = Math.max(0, dueMonths * s.monthly_fee - partialPaid);

      // Expense dues
      const sExpenses = studentExpenses.filter(e => e.studentId === s.student_id);
      const totalExp = sExpenses.reduce((sum, e) => sum + e.amount, 0);
      const expPaid = payments.filter(p => p.student_id === s.student_id && p.month.startsWith("EXP:")).reduce((sum, p) => sum + p.amount, 0);
      const expDue = Math.max(0, totalExp - expPaid);

      // Admission dues
      const admissionFee = s.admission_fee || 0;
      const admissionPaid = payments.filter(p => p.student_id === s.student_id && p.month === "ভর্তি ফি").reduce((sum, p) => sum + p.amount, 0);
      const admissionDue = Math.max(0, admissionFee - admissionPaid);

      const totalDueAmount = feeDueAmount + expDue + admissionDue;

      return {
        ...s,
        dueMonths,
        feeDueAmount,
        expDue,
        admissionDue,
        totalDueAmount,
        partialPaid,
        smsPhone: s.guardian_phone || "",
        whatsappPhone: s.guardian_whatsapp || "",
      };
    })
    .filter((s) => s.totalDueAmount > 0);

  const totalDueAll = dueStudents.reduce((s, d) => s + d.totalDueAmount, 0);
  const totalPartialAll = dueStudents.reduce((s, d) => s + d.partialPaid, 0);

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#dc3545' }}>{formatTaka(totalDueAll)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>মোট বকেয়া</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#f97316' }}>{toBengaliNumber(dueStudents.length)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>বকেয়া ছাত্র</p>
        </div>
        <div className="content-box" style={{ textAlign: 'center', padding: 16, marginBottom: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#d4af37' }}>{formatTaka(totalPartialAll)}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>আংশিক পরিশোধ</p>
        </div>
      </div>

      {/* Filter */}
      <div className="content-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <select className="glass-select" style={{ maxWidth: 250 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : "")}>
            <option value="">সকল শ্রেণি</option>
            {classes.map((c) => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-outline-gold" onClick={() => handlePrintDueList(dueStudents, totalDueAll, totalPartialAll, institution.name, institution.address)} disabled={dueStudents.length === 0}>
              <Icon name="fa-print" /> প্রিন্ট করুন
            </button>
            <button
              className="btn-gold"
              disabled={dueStudents.length === 0 || sendingSms}
              onClick={handleBulkSmsReminder}
            >
              {sendingSms ? <><Icon name="fa-spinner fa-spin" /> SMS পাঠানো হচ্ছে...</> : <><Icon name="fa-sms" /> Bulk SMS রিমাইন্ডার</>}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="content-box" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>নাম</th>
                <th>আইডি</th>
                <th>শ্রেণি</th>
                <th>বকেয়া মাস</th>
                <th>আংশিক পরিশোধ</th>
                <th>ফি বকেয়া</th>
                <th>ভর্তি ফি</th>
                <th>খরচ বকেয়া</th>
                <th>সর্বমোট</th>
                <th>স্ট্যাটাস</th>
                <th style={{ textAlign: 'center' }}>রিমাইন্ডার</th>
              </tr>
            </thead>
            <tbody>
              {dueStudents.map((s) => {
                const hasSms = !!s.smsPhone && s.smsPhone.trim().length >= 8;
                const hasWhatsApp = !!s.whatsappPhone && s.whatsappPhone.trim().length >= 8;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.student_id}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{s.class_name}</td>
                    <td style={{ color: '#dc3545' }}>
                      {toBengaliNumber(Math.max(0, s.dueMonths))} মাস
                      {s.partialPaid > 0 && (
                        <span style={{
                          display: 'inline-block',
                          marginLeft: 6,
                          background: 'rgba(212, 175, 55, 0.2)',
                          color: '#d4af37',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                        }}>
                          আংশিক
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#d4af37' }}>
                      {s.partialPaid > 0 ? formatTaka(s.partialPaid) : "—"}
                    </td>
                    <td style={{ color: '#dc3545' }}>{formatTaka(s.feeDueAmount)}</td>
                    <td style={{ color: '#f97316' }}>{s.admissionDue > 0 ? formatTaka(s.admissionDue) : "—"}</td>
                    <td style={{ color: '#fbbf24' }}>{s.expDue > 0 ? formatTaka(s.expDue) : "—"}</td>
                    <td style={{ color: '#dc3545', fontWeight: 800 }}>{formatTaka(s.totalDueAmount)}</td>
                    <td>
                      {(() => {
                        const badge = (() => {
                          if (s.totalDueAmount <= 0) return { label: 'পরিশোধিত', color: '#28a745', bg: 'rgba(40,167,69,0.15)', icon: 'fa-check-circle' };
                          if (s.partialPaid > 0) return { label: 'আংশিক পরিশোধ', color: '#d4af37', bg: 'rgba(212,175,55,0.15)', icon: 'fa-adjust' };
                          if (s.dueMonths >= 3) return { label: 'অতিরিক্ত বকেয়া', color: '#dc3545', bg: 'rgba(220,53,69,0.15)', icon: 'fa-exclamation-triangle' };
                          return { label: 'বকেয়া', color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: 'fa-clock' };
                        })();
                        return (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: badge.bg, color: badge.color, border: `1px solid ${badge.color}25`,
                            whiteSpace: 'nowrap',
                          }}>
                            <Icon name={badge.icon} size={10} /> {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {(hasWhatsApp || hasSms) ? (
                          <>
                            <button
                              onClick={() => hasWhatsApp && window.open(generateWhatsAppUrl(s.whatsappPhone, s.name, s.totalDueAmount, institution.name), "_blank")}
                              title={hasWhatsApp ? `WhatsApp রিমাইন্ডার (${s.whatsappPhone})` : "হোয়াটসঅ্যাপ নম্বর নেই"}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: hasWhatsApp ? '1px solid rgba(37, 211, 102, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                background: hasWhatsApp ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
                                color: hasWhatsApp ? '#25D366' : 'rgba(255,255,255,0.2)',
                                cursor: hasWhatsApp ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (hasWhatsApp) {
                                  e.currentTarget.style.background = 'rgba(37, 211, 102, 0.25)';
                                  e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.6)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasWhatsApp) {
                                  e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
                                  e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.3)';
                                }
                              }}
                            >
                              <WhatsAppIcon size={16} />
                            </button>
                            <button
                              onClick={() => hasSms && openSmsReminder(s.smsPhone, s.name, s.totalDueAmount, institution.name)}
                              title={hasSms ? `SMS রিমাইন্ডার (${s.smsPhone})` : "ফোন নম্বর নেই"}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: hasSms ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                background: hasSms ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                color: hasSms ? '#0ea5e9' : 'rgba(255,255,255,0.2)',
                                cursor: hasSms ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                              onMouseEnter={(e) => {
                                if (hasSms) {
                                  e.currentTarget.style.background = 'rgba(14, 165, 233, 0.25)';
                                  e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.6)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (hasSms) {
                                  e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                                  e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                                }
                              }}
                            >
                              <Icon name="fa-sms" size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              title="কোনো নম্বর নেই"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                color: 'rgba(255,255,255,0.2)',
                                cursor: 'not-allowed',
                              }}
                            >
                              <WhatsAppIcon size={16} />
                            </span>
                            <span
                              title="কোনো ফোন নম্বর নেই"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                color: 'rgba(255,255,255,0.2)',
                                cursor: 'not-allowed',
                              }}
                            >
                              <Icon name="fa-sms" size={14} />
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {dueStudents.length === 0 && (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: '#28a745' }}>
                  <Icon name="fa-check-circle" style={{ marginRight: 8 }} /> কোনো বকেয়া নেই
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
