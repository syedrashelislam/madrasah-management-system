/** Badge style helpers for FeeTransactionsTab */

export const feeTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    Monthly: "মাসিক",
    Admission: "ভর্তি",
    Exam: "পরীক্ষা",
    Partial: "আংশিক",
    Other: "অন্যান্য",
  };
  return map[t] || t || "—";
};

export const feeTypeBadgeStyle = (
  t: string,
): { bg: string; color: string } => {
  const m: Record<string, { bg: string; color: string }> = {
    Monthly: { bg: "rgba(40,167,69,0.15)", color: "#28a745" },
    Admission: { bg: "rgba(212,175,55,0.15)", color: "#d4af37" },
    Exam: { bg: "rgba(99,102,241,0.15)", color: "#6366f1" },
    Partial: { bg: "rgba(249,115,22,0.15)", color: "#f97316" },
    Other: { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" },
  };
  return m[t] || m.Other;
};

export const methodBadge = (
  m: string,
): { icon: string; color: string } => {
  if (m === "নগদ") return { icon: "fa-money-bill", color: "#28a745" };
  if (m === "বিকাশ" || m === "নগদ মোবাইল")
    return { icon: "fa-mobile", color: "#E2136E" };
  if (m === "ব্যাংক") return { icon: "fa-university", color: "#0ea5e9" };
  return { icon: "fa-exchange-alt", color: "rgba(255,255,255,0.5)" };
};
