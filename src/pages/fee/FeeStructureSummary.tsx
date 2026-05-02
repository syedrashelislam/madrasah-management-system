import { useMemo } from "react";
import { formatTaka, toBengaliNumber } from "@/lib/constants";
import Icon from "@/components/Icon";

interface ClassDataItem {
  classId: number;
  className: string;
  studentCount: number;
  feeStructure: { monthlyFee: number; admissionFee: number; examFee: number; otherFee: number } | null;
  avgFee: number;
}

export default function FeeStructureSummary({ classData }: { classData: ClassDataItem[] }) {
  const stats = useMemo(() => {
    const withFS = classData.filter(c => c.feeStructure);
    const totalClasses = withFS.length;
    const avgMonthly = totalClasses > 0
      ? Math.round(withFS.reduce((s, c) => s + (c.feeStructure?.monthlyFee || 0), 0) / totalClasses)
      : 0;
    const expectedIncome = classData.reduce((s, c) => {
      const fee = c.feeStructure?.monthlyFee || 0;
      return s + fee * c.studentCount;
    }, 0);
    return { totalClasses, avgMonthly, expectedIncome };
  }, [classData]);

  const cards = [
    {
      icon: "fa-list-alt",
      label: "মোট শ্রেণি (ফি নির্ধারিত)",
      value: `${toBengaliNumber(stats.totalClasses)} / ${toBengaliNumber(classData.length)}`,
      color: "#d4af37",
      bg: "rgba(212, 175, 55, 0.12)",
    },
    {
      icon: "fa-coins",
      label: "গড় মাসিক ফি",
      value: formatTaka(stats.avgMonthly),
      color: "#28a745",
      bg: "rgba(40, 167, 69, 0.12)",
    },
    {
      icon: "fa-chart-line",
      label: "মোট মাসিক প্রত্যাশিত আয়",
      value: formatTaka(stats.expectedIncome),
      color: "#5bc0de",
      bg: "rgba(91, 192, 222, 0.12)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
      {cards.map((c, i) => (
        <div
          key={i}
          className="summary-card"
          style={{ padding: 16, gap: 12, animationDelay: `${i * 0.08}s` }}
        >
          <div
            className="icon-box"
            style={{ background: c.bg, width: 44, height: 44, borderRadius: 10 }}
          >
            <Icon name={c.icon} size={20} style={{ color: c.color }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
