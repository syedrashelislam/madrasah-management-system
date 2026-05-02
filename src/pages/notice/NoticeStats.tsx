import { NoticeRow } from "@/hooks/useNotices";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface Props { notices: NoticeRow[]; }

const TARGET_LABELS: Record<string, string> = { all: "সকল", students: "ছাত্র", teachers: "শিক্ষক", parents: "অভিভাবক", staff: "স্টাফ" };

export default function NoticeStats({ notices }: Props) {
  const total = notices.length;
  const urgent = notices.filter((n) => n.priority === "high").length;
  const pinned = notices.filter((n) => Number(n.pinned) > 0).length;
  const thisMonth = notices.filter((n) => {
    if (!n.date) return false;
    const d = new Date(n.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const cards = [
    { label: "মোট নোটিশ", value: total, icon: "fa-bullhorn", color: "#d4af37" },
    { label: "জরুরি", value: urgent, icon: "fa-exclamation-triangle", color: "#ef4444" },
    { label: "পিন করা", value: pinned, icon: "fa-thumbtack", color: "#fbbf24" },
    { label: "এই মাসে", value: thisMonth, icon: "fa-calendar", color: "#60a5fa" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
      {cards.map((c) => (
        <div key={c.label} className="content-box" style={{ padding: "14px 16px", textAlign: "center" }}>
          <Icon name={c.icon} size={20} style={{ color: c.color, marginBottom: 6, display: "block" }} />
          <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{toBengaliNumber(c.value)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}
