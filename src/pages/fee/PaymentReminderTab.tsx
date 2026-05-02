import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/useStudents";
import { usePayments } from "@/hooks/usePayments";
import { useStudentExpenses } from "@/hooks/useStudentExpenses";
import { useClasses } from "@/hooks/useClasses";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import { useInstitutionInfo, type InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Icon from "@/components/Icon";
import { openSmsReminder, openBulkSmsReminders } from "@/lib/smsUtils";
import { sendBulkSms } from "@/lib/bulkSmsApi";
import { sendBulkEmails } from "@/lib/bulkEmailApi";

function countMonthsBetween(startDate: string, endDate: Date): number {
  const start = new Date(startDate);
  return (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth()) + 1;
}

interface DueStudentReminder {
  student_id: string;
  name: string;
  father_name: string;
  class_name: string;
  phone: string;
  whatsapp: string;
  feeDueAmount: number;
  admissionDue: number;
  expDue: number;
  totalDueAmount: number;
  hasPartial: boolean;
}

function generateWhatsAppUrl(phone: string, name: string, due: number, madrasa: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  const bd = clean.startsWith("0") ? "88" + clean : clean.startsWith("88") ? clean : "88" + clean;
  const msg = `আসসালামু আলাইকুম,\n\n${madrasa} থেকে জানানো যাচ্ছে যে, ${name} এর মোট বকেয়া ফি ৳${due.toLocaleString("en-IN")}।\n\nঅনুগ্রহ করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করুন।\n\nধন্যবাদ।`;
  return `https://wa.me/${bd}?text=${encodeURIComponent(msg)}`;
}

function printReminderLetter(list: DueStudentReminder[], inst: InstitutionInfo) {
  const w = window.open("", "_blank", "width=800,height=600");
  if (!w) return;
  const today = new Date().toLocaleDateString("bn-BD");
  const pages = list.map((s) => `<div class="page">
    <div class="hdr">${inst.logoUrl ? `<img src="${inst.logoUrl}" class="logo"/>` : ""}<h1>${inst.name}</h1>
    ${inst.subtitle ? `<p class="sub">${inst.subtitle}</p>` : ""}<p>${inst.address}</p>
    <div class="div"></div><p class="ttl">বকেয়া ফি পরিশোধের স্মারকপত্র</p></div>
    <p class="dt">তারিখ: ${today}</p>
    <p class="to">প্রতি,<br/><strong>${s.father_name || "অভিভাবক"}</strong><br/>ছাত্র <strong>${s.name}</strong> (${s.student_id}) — শ্রেণি: ${s.class_name}</p>
    <p>বিষয়: <strong>বকেয়া ফি পরিশোধের অনুরোধ</strong></p>
    <p>জনাব,<br/>আসসালামু আলাইকুম। আপনার সন্তান <strong>${s.name}</strong> এর নিম্নলিখিত ফি বকেয়া রয়েছে:</p>
    <table><tr><td>মাসিক ফি বকেয়া</td><td class="amt">৳${s.feeDueAmount.toLocaleString("en-IN")}</td></tr>
    ${s.admissionDue > 0 ? `<tr><td>ভর্তি ফি বকেয়া</td><td class="amt">৳${s.admissionDue.toLocaleString("en-IN")}</td></tr>` : ""}
    ${s.expDue > 0 ? `<tr><td>খরচ বকেয়া</td><td class="amt">৳${s.expDue.toLocaleString("en-IN")}</td></tr>` : ""}
    <tr class="tot"><td><strong>সর্বমোট</strong></td><td class="amt"><strong>৳${s.totalDueAmount.toLocaleString("en-IN")}</strong></td></tr></table>
    <p>অনুগ্রহ করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করুন। সহযোগিতার জন্য ধন্যবাদ।</p>
    <div class="sig"><div><div class="sl"></div><p>কর্তৃপক্ষের স্বাক্ষর ও সীল</p></div></div>
    ${inst.phone ? `<p class="fi">যোগাযোগ: ${inst.phone}</p>` : ""}</div>`).join('<div class="pb"></div>');
  w.document.write(`<html><head><title>স্মারকপত্র</title><style>
    body{font-family:'Noto Sans Bengali',sans-serif;margin:0;padding:20px;color:#1a1a1a}
    .page{max-width:700px;margin:0 auto 40px;padding:30px;border:2px solid #d4af37;border-radius:8px}
    .hdr{text-align:center;margin-bottom:20px} .hdr h1{font-size:22px;margin:0;color:#1a3a1a}
    .hdr .sub{font-size:13px;color:#666;margin:2px 0} .hdr p{font-size:12px;color:#555;margin:3px 0}
    .hdr .logo{width:60px;height:60px;object-fit:contain;margin-bottom:6px}
    .div{height:2px;background:linear-gradient(90deg,transparent,#d4af37,transparent);margin:10px 0}
    .ttl{font-size:16px;font-weight:700;color:#d4af37;margin-top:8px}
    .dt{text-align:right;font-size:13px;color:#555} .to{margin:16px 0;font-size:14px;line-height:1.8}
    p{font-size:14px;line-height:1.7}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    td{padding:10px 14px;border:1px solid #ddd;font-size:14px} .amt{text-align:right;font-weight:600}
    .tot td{background:#fdf8e8;border-color:#d4af37}
    .sig{margin-top:50px;display:flex;justify-content:flex-end}
    .sl{width:200px;border-bottom:1px solid #333;margin-bottom:6px}
    .sig p{font-size:12px;color:#555;text-align:center;margin:0}
    .fi{font-size:11px;color:#888;text-align:center;margin-top:30px}
    .pb{page-break-after:always}
    .pbtn{display:block;margin:20px auto;padding:10px 28px;background:#d4af37;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:15px}
    @media print{.pbtn{display:none}.page{border:1px solid #ccc}}
  </style></head><body>${pages}<button class="pbtn" onclick="window.print()">🖨️ প্রিন্ট করুন</button></body></html>`);
  w.document.close();
}

export default function PaymentReminderTab() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: studentExpenses = [] } = useStudentExpenses();
  const { data: classes = [] } = useClasses();
  const institution = useInstitutionInfo();
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [minDue, setMinDue] = useState(0);
  const [search, setSearch] = useState("");

  const dueStudents = useMemo<DueStudentReminder[]>(() => {
    const now = new Date();
    return students
      .filter((s) => s.status === "active")
      .filter((s) => classFilter === "" || s.class_id === classFilter)
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q);
      })
      .map((s) => {
        const defaultStart = `${now.getFullYear()}-01-01`;
        const startStr = s.admission_date && s.admission_date.trim() ? s.admission_date : defaultStart;
        const totalMonths = countMonthsBetween(startStr, now);
        const monthlyPay = payments.filter((p) => p.student_id === s.student_id && !p.month.startsWith("EXP:") && p.month !== "ভর্তি ফি");
        const mMap: Record<string, number> = {};
        for (const p of monthlyPay) mMap[p.month] = (mMap[p.month] || 0) + p.amount;
        const fullyPaid = Object.values(mMap).filter((v) => v >= s.monthly_fee).length;
        const partialPaid = Object.values(mMap).filter((v) => v > 0 && v < s.monthly_fee).reduce((t, v) => t + v, 0);
        const hasPartial = Object.values(mMap).some((v) => v > 0 && v < s.monthly_fee);
        const feeDueAmount = Math.max(0, (totalMonths - fullyPaid) * s.monthly_fee - partialPaid);
        const sExp = studentExpenses.filter((e) => e.studentId === s.student_id);
        const totalExp = sExp.reduce((a, e) => a + e.amount, 0);
        const expPaid = payments.filter((p) => p.student_id === s.student_id && p.month.startsWith("EXP:")).reduce((a, p) => a + p.amount, 0);
        const expDue = Math.max(0, totalExp - expPaid);
        const admFee = s.admission_fee || 0;
        const admPaid = payments.filter((p) => p.student_id === s.student_id && p.month === "ভর্তি ফি").reduce((a, p) => a + p.amount, 0);
        const admissionDue = Math.max(0, admFee - admPaid);
        return {
          student_id: s.student_id, name: s.name, father_name: s.father_name,
          class_name: s.class_name,
          phone: s.guardian_phone || "",
          whatsapp: s.guardian_whatsapp || "",
          feeDueAmount, admissionDue, expDue,
          totalDueAmount: feeDueAmount + expDue + admissionDue, hasPartial,
        };
      })
      .filter((s) => s.totalDueAmount > 0 && s.totalDueAmount >= minDue);
  }, [students, payments, studentExpenses, classFilter, search, minDue]);

  const totalDue = dueStudents.reduce((a, d) => a + d.totalDueAmount, 0);
  const withPhone = dueStudents.filter((s) => s.phone.length >= 8);
  const withWhatsApp = dueStudents.filter((s) => s.whatsapp.length >= 8);

  const handleBulkWhatsApp = () => {
    if (withWhatsApp.length === 0) { toast.error("হোয়াটসঅ্যাপ নম্বর সহ কোনো ছাত্র নেই"); return; }
    if (!window.confirm(`${toBengaliNumber(withWhatsApp.length)} জন অভিভাবককে WhatsApp রিমাইন্ডার পাঠাতে চান?`)) return;
    withWhatsApp.forEach((s, i) => setTimeout(() => window.open(generateWhatsAppUrl(s.whatsapp, s.name, s.totalDueAmount, institution.name), "_blank"), i * 600));
    toast.success(`${toBengaliNumber(withWhatsApp.length)} টি WhatsApp লিংক ওপেন হচ্ছে...`);
  };

  const [smsSending, setSmsSending] = useState(false);

  const handleBulkSms = async () => {
    if (withPhone.length === 0) { toast.error("ফোন নম্বর সহ কোনো ছাত্র নেই"); return; }
    if (!window.confirm(`${toBengaliNumber(withPhone.length)} জন অভিভাবককে SMS রিমাইন্ডার পাঠাতে চান?`)) return;

    setSmsSending(true);
    try {
      const recipients = withPhone.map((s) => ({
        phone: s.phone,
        message: `আসসালামু আলাইকুম,\n${institution.name} থেকে জানানো যাচ্ছে যে, ${s.name} এর মোট বকেয়া ফি ৳${s.totalDueAmount.toLocaleString("en-IN")}।\nঅনুগ্রহ করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করুন।\nধন্যবাদ।`,
      }));

      const result = await sendBulkSms(recipients);

      if (result.sent > 0) {
        toast.success(`${toBengaliNumber(result.sent)}/${toBengaliNumber(result.total)} টি SMS পাঠানো সফল হয়েছে`);
      }
      if (result.failed > 0) {
        const firstError = result.results.find((r) => !r.success)?.error || "";
        toast.error(`${toBengaliNumber(result.failed)} টি SMS পাঠানো ব্যর্থ হয়েছে${firstError ? `: ${firstError}` : ""}`);
      }
    } catch (err: any) {
      toast.error("SMS পাঠাতে সমস্যা: " + (err?.message || "অজানা ত্রুটি"));
      // Fallback to native SMS
      openBulkSmsReminders(withPhone, institution.name);
    }
    setSmsSending(false);
  };

  const handleBulkPrint = () => {
    if (dueStudents.length === 0) { toast.error("প্রিন্ট করার জন্য কোনো বকেয়া ছাত্র নেই"); return; }
    printReminderLetter(dueStudents, institution);
  };

  if (loadingStudents || loadingPayments) return <Skeleton className="h-64" style={{ borderRadius: 10 }} />;

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          { val: toBengaliNumber(dueStudents.length), label: "বকেয়া ছাত্র সংখ্যা", color: "#f97316" },
          { val: formatTaka(totalDue), label: "মোট বকেয়া পরিমাণ", color: "#dc3545" },
          { val: toBengaliNumber(withPhone.length), label: "ফোন নম্বর আছে (SMS)", color: "#0ea5e9" },
          { val: toBengaliNumber(withWhatsApp.length), label: "হোয়াটসঅ্যাপ আছে", color: "#25D366" },
        ].map((c, i) => (
          <div key={i} className="content-box" style={{ textAlign: "center", padding: 16, marginBottom: 0 }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: c.color, margin: 0 }}>{c.val}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Bulk Actions */}
      <div className="content-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1 }}>
            <div style={{ minWidth: 160 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>শ্রেণি</label>
              <select className="glass-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : "")}>
                <option value="">সকল শ্রেণি</option>
                {classes.map((c) => <option key={c.class_id} value={c.class_id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ minWidth: 130 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>সর্বনিম্ন বকেয়া</label>
              <input className="glass-input" type="number" min={0} step={100} value={minDue} onChange={(e) => setMinDue(Number(e.target.value) || 0)} placeholder="০" />
            </div>
            <div style={{ minWidth: 180, flex: 1 }}>
              <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 4 }}>নাম/আইডি সার্চ</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <Icon name="fa-search" size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
                </span>
                <input className="glass-input" style={{ paddingLeft: 36 }} placeholder="সার্চ করুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn-gold" style={{ background: "#25D366", borderColor: "#25D366", fontSize: 13, whiteSpace: "nowrap" }} onClick={handleBulkWhatsApp} disabled={withWhatsApp.length === 0}>
              <Icon name="fa-whatsapp" size={14} /> সকলকে WhatsApp
            </button>
            <button className="btn-gold" style={{ background: "#0ea5e9", borderColor: "#0ea5e9", fontSize: 13, whiteSpace: "nowrap" }} onClick={handleBulkSms} disabled={withPhone.length === 0 || smsSending}>
              <Icon name={smsSending ? "fa-spinner fa-spin" : "fa-sms"} size={14} /> {smsSending ? "পাঠানো হচ্ছে..." : "সকলকে SMS"}
            </button>
            <button className="btn-outline-gold" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={handleBulkPrint} disabled={dueStudents.length === 0}>
              <Icon name="fa-print" size={14} /> সকল চিঠি প্রিন্ট
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {dueStudents.length === 0 ? (
        <div className="content-box" style={{ textAlign: "center", padding: 48 }}>
          <Icon name="fa-check-circle" size={32} style={{ color: "#28a745", marginBottom: 12 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: "#28a745", margin: "8px 0 4px" }}>কোনো বকেয়া ছাত্র নেই</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>সকল ফি পরিশোধিত</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {dueStudents.map((s) => (
            <div key={s.student_id} className="content-box" style={{ padding: 0, marginBottom: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{s.name}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "3px 0 0" }}>{s.student_id} • {s.class_name}</p>
                  </div>
                  {s.hasPartial && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>আংশিক</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "6px 0 0", display: "flex", flexDirection: "column", gap: 2 }}>
                  {s.phone ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="fa-phone" size={11} style={{ color: "#0ea5e9" }} /> {s.phone}
                    </span>
                  ) : (
                    <span style={{ color: "rgba(220,53,69,0.7)" }}><Icon name="fa-exclamation-triangle" size={11} /> ফোন নম্বর নেই</span>
                  )}
                  {s.whatsapp && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon name="fa-whatsapp" size={11} style={{ color: "#25D366" }} /> {s.whatsapp}
                    </span>
                  )}
                </div>
              </div>
              {/* Breakdown */}
              <div style={{ padding: "10px 16px" }}>
                {s.feeDueAmount > 0 && <DueRow label="মাসিক ফি বকেয়া" value={formatTaka(s.feeDueAmount)} color="#dc3545" />}
                {s.admissionDue > 0 && <DueRow label="ভর্তি ফি বকেয়া" value={formatTaka(s.admissionDue)} color="#f97316" />}
                {s.expDue > 0 && <DueRow label="খরচ বকেয়া" value={formatTaka(s.expDue)} color="#fbbf24" />}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>সর্বমোট বকেয়া</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#dc3545" }}>{formatTaka(s.totalDueAmount)}</span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8, padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <button
                  onClick={() => {
                    if (!s.whatsapp || s.whatsapp.length < 8) { toast.error("হোয়াটসঅ্যাপ নম্বর নেই"); return; }
                    window.open(generateWhatsAppUrl(s.whatsapp, s.name, s.totalDueAmount, institution.name), "_blank");
                  }}
                  disabled={!s.whatsapp || s.whatsapp.length < 8}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, color: "#fff",
                    background: s.whatsapp && s.whatsapp.length >= 8 ? "#25D366" : "rgba(255,255,255,0.08)",
                    opacity: s.whatsapp && s.whatsapp.length >= 8 ? 1 : 0.4, transition: "opacity 0.2s",
                  }}
                >
                  <Icon name="fa-whatsapp" size={13} /> WhatsApp
                </button>
                <button
                  onClick={() => {
                    if (!s.phone || s.phone.length < 8) { toast.error("ফোন নম্বর নেই"); return; }
                    openSmsReminder(s.phone, s.name, s.totalDueAmount, institution.name);
                  }}
                  disabled={!s.phone || s.phone.length < 8}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, color: "#fff",
                    background: s.phone && s.phone.length >= 8 ? "#0ea5e9" : "rgba(255,255,255,0.08)",
                    opacity: s.phone && s.phone.length >= 8 ? 1 : 0.4, transition: "opacity 0.2s",
                  }}
                >
                  <Icon name="fa-sms" size={13} /> SMS
                </button>
                <button
                  onClick={() => printReminderLetter([s], institution)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, color: "#d4af37",
                    background: "transparent", border: "1px solid rgba(212,175,55,0.4)",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(212,175,55,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon name="fa-file-alt" size={13} /> চিঠি
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DueRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}
