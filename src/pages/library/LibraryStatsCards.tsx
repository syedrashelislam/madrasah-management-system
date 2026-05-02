import { BookRow } from "@/hooks/useBooks";
import { BookIssueRow, isOverdue } from "@/hooks/useBookIssues";
import { toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface Props {
  books: BookRow[];
  issues: BookIssueRow[];
}

export default function LibraryStatsCards({ books, issues }: Props) {
  const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0);
  const totalAvailable = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const totalIssued = issues.filter((i) => i.status === "issued").length;
  const totalOverdue = issues.filter((i) => isOverdue(i)).length;
  const totalReturned = issues.filter((i) => i.status === "returned").length;
  const uniqueCategories = new Set(books.map((b) => b.category)).size;

  const cards = [
    { label: "মোট বই", value: totalBooks, icon: "fa-book", color: "#d4af37" },
    { label: "প্রাপ্ত কপি", value: totalAvailable, icon: "fa-book-open", color: "#28a745" },
    { label: "ইস্যুকৃত", value: totalIssued, icon: "fa-share", color: "#fbbf24" },
    { label: "ওভারডিউ", value: totalOverdue, icon: "fa-exclamation-triangle", color: "#ef4444" },
    { label: "জমা হয়েছে", value: totalReturned, icon: "fa-undo", color: "#60a5fa" },
    { label: "ক্যাটাগরি", value: uniqueCategories, icon: "fa-tags", color: "#a855f7" },
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
