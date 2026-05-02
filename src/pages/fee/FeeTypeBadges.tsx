import Icon from "@/components/Icon";

const FEE_TYPES = [
  {
    label: "মাসিক ফি",
    cycle: "মাসিক",
    cycleFull: "প্রতি মাসে আদায়যোগ্য",
    icon: "fa-calendar",
    cycleIcon: "fa-sync",
    color: "#d4af37",
    bg: "rgba(212, 175, 55, 0.1)",
    border: "rgba(212, 175, 55, 0.25)",
    desc: "প্রতি মাসে প্রদেয়",
  },
  {
    label: "ভর্তি ফি",
    cycle: "এককালীন",
    cycleFull: "এককালীন আদায়যোগ্য",
    icon: "fa-user-plus",
    cycleIcon: "fa-check-circle",
    color: "#28a745",
    bg: "rgba(40, 167, 69, 0.1)",
    border: "rgba(40, 167, 69, 0.25)",
    desc: "ভর্তির সময় একবার",
  },
  {
    label: "পরীক্ষা ফি",
    cycle: "সেমিস্টার",
    cycleFull: "প্রতি পরীক্ষা/সেমিস্টারে আদায়যোগ্য",
    icon: "fa-clipboard-check",
    cycleIcon: "fa-calendar-check",
    color: "#5bc0de",
    bg: "rgba(91, 192, 222, 0.1)",
    border: "rgba(91, 192, 222, 0.25)",
    desc: "প্রতি পরীক্ষা চক্রে",
  },
  {
    label: "অন্যান্য ফি",
    cycle: "কাস্টম",
    cycleFull: "কাস্টম চক্র",
    icon: "fa-coins",
    cycleIcon: "fa-clock",
    color: "#e8a87c",
    bg: "rgba(232, 168, 124, 0.1)",
    border: "rgba(232, 168, 124, 0.25)",
    desc: "কাস্টম লেবেলসহ",
  },
];

export function getCycleBadge(type: "monthly" | "onetime" | "semester" | "custom") {
  const map = {
    monthly: { label: "মাসিক", color: "#d4af37", bg: "rgba(212,175,55,0.12)" },
    onetime: { label: "এককালীন", color: "#28a745", bg: "rgba(40,167,69,0.12)" },
    semester: { label: "সেমিস্টার", color: "#5bc0de", bg: "rgba(91,192,222,0.12)" },
    custom: { label: "কাস্টম", color: "#e8a87c", bg: "rgba(232,168,124,0.12)" },
  };
  const c = map[type];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 50,
      background: c.bg, color: c.color, display: "inline-block", marginTop: 2,
    }}>
      {c.label}
    </span>
  );
}

/** Returns the full cycle label for use in the form fields */
export function getCycleLabel(type: "monthly" | "onetime" | "semester" | "custom") {
  const map = {
    monthly: { label: "প্রতি মাসে আদায়যোগ্য", icon: "fa-sync", color: "#d4af37", bg: "rgba(212,175,55,0.08)" },
    onetime: { label: "এককালীন আদায়যোগ্য", icon: "fa-check-circle", color: "#28a745", bg: "rgba(40,167,69,0.08)" },
    semester: { label: "প্রতি পরীক্ষা/সেমিস্টারে আদায়যোগ্য", icon: "fa-calendar-check", color: "#5bc0de", bg: "rgba(91,192,222,0.08)" },
    custom: { label: "কাস্টম চক্র", icon: "fa-clock", color: "#e8a87c", bg: "rgba(232,168,124,0.08)" },
  };
  const c = map[type];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
      background: c.bg, color: c.color, marginTop: 4,
      border: `1px solid ${c.color}20`,
    }}>
      <Icon name={c.icon} size={10} style={{ color: c.color }} />
      {c.label}
    </div>
  );
}

export default function FeeTypeBadges() {
  return (
    <div className="content-box" style={{ paddingTop: 16, paddingBottom: 16 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10, fontWeight: 600 }}>
        <Icon name="fa-coins" size={13} /> ফি এর ধরন ও আদায় চক্র
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {FEE_TYPES.map((ft) => (
          <div
            key={ft.label}
            style={{
              background: ft.bg,
              border: `1px solid ${ft.border}`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              transition: "all 0.2s ease",
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: ft.bg, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${ft.border}`, flexShrink: 0,
            }}>
              <Icon name={ft.icon} size={15} style={{ color: ft.color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ft.color }}>{ft.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
                {ft.desc}
              </div>
              {/* Prominent cycle badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                background: `${ft.color}12`, color: ft.color, marginTop: 6,
                border: `1px solid ${ft.color}20`,
              }}>
                <Icon name={ft.cycleIcon} size={10} style={{ color: ft.color }} />
                {ft.cycleFull}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
