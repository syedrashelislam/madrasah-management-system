import { useNavigate } from "react-router-dom";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { usePayments } from "@/hooks/usePayments";
import { useStudentExpenses } from "@/hooks/useStudentExpenses";
import { createHoverPrefetchProps } from "@/lib/prefetch";
import Icon from "@/components/Icon";
import { useUserRole } from "@/hooks/useUserRole";
import DataSectionSkeleton from "@/components/DataSectionSkeleton";
import { openBulkSmsReminders, generateFeeDueMessage, generateSmsUrl, generateWhatsAppUrl } from "@/lib/smsUtils";
import { sendBulkSms } from "@/lib/bulkSmsApi";
import { showToast } from "@/lib/showToast";
import { useInstitutionInfo } from "@/hooks/useInstitutionInfo";
import { printGuardianList } from "@/lib/buildGuardianListHTML";
import PageQuickNav from "@/components/PageQuickNav";

type SortOption = "name-asc" | "name-desc" | "id-asc" | "admission-desc" | "due-desc";

export default function StudentList() {
  const { data: students = [], isLoading } = useStudents();
  const { data: classes = [] } = useClasses();
  const { data: allPayments = [] } = usePayments();
  const { data: allExpenses = [] } = useStudentExpenses();
  const { canWrite } = useUserRole();
  const navigate = useNavigate();
  const institution = useInstitutionInfo();

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showFilters, setShowFilters] = useState(false);

  const dueMap = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (const s of students) {
      const admDateStr = s.admission_date && s.admission_date.trim() ? s.admission_date : null;
      const admDate = admDateStr ? new Date(admDateStr) : new Date();
      const validAdmDate = isNaN(admDate.getTime()) ? new Date() : admDate;
      const totalMonths = Math.max(1, (now.getFullYear() - validAdmDate.getFullYear()) * 12 + (now.getMonth() - validAdmDate.getMonth()) + 1);
      const totalFeeExpected = totalMonths * (s.monthly_fee || 0);
      const studentPayments = allPayments.filter((p) => p.student_id === s.student_id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const studentExps = allExpenses.filter((e) => e.studentId === s.student_id);
      const totalExpenses = studentExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const admissionFee = s.admission_fee || 0;
      const totalDue = totalFeeExpected - totalPaid + totalExpenses + admissionFee;
      map.set(s.student_id, Math.max(0, totalDue));
    }
    return map;
  }, [students, allPayments, allExpenses]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = students.filter((s) => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || (s.guardian_name || '').toLowerCase().includes(q) || (s.father_name || '').toLowerCase().includes(q) || (s.class_name || '').toLowerCase().includes(q) || (s.guardian_phone || '').includes(q) || (s.roll || '').includes(q);
      const matchClass = classFilter === "" || s.class_id === classFilter;
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name, "bn");
        case "name-desc": return b.name.localeCompare(a.name, "bn");
        case "id-asc": return (a.student_id || "").localeCompare(b.student_id || "");
        case "admission-desc": { const da = a.admission_date ? new Date(a.admission_date).getTime() : 0; const db = b.admission_date ? new Date(b.admission_date).getTime() : 0; return db - da; }
        case "due-desc": { const dA = dueMap.get(a.student_id) ?? 0; const dB = dueMap.get(b.student_id) ?? 0; return dB - dA; }
        default: return 0;
      }
    });
    return result;
  }, [students, search, classFilter, statusFilter, sortBy, dueMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStudents = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const resetPage = () => setCurrentPage(1);
  const activeCount = students.filter(s => s.status === "active").length;
  const dueCount = filtered.filter(s => (dueMap.get(s.student_id) ?? 0) > 0).length;

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* ══ Quick Page Navigation ══ */}
      <PageQuickNav />

      {/* ══ Page Header ══ */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#d4af37", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <Icon name="fa-user-graduate" /> ছাত্র তালিকা
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
              মোট {toBengaliNumber(filtered.length)} জন · সক্রিয় {toBengaliNumber(activeCount)} জন
            </p>
          </div>
          {/* Desktop action buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} className="sl-desktop-btns">
            <button className="btn-gold" style={{ background: "#28a745", borderColor: "#28a745", fontSize: 13 }}
              onClick={() => { const active = students.filter(s => s.status === "active"); if (!active.length) { showToast.error("কোনো সক্রিয় ছাত্র নেই"); return; } printGuardianList(students, institution); showToast.success(`${toBengaliNumber(active.length)} জনের তালিকা প্রিন্ট হচ্ছে`); }}>
              <Icon name="fa-print" size={13} /> অভিভাবক তালিকা
            </button>
            <button className="btn-gold" style={{ background: "#25D366", borderColor: "#25D366", fontSize: 13 }}
              onClick={() => { const list = filtered.filter(s => s.status === "active" && (s.guardian_whatsapp || "").length >= 8 && (dueMap.get(s.student_id) ?? 0) > 0); if (!list.length) { showToast.error("উপযুক্ত ছাত্র নেই"); return; } if (!window.confirm(`${toBengaliNumber(list.length)} জনকে WhatsApp পাঠাবেন?`)) return; list.forEach((s, i) => { const due = dueMap.get(s.student_id) ?? 0; setTimeout(() => window.open(generateWhatsAppUrl(s.guardian_whatsapp || "", generateFeeDueMessage(s.name, due, institution.name)), "_blank"), i * 600); }); }}>
              <Icon name="fa-whatsapp" size={13} /> WhatsApp
            </button>
            <button className="btn-gold" style={{ background: "#0ea5e9", borderColor: "#0ea5e9", fontSize: 13 }}
              onClick={() => { const list = filtered.filter(s => s.status === "active" && (s.guardian_phone || "").length >= 8 && (dueMap.get(s.student_id) ?? 0) > 0).map(s => ({ phone: s.guardian_phone || "", name: s.name, totalDueAmount: dueMap.get(s.student_id) ?? 0 })); if (!list.length) { showToast.error("উপযুক্ত ছাত্র নেই"); return; } if (!window.confirm(`${toBengaliNumber(list.length)} জনকে SMS পাঠাবেন?`)) return; sendBulkSms(list.map(s => ({ phone: s.phone, message: generateFeeDueMessage(s.name, s.totalDueAmount, institution.name) }))).then(r => { if (r.sent > 0) showToast.success(`${toBengaliNumber(r.sent)} টি SMS সফল`); if (r.failed > 0 && r.sent === 0) { openBulkSmsReminders(list, institution.name); showToast.info("API SMS ব্যর্থ — নেটিভ SMS চালু হচ্ছে"); } }); }}>
              <Icon name="fa-sms" size={13} /> SMS
            </button>
            {canWrite && (
              <button className="btn-gold" onClick={() => navigate("/students/new")} {...createHoverPrefetchProps("/students/new")}>
                <Icon name="fa-plus" /> নতুন ছাত্র ভর্তি
              </button>
            )}
          </div>
        </div>

        {/* Stats Pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { label: "মোট", value: students.length, color: "#d4af37" },
            { label: "সক্রিয়", value: activeCount, color: "#28a745" },
            { label: "বকেয়া", value: dueCount, color: "#dc3545" },
            { label: "ফিল্টার", value: filtered.length, color: "#0ea5e9" },
          ].map(st => (
            <div key={st.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${st.color}28`, borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: st.color, fontWeight: 800, fontSize: 15 }}>{toBengaliNumber(st.value)}</span>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{st.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ Search Bar ══ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ position: "relative" }}>
          <input className="glass-input" placeholder="নাম, আইডি, অভিভাবক, ফোন দিয়ে খুঁজুন..." value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            style={{ paddingLeft: 44, paddingRight: 52 }} />
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="fa-search" size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
          </span>
          <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4, alignItems: "center" }}>
            {search && <button onClick={() => { setSearch(""); resetPage(); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>✕</button>}
            <button onClick={() => setShowFilters(f => !f)} style={{ background: showFilters ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.07)", border: `1px solid ${showFilters ? "#d4af37" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: showFilters ? "#d4af37" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="fa-sliders-h" size={13} />
            </button>
          </div>
        </div>
        {showFilters && (
          <div style={{ marginTop: 10, padding: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, animation: "fadeIn 0.2s ease" }}>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>শ্রেণি</label>
              <select className="glass-select" value={classFilter} onChange={e => { setClassFilter(e.target.value ? Number(e.target.value) : ""); resetPage(); }}>
                <option value="">সকল শ্রেণি</option>
                {classes.map(c => <option key={c.id} value={c.class_id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>স্ট্যাটাস</label>
              <select className="glass-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage(); }}>
                <option value="">সকল</option>
                <option value="active">সক্রিয়</option>
                <option value="inactive">নিষ্ক্রিয়</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>সাজানো</label>
              <select className="glass-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
                <option value="name-asc">নাম (ক-য)</option>
                <option value="name-desc">নাম (য-ক)</option>
                <option value="id-asc">আইডি</option>
                <option value="admission-desc">ভর্তির তারিখ</option>
                <option value="due-desc">বকেয়া (বেশি)</option>
              </select>
            </div>
          </div>
        )}
        {search.trim() && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6, paddingLeft: 2 }}><Icon name="fa-filter" size={10} /> "{search}" — {toBengaliNumber(filtered.length)} জন পাওয়া গেছে</p>}
      </div>

      {/* ══ Content ══ */}
      {isLoading ? (
        <DataSectionSkeleton rows={5} columns={8} />
      ) : filtered.length === 0 ? (
        <div className="content-box" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>কোনো ছাত্র পাওয়া যায়নি</p>
          {search && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 6 }}>অনুসন্ধান পরিবর্তন করুন</p>}
        </div>
      ) : (
        <>
          {/* ─── MOBILE: Card View ─── */}
          <div className="sl-mobile-cards">
            {paginatedStudents.map(s => {
              const routeId = s.student_id || s.id;
              const due = dueMap.get(s.student_id) ?? 0;
              return (
                <div key={s.id} onClick={() => navigate(`/students/${routeId}`)}
                  style={{ background: "var(--th-card-bg)", border: `1px solid ${due > 0 ? "rgba(220,53,69,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "14px 16px", marginBottom: 10, cursor: "pointer", position: "relative", overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s", WebkitTapHighlightColor: "transparent" }}
                  onTouchStart={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(0.985)"}
                  onTouchEnd={e => (e.currentTarget as HTMLDivElement).style.transform = ""}
                >
                  {due > 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "linear-gradient(to bottom, #dc3545, #c62828)", borderRadius: "16px 0 0 16px" }} />}
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <img src={s.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}&backgroundColor=1a7a4f&textColor=ffffff`} alt={s.name}
                      style={{ width: 52, height: 52, borderRadius: 12, border: "2px solid rgba(212,175,55,0.25)", flexShrink: 0, objectFit: "cover" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: "#fff", margin: 0, lineHeight: 1.3 }}>{s.name}</p>
                        <span className={s.status === "active" ? "badge-success" : "badge-gold"} style={{ fontSize: 10, flexShrink: 0 }}>
                          {s.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "3px 0 8px" }}>
                        {s.student_id} · {s.class_name}{s.roll ? ` · রোল: ${s.roll}` : ""}
                      </p>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 1px" }}>অভিভাবক</p>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 500 }}>{s.guardian_name || s.father_name || "—"}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 1px" }}>মাসিক ফি</p>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0 }}>{formatTaka(s.monthly_fee ?? 0)}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 1px" }}>বকেয়া</p>
                          <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: due > 0 ? "#fc8181" : "#68d391" }}>{formatTaka(due)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    {(s.guardian_phone || "").length >= 8 && (
                      <a href={`tel:${s.guardian_phone}`} onClick={e => e.stopPropagation()}
                        style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <Icon name="fa-phone" size={11} /> কল
                      </a>
                    )}
                    {(s.guardian_whatsapp || "").length >= 8 && due > 0 && (
                      <button onClick={e => { e.stopPropagation(); window.open(generateWhatsAppUrl(s.guardian_whatsapp || "", generateFeeDueMessage(s.name, due, institution.name)), "_blank"); }}
                        style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.08)", color: "#25D366", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        <Icon name="fa-whatsapp" size={12} /> WA
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); navigate(`/students/${routeId}`); }}
                      style={{ flex: 2, padding: "8px 0", borderRadius: 8, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#d4af37", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon name="fa-eye" size={12} /> বিস্তারিত
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── DESKTOP: Table View ─── */}
          <div className="sl-desktop-table content-box" style={{ padding: 0 }}>
            <div className="mobile-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ছবি</th><th>নাম</th><th>আইডি</th><th>অভিভাবক</th>
                    <th>জন্ম তারিখ</th><th>শ্রেণি</th><th>মাসিক ফি</th>
                    <th>বকেয়া</th><th>ফোন</th>
                    <th style={{ textAlign: "center" }}>WA</th>
                    <th style={{ textAlign: "center" }}>SMS</th>
                    <th>স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map(s => {
                    const routeId = s.student_id || s.id;
                    const due = dueMap.get(s.student_id) ?? 0;
                    return (
                      <tr key={s.id} onClick={() => navigate(`/students/${routeId}`)} style={{ cursor: "pointer" }} {...createHoverPrefetchProps(`/students/${routeId}`)}>
                        <td><img src={s.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}&backgroundColor=1a7a4f&textColor=ffffff`} alt={s.name} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.3)", objectFit: "cover" }} /></td>
                        <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{s.name}</td>
                        <td>{s.student_id}</td>
                        <td style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, whiteSpace: "nowrap" }}>{s.guardian_name || s.father_name || "—"}</td>
                        <td style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, direction: "ltr" }}>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" }) : "—"}</td>
                        <td>{s.class_name}</td>
                        <td>{formatTaka(s.monthly_fee ?? 0)}</td>
                        <td style={{ fontWeight: 600, color: due > 0 ? "#dc3545" : "#28a745" }}>{formatTaka(due)}</td>
                        <td style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, direction: "ltr" }}>{s.guardian_phone || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {(s.guardian_whatsapp || "").length >= 8 && due > 0
                            ? <button onClick={e => { e.stopPropagation(); window.open(generateWhatsAppUrl(s.guardian_whatsapp || "", generateFeeDueMessage(s.name, due, institution.name)), "_blank"); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.1)", color: "#25D366", cursor: "pointer" }}><Icon name="fa-whatsapp" size={14} /></button>
                            : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {(s.guardian_phone || "").length >= 8 && due > 0
                            ? <button onClick={e => { e.stopPropagation(); window.open(generateSmsUrl(s.guardian_phone || "", generateFeeDueMessage(s.name, due, institution.name)), "_self"); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(14,165,233,0.3)", background: "rgba(14,165,233,0.1)", color: "#0ea5e9", cursor: "pointer" }}><Icon name="fa-sms" size={14} /></button>
                            : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span className={s.status === "active" ? "badge-success" : "badge-gold"}>{s.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                            <span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, background: (s.admission_status || "approved") === "approved" ? "rgba(40,167,69,0.15)" : (s.admission_status || "approved") === "pending" ? "rgba(255,193,7,0.15)" : "rgba(220,53,69,0.15)", color: (s.admission_status || "approved") === "approved" ? "#28a745" : (s.admission_status || "approved") === "pending" ? "#ffc107" : "#dc3545" }}>
                              {(s.admission_status || "approved") === "approved" ? "অনুমোদিত" : (s.admission_status || "approved") === "pending" ? "অপেক্ষমান" : "বাতিল"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Pagination ─── */}
          {filtered.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "10px 2px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12 }}>মোট {toBengaliNumber(filtered.length)} এর মধ্যে {toBengaliNumber((safePage - 1) * pageSize + 1)}–{toBengaliNumber(Math.min(safePage * pageSize, filtered.length))}</span>
                <select className="glass-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}>
                  {[10, 20, 50, 100].map(n => <option key={n} value={n}>{toBengaliNumber(n)} টি</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[["«", 1], ["‹", Math.max(1, safePage - 1)]].map(([label, page]) => (
                  <button key={label as string} onClick={() => setCurrentPage(page as number)} disabled={safePage <= 1}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: safePage <= 1 ? "not-allowed" : "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: safePage <= 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)" }}>{label}</button>
                ))}
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1).reduce<(number | "dots")[]>((acc, p, i, arr) => { if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots"); acc.push(p); return acc; }, []).map((item, i) =>
                  item === "dots" ? <span key={`d${i}`} style={{ padding: "0 4px", color: "rgba(255,255,255,0.3)" }}>…</span>
                    : <button key={item} onClick={() => setCurrentPage(item as number)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: safePage === item ? "#d4af37" : "rgba(255,255,255,0.05)", border: safePage === item ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.1)", color: safePage === item ? "#0a1f0a" : "rgba(255,255,255,0.7)" }}>{toBengaliNumber(item as number)}</button>
                )}
                {[["›", Math.min(totalPages, safePage + 1)], ["»", totalPages]].map(([label, page]) => (
                  <button key={label as string} onClick={() => setCurrentPage(page as number)} disabled={safePage >= totalPages}
                    style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, cursor: safePage >= totalPages ? "not-allowed" : "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: safePage >= totalPages ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)" }}>{label}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Mobile FAB Button ── */}
      {canWrite && (
        <button onClick={() => navigate("/students/new")}
          className="sl-fab"
          style={{ position: "fixed", bottom: 88, right: 20, zIndex: 999, width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg, #d4af37, #b8960c)", border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer", boxShadow: "0 4px 24px rgba(212,175,55,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, color: "#0a1f0a", fontWeight: 700, transition: "transform 0.15s, box-shadow 0.15s" }}
          onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
          onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
          title="নতুন ছাত্র ভর্তি">+</button>
      )}

      <style>{`
        @media (min-width: 768px) {
          .sl-mobile-cards { display: none !important; }
          .sl-fab { display: none !important; }
        }
        @media (max-width: 767px) {
          .sl-desktop-table { display: none !important; }
          .sl-desktop-btns { display: none !important; }
        }
      `}</style>
    </div>
  );
}
