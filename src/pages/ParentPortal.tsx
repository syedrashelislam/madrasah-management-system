import { useParentEmailAuth } from "@/hooks/useParentEmailAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSettings } from "@/hooks/useSettings";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";
import type { StudentRow } from "@/hooks/useStudents";
import ExamResultCard from "@/pages/parent/ExamResultCard";
import type { ExamGroup } from "@/pages/parent/ExamResultCard";

/* ── Data types ── */
interface AttendanceRow { id: string; student_id: string; date: string; status: string }
interface PaymentRow { id: string; student_id: string; amount: number; month: string; payment_date: string; method?: string; fee_type?: string }
interface ExamSubjectRow { id: string; exam_id: string; name: string; full_marks: number; pass_marks: number }
interface MarkEntryRow { id: string; exam_id: string; student_id: string; subject_name: string; marks: number }
interface NoticeRow { id: string; title: string; content: string; date: string; priority: string; pinned: number; target: string }

type TabKey = "profile" | "attendance" | "fees" | "results" | "notices";

/* ══════════════════════════════════════════
   PORTAL HEADER  (matches main app style)
══════════════════════════════════════════ */
function PortalHeader({
  madrasaName,
  madrasaSubtitle,
  logoUrl,
  portalLabel,
  userLabel,
  onLogout,
}: {
  madrasaName: string;
  madrasaSubtitle: string;
  logoUrl: string;
  portalLabel: string;
  userLabel: string;
  onLogout: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 200,
      background: scrolled
        ? "rgba(10,16,36,0.97)"
        : "linear-gradient(135deg,rgba(10,14,30,0.98) 0%,rgba(20,28,56,0.98) 100%)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(212,175,55,0.15)",
      boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,0.5)" : "none",
      transition: "background 0.3s,box-shadow 0.3s",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", height: 62, padding: "0 16px", gap: 12 }}>
        {/* Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))",
            border: "1.5px solid rgba(212,175,55,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ color: "#d4af37", fontSize: 20, fontWeight: 800 }}>م</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {madrasaName}
            </div>
            {madrasaSubtitle && (
              <div style={{ fontSize: 10, color: "rgba(212,175,55,0.75)", fontWeight: 600, letterSpacing: "0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {madrasaSubtitle}
              </div>
            )}
          </div>
        </div>

        {/* Portal badge */}
        <div style={{
          padding: "4px 12px", borderRadius: 20, flexShrink: 0,
          background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
          fontSize: 11, fontWeight: 700, color: "#c084fc", display: "flex", alignItems: "center", gap: 5,
        }}>
          <Icon name="fa-users" size={10} />
          <span style={{ display: "none" }} className="badge-text">{portalLabel}</span>
          <span className="badge-text-mobile">{portalLabel}</span>
        </div>

        {/* User + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.55)", maxWidth: 120,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Icon name="fa-user" size={10} style={{ color: "rgba(212,175,55,0.7)" }} />
            {userLabel}
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: "6px 12px", borderRadius: 9, cursor: "pointer", flexShrink: 0,
              background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)",
              color: "#fca5a5", fontSize: 12, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <Icon name="fa-sign-out-alt" size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════
   BOTTOM TAB BAR
══════════════════════════════════════════ */
function BottomTabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; icon: string; label: string; color: string }[] = [
    { key: "profile",    icon: "fa-user",           label: "প্রোফাইল",  color: "#a855f7" },
    { key: "attendance", icon: "fa-calendar-check", label: "হাজিরা",    color: "#34d399" },
    { key: "fees",       icon: "fa-coins",           label: "ফি",         color: "#f59e0b" },
    { key: "results",    icon: "fa-trophy",          label: "ফলাফল",     color: "#60a5fa" },
    { key: "notices",    icon: "fa-bullhorn",        label: "নোটিশ",     color: "#f87171" },
  ];
  return (
    <>
      {/* Spacer so content doesn't hide behind bar */}
      <div style={{ height: 72 }} />
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
        background: "rgba(10,14,30,0.97)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(212,175,55,0.12)",
        display: "flex", height: 66, paddingBottom: "env(safe-area-inset-bottom,0px)",
      }}>
        {tabs.map(t => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 4, border: "none", cursor: "pointer",
                background: "transparent", padding: "8px 0",
                position: "relative", transition: "all 0.2s",
              }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
                  borderRadius: "0 0 3px 3px", background: t.color,
                }} />
              )}
              <span style={{
                width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? `${t.color}22` : "transparent",
                transition: "background 0.2s",
              }}>
                <Icon name={t.icon} size={18} style={{ color: isActive ? t.color : "rgba(255,255,255,0.35)", transition: "color 0.2s" }} />
              </span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? t.color : "rgba(255,255,255,0.35)", transition: "color 0.2s" }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ══════════════════════════════════════════
   CHILD SELECTOR
══════════════════════════════════════════ */
function ChildSelector({ children, selectedIdx, onChange }: {
  children: StudentRow[];
  selectedIdx: number;
  onChange: (i: number) => void;
}) {
  if (children.length <= 1) return null;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
      {children.map((child, idx) => (
        <button
          key={child.student_id}
          onClick={() => onChange(idx)}
          style={{
            flexShrink: 0, padding: "8px 18px", borderRadius: 24, cursor: "pointer",
            fontSize: 13, fontWeight: 600, border: "none",
            background: idx === selectedIdx ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.05)",
            color: idx === selectedIdx ? "#a855f7" : "rgba(255,255,255,0.55)",
            boxShadow: idx === selectedIdx ? "0 0 0 1.5px rgba(168,85,247,0.4)" : "0 0 0 1px rgba(255,255,255,0.08)",
            transition: "all 0.18s",
          }}
        >
          <Icon name="fa-user-graduate" size={12} style={{ marginRight: 6 }} />
          {child.name}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   PROFILE TAB
══════════════════════════════════════════ */
function ProfileTab({ student }: { student: StudentRow }) {
  const fields = [
    { label: "ছাত্র আইডি", value: student.student_id, icon: "fa-id-card" },
    { label: "শ্রেণি",      value: student.class_name, icon: "fa-graduation-cap" },
    { label: "রোল",         value: student.roll,        icon: "fa-list-ol" },
    { label: "সেকশন",       value: student.section,     icon: "fa-layer-group" },
    { label: "পিতার নাম",  value: student.father_name, icon: "fa-user" },
    { label: "মাতার নাম",  value: student.mother_name, icon: "fa-user" },
    { label: "অভিভাবক",    value: student.guardian_name, icon: "fa-users" },
    { label: "মোবাইল",     value: student.guardian_phone || student.contact, icon: "fa-phone" },
    { label: "ঠিকানা",     value: student.address,     icon: "fa-map-marker-alt" },
    { label: "রক্তের গ্রুপ",value: student.blood_group, icon: "fa-tint" },
    { label: "ধর্ম",        value: (student as any).religion, icon: "fa-book-open" },
    { label: "মাসিক ফি",   value: formatTaka(student.monthly_fee), icon: "fa-coins" },
  ].filter(f => f.value && f.value !== "—");

  return (
    <div>
      {/* Hero Card */}
      <div style={{
        background: "linear-gradient(135deg,rgba(88,28,135,0.25) 0%,rgba(107,33,168,0.1) 100%)",
        border: "1px solid rgba(168,85,247,0.2)", borderRadius: 20,
        padding: "24px 20px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 20 }}>
          <div style={{
            width: 84, height: 84, borderRadius: 20, flexShrink: 0,
            background: "rgba(168,85,247,0.15)", border: "2px solid rgba(168,85,247,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {student.photo_url
              ? <img src={student.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Icon name="fa-user-graduate" size={34} style={{ color: "#a855f7" }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.3px" }}>{student.name}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {student.class_name && <Chip label={student.class_name} icon="fa-graduation-cap" color="#a855f7" />}
              {student.roll && <Chip label={`রোল ${student.roll}`} color="#d4af37" />}
              {student.section && <Chip label={`সেকশন ${student.section}`} color="#60a5fa" />}
              {student.blood_group && <Chip label={student.blood_group} color="#f87171" />}
              <Chip label="সক্রিয়" color="#34d399" dot />
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: "rgba(168,85,247,0.12)", marginBottom: 18 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "12px 20px" }}>
          {fields.map(f => (
            <div key={f.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon name={f.icon} size={12} style={{ color: "#a855f7" }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600, wordBreak: "break-word" }}>{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ATTENDANCE TAB
══════════════════════════════════════════ */
function AttendanceTab({ attendance, student }: { attendance: AttendanceRow[]; student: StudentRow }) {
  const today = new Date();
  const DAYS_SHORT = ["রবি", "সোম", "মঙ্গ", "বুধ", "বৃহ", "শুক্র", "শনি"];

  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const ds = d.toISOString().split("T")[0];
    const rec = attendance.find(a => a.student_id === student.student_id && a.date === ds);
    const status = !rec ? "none" : rec.status === "present" ? "present" : rec.status === "late" ? "late" : "absent";
    return { date: ds, dayLabel: DAYS_SHORT[d.getDay()], dayNum: d.getDate(), status, isToday: i === 29 };
  });

  const present = attendance.filter(a => a.student_id === student.student_id && a.status === "present").length;
  const absent  = attendance.filter(a => a.student_id === student.student_id && a.status === "absent").length;
  const late    = attendance.filter(a => a.student_id === student.student_id && a.status === "late").length;
  const total   = present + absent + late;
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0;
  const rateColor = rate >= 75 ? "#34d399" : rate >= 50 ? "#fbbf24" : "#f87171";

  const C: Record<string, { bg: string; border: string; text: string; symbol: string }> = {
    present: { bg: "rgba(52,211,153,0.16)",  border: "rgba(52,211,153,0.45)",  text: "#34d399", symbol: "✓" },
    absent:  { bg: "rgba(248,113,113,0.16)", border: "rgba(248,113,113,0.45)", text: "#f87171", symbol: "✗" },
    late:    { bg: "rgba(251,191,36,0.16)",  border: "rgba(251,191,36,0.45)",  text: "#fbbf24", symbol: "~" },
    none:    { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", text: "rgba(255,255,255,0.2)", symbol: "·" },
  };

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "উপস্থিত",   value: present, color: "#34d399", bg: "rgba(52,211,153,0.12)" },
          { label: "অনুপস্থিত", value: absent,  color: "#f87171", bg: "rgba(248,113,113,0.12)" },
          { label: "বিলম্ব",    value: late,    color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
          { label: "হার %",     value: rate,    color: rateColor, bg: `${rateColor}22`, suffix: "%" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "14px 6px", borderRadius: 14, background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{toBengaliNumber(s.value)}{(s as any).suffix || ""}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>উপস্থিতির হার</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: rateColor }}>
            {toBengaliNumber(rate)}%
            <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>
              {rate >= 75 ? "✓ ভালো" : rate >= 50 ? "⚠ মোটামুটি" : "✗ কম"}
            </span>
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 6, width: `${rate}%`, transition: "width 0.6s ease",
            background: rate >= 75 ? "linear-gradient(90deg,#34d399,#10b981)" : rate >= 50 ? "linear-gradient(90deg,#fbbf24,#f59e0b)" : "linear-gradient(90deg,#f87171,#ef4444)",
          }} />
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="fa-calendar-alt" size={14} style={{ color: "#34d399" }} /> গত ৩০ দিনের রেকর্ড
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>
          {days30.map(d => {
            const c = C[d.status];
            return (
              <div key={d.date} style={{
                padding: "6px 3px", borderRadius: 9, textAlign: "center",
                background: c.bg, border: `1px solid ${c.border}`,
                outline: d.isToday ? "2px solid rgba(168,85,247,0.7)" : "none",
                outlineOffset: 1, cursor: "default",
              }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{d.dayLabel}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, lineHeight: 1 }}>{toBengaliNumber(d.dayNum)}</div>
                <div style={{ fontSize: 9, marginTop: 2, color: c.text, opacity: 0.85 }}>{c.symbol}</div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          {[
            { bg: "rgba(52,211,153,0.16)", border: "rgba(52,211,153,0.45)", label: "উপস্থিত" },
            { bg: "rgba(248,113,113,0.16)", border: "rgba(248,113,113,0.45)", label: "অনুপস্থিত" },
            { bg: "rgba(251,191,36,0.16)", border: "rgba(251,191,36,0.45)", label: "বিলম্ব" },
            { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.07)", label: "তথ্য নেই" },
          ].map(item => (
            <span key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: item.bg, border: `1px solid ${item.border}`, display: "inline-block", flexShrink: 0 }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   FEE TAB
══════════════════════════════════════════ */
function FeesTab({ student, payments }: { student: StudentRow; payments: PaymentRow[] }) {
  const admissionDate = student.admission_date ? new Date(student.admission_date) : new Date();
  const now = new Date();
  const monthlyFee = Number(student.monthly_fee) || 0;

  const months: { key: string; label: string }[] = [];
  const cur = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cur <= end) {
    months.push({
      key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS_BENGALI[cur.getMonth()]} ${toBengaliNumber(cur.getFullYear())}`,
    });
    cur.setMonth(cur.getMonth() + 1);
  }

  const paidKeys = new Set(
    payments
      .filter(p => p.student_id === student.student_id)
      .map(p => p.payment_date ? p.payment_date.substring(0, 7) : p.month?.includes("-") ? p.month.substring(0, 7) : "")
      .filter(Boolean)
  );

  const paidCount = months.filter(m => paidKeys.has(m.key)).length;
  const dueCount  = months.length - paidCount;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "পরিশোধিত",  value: formatTaka(paidCount * monthlyFee), color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: "fa-check-circle" },
          { label: "বকেয়া",     value: formatTaka(dueCount * monthlyFee),  color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: "fa-exclamation-circle" },
          { label: "মাসিক ফি",  value: formatTaka(monthlyFee),            color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: "fa-coins" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "16px 8px", borderRadius: 14, background: s.bg, border: `1px solid ${s.color}22` }}>
            <Icon name={s.icon} size={20} style={{ color: s.color, marginBottom: 6, display: "block" }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Month list */}
      <div style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>মাসওয়ারি স্ট্যাটাস</div>
        <div style={{ display: "grid", gap: 8 }}>
          {months.slice(-10).reverse().map(m => {
            const paid = paidKeys.has(m.key);
            return (
              <div key={m.key} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 14px", borderRadius: 12,
                background: paid ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)",
                border: `1px solid ${paid ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.12)"}`,
              }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{m.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{formatTaka(monthlyFee)}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: paid ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                    color: paid ? "#34d399" : "#f87171",
                  }}>
                    {paid ? "✓ পরিশোধিত" : "✗ বকেয়া"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOTICE TAB
══════════════════════════════════════════ */
function NoticeTab({ notices, student }: { notices: NoticeRow[]; student: StudentRow }) {
  const visible = notices
    .filter(n => n.target === "all" || n.target === "students" || n.target === student.class_name)
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (new Date(b.date).getTime() - new Date(a.date).getTime()))
    .slice(0, 12);

  if (visible.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
        <Icon name="fa-bullhorn" size={40} style={{ display: "block", margin: "0 auto 14px", opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>কোনো নোটিশ নেই</p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = { high: "#f87171", medium: "#fbbf24", low: "#34d399" };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {visible.map(n => (
        <div key={n.id} style={{
          padding: "14px 16px", borderRadius: 14,
          background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)",
          position: "relative",
        }}>
          {Number(n.pinned) > 0 && (
            <span style={{ position: "absolute", top: 12, right: 14, fontSize: 11, color: "#a855f7", display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="fa-thumbtack" size={10} /> পিন
            </span>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {n.priority && (
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: priorityColors[n.priority] || "#60a5fa", flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", paddingRight: Number(n.pinned) > 0 ? 40 : 0 }}>{n.title}</span>
          </div>
          {n.content && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 8px" }}>{n.content}</p>}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{n.date}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════ */
function Chip({ label, icon, color, dot }: { label: string; icon?: string; color: string; dot?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
      background: `${color}20`, color, border: `1px solid ${color}33`,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
      {icon && <Icon name={icon} size={9} />}
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════
   LOADING SPINNER
══════════════════════════════════════════ */
function Spinner({ color = "#a855f7" }: { color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${color}25`, borderTopColor: color, animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ParentPortal() {
  const { parentEmail, children, isLoading, isAuthenticated, signOut } = useParentEmailAuth();
  const navigate = useNavigate();
  const { data: settings = [] } = usePublicSettings();

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  const [attendance,  setAttendance]  = useState<AttendanceRow[]>([]);
  const [payments,    setPayments]    = useState<PaymentRow[]>([]);
  const [examGroups,  setExamGroups]  = useState<ExamGroup[]>([]);
  const [notices,     setNotices]     = useState<NoticeRow[]>([]);

  const madrasaName     = settings.find(s => s.key === "madrasa_name")?.value     || "মাদরাসা ইআরপি";
  const madrasaSubtitle = settings.find(s => s.key === "madrasa_subtitle")?.value || "";
  const logoUrl         = settings.find(s => s.key === "madrasa_logo_url")?.value || "";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/parent-login", { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const student = children[selectedIdx];
    if (!student) return;
    const sid = student.student_id;
    setDataLoading(true);

    Promise.all([
      supabase.from("attendance").select("*").eq("student_id", sid),
      supabase.from("payments").select("*").eq("student_id", sid).is("deleted_at", null),
      supabase.from("mark_entries").select("*").eq("student_id", sid),
      supabase.from("exams").select("*").is("deleted_at", null),
      supabase.from("exam_subjects").select("*"),
      supabase.from("notices").select("*").is("deleted_at", null).order("date", { ascending: false }).limit(20),
    ]).then(([attRes, payRes, markRes, examRes, subRes, noticeRes]) => {
      setAttendance((attRes.data || []) as AttendanceRow[]);
      setPayments((payRes.data || []) as PaymentRow[]);
      setNotices((noticeRes.data || []) as NoticeRow[]);

      const allMarks    = (markRes.data || []) as MarkEntryRow[];
      const allExams    = (examRes.data || []) as { id: string; name: string; date: string; class_name: string }[];
      const allSubjects = (subRes.data || []) as ExamSubjectRow[];

      const groups: ExamGroup[] = [...new Set(allMarks.map(m => m.exam_id))].map(eid => {
        const exam = allExams.find(e => e.id === eid);
        return {
          examId:    eid,
          examName:  exam?.name      || "পরীক্ষা",
          examDate:  exam?.date      || "",
          className: exam?.class_name || "",
          marks:     allMarks.filter(m => m.exam_id === eid),
          subjects:  allSubjects.filter(s => s.exam_id === eid),
        };
      });
      setExamGroups(groups);
      setDataLoading(false);
    });
  }, [children, selectedIdx]);

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return null;

  const student: StudentRow | undefined = children[selectedIdx];

  const handleLogout = async () => { await signOut(); navigate("/parent-login"); };

  return (
    <>
      <ParallaxBackground />
      <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
        <PortalHeader
          madrasaName={madrasaName}
          madrasaSubtitle={madrasaSubtitle}
          logoUrl={logoUrl}
          portalLabel="অভিভাবক পোর্টাল"
          userLabel={parentEmail || ""}
          onLogout={handleLogout}
        />

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 14px 16px" }}>
          {children.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(30,41,59,0.7)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon name="fa-child" size={48} style={{ color: "rgba(255,255,255,0.15)", marginBottom: 16, display: "block" }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>কোনো ছাত্র পাওয়া যায়নি</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 24, lineHeight: 1.7 }}>
                আপনার ইমেইল (<strong style={{ color: "rgba(255,255,255,0.55)" }}>{parentEmail}</strong>) ছাত্রের ভর্তি ফর্মে নথিভুক্ত নেই।
              </p>
              <button onClick={handleLogout} style={{ padding: "10px 24px", borderRadius: 12, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Icon name="fa-sign-out-alt" size={14} /> লগআউট করুন
              </button>
            </div>
          ) : (
            <>
              <ChildSelector children={children} selectedIdx={selectedIdx} onChange={setSelectedIdx} />

              {student && (
                <>
                  {activeTab === "profile" && <ProfileTab student={student} />}
                  {activeTab === "attendance" && (
                    dataLoading ? <Spinner /> : <AttendanceTab attendance={attendance} student={student} />
                  )}
                  {activeTab === "fees" && (
                    dataLoading ? <Spinner /> : <FeesTab student={student} payments={payments} />
                  )}
                  {activeTab === "results" && (
                    dataLoading ? <Spinner /> : <ExamResultCard examGroups={examGroups} student={student} madrasaName={madrasaName} />
                  )}
                  {activeTab === "notices" && (
                    dataLoading ? <Spinner /> : <NoticeTab notices={notices} student={student} />
                  )}
                </>
              )}
            </>
          )}
        </main>

        <BottomTabBar active={activeTab} onChange={setActiveTab} />
      </div>
    </>
  );
}
