/**
 * Report data builders — convert raw hook data into ReportData objects
 * for each tab (student, fee, income, expense, salary, monthly).
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import type { ReportData, ReportSummaryCard } from "@/lib/buildReportHTML";
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from "@/lib/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rec = Record<string, any>;

export function buildStudentReport(
  institution: InstitutionInfo,
  students: Rec[]
): ReportData {
  const active = students.filter((s) => s.status === "active").length;
  const inactive = students.length - active;
  return {
    institution,
    reportTitle: "ছাত্র রিপোর্ট",
    subtitle: `মোট ছাত্র: ${toBengaliNumber(students.length)}`,
    summaryCards: [
      { label: "মোট ছাত্র", value: toBengaliNumber(students.length), color: "#1a5c1a" },
      { label: "সক্রিয়", value: toBengaliNumber(active), color: "#28a745" },
      { label: "নিষ্ক্রিয়", value: toBengaliNumber(inactive), color: "#dc3545" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "আইডি" },
      { header: "নাম" },
      { header: "শ্রেণি" },
      { header: "মাসিক ফি" },
      { header: "অবস্থা" },
    ],
    rows: students.map((s, i) => ({
      cells: [
        toBengaliNumber(i + 1),
        s.student_id,
        s.name,
        s.class_name,
        formatTaka(s.monthly_fee),
        s.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়",
      ],
    })),
  };
}

export function buildFeeReport(
  institution: InstitutionInfo,
  payments: Rec[]
): ReportData {
  const total = payments.reduce((a: number, p: Rec) => a + p.amount, 0);
  return {
    institution,
    reportTitle: "ফি আদায় রিপোর্ট",
    subtitle: `মোট আদায়: ${formatTaka(total)}`,
    summaryCards: [
      { label: "মোট আদায়", value: formatTaka(total), color: "#1a5c1a" },
      { label: "মোট রসিদ", value: toBengaliNumber(payments.length), color: "#d4af37" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "তারিখ" },
      { header: "ছাত্র আইডি" },
      { header: "মাস" },
      { header: "ধরন" },
      { header: "পরিমাণ" },
    ],
    rows: payments.map((p, i) => ({
      cells: [
        toBengaliNumber(i + 1),
        p.payment_date || "",
        p.student_id || "",
        p.month || "",
        p.fee_type || "",
        formatTaka(p.amount),
      ],
    })),
  };
}

export function buildIncomeReport(
  institution: InstitutionInfo,
  transactions: Rec[]
): ReportData {
  const total = transactions.reduce((a: number, t: Rec) => a + t.amount, 0);
  // category breakdown as summary
  const catMap: Record<string, number> = {};
  transactions.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const cards: ReportSummaryCard[] = [
    { label: "মোট আয়", value: formatTaka(total), color: "#28a745" },
    ...Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([cat, amt]) => ({ label: cat, value: formatTaka(amt), color: "#28a745" })),
  ];

  return {
    institution,
    reportTitle: "আয় রিপোর্ট",
    subtitle: `মোট আয়: ${formatTaka(total)}`,
    summaryCards: cards,
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "তারিখ" },
      { header: "খাত" },
      { header: "বিবরণ" },
      { header: "পরিমাণ" },
    ],
    rows: transactions.map((t, i) => ({
      cells: [
        toBengaliNumber(i + 1),
        t.date || "",
        t.category || "",
        t.description || "",
        formatTaka(t.amount),
      ],
    })),
    footerNote: `খাতওয়ারী: ${Object.entries(catMap).map(([c, a]) => `${c} — ${formatTaka(a)}`).join(" | ")}`,
  };
}

export function buildExpenseReport(
  institution: InstitutionInfo,
  transactions: Rec[]
): ReportData {
  const total = transactions.reduce((a: number, t: Rec) => a + t.amount, 0);
  const catMap: Record<string, number> = {};
  transactions.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const cards: ReportSummaryCard[] = [
    { label: "মোট খরচ", value: formatTaka(total), color: "#dc3545" },
    ...Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([cat, amt]) => ({ label: cat, value: formatTaka(amt), color: "#dc3545" })),
  ];

  return {
    institution,
    reportTitle: "খরচ রিপোর্ট",
    subtitle: `মোট খরচ: ${formatTaka(total)}`,
    summaryCards: cards,
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "তারিখ" },
      { header: "খাত" },
      { header: "বিবরণ" },
      { header: "পরিমাণ" },
    ],
    rows: transactions.map((t, i) => ({
      cells: [
        toBengaliNumber(i + 1),
        t.date || "",
        t.category || "",
        t.description || "",
        formatTaka(t.amount),
      ],
    })),
    footerNote: `খাতওয়ারী: ${Object.entries(catMap).map(([c, a]) => `${c} — ${formatTaka(a)}`).join(" | ")}`,
  };
}

export function buildSalaryReport(
  institution: InstitutionInfo,
  staff: Rec[]
): ReportData {
  const active = staff.filter((s) => s.status === "active");
  const totalSalary = active.reduce((a: number, s: Rec) => a + s.salary, 0);
  return {
    institution,
    reportTitle: "বেতন রিপোর্ট",
    subtitle: `সক্রিয় স্টাফ: ${toBengaliNumber(active.length)}`,
    summaryCards: [
      { label: "সক্রিয় স্টাফ", value: toBengaliNumber(active.length), color: "#1a5c1a" },
      { label: "মোট বেতন", value: formatTaka(totalSalary), color: "#d4af37" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "নাম" },
      { header: "পদবী" },
      { header: "বেতন" },
      { header: "অবস্থা" },
    ],
    rows: staff.map((s, i) => ({
      cells: [
        toBengaliNumber(i + 1),
        s.name,
        s.designation || s.role || "",
        formatTaka(s.salary),
        s.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়",
      ],
    })),
  };
}

export function buildMonthlyReport(
  institution: InstitutionInfo,
  selectedMonth: string,
  incomeTransactions: Rec[],
  expenseTransactions: Rec[],
  payments: Rec[],
  students: Rec[],
  staff: Rec[]
): ReportData {
  const incomeAmt = incomeTransactions
    .filter((t) => t.date?.startsWith(selectedMonth))
    .reduce((a: number, t: Rec) => a + t.amount, 0);
  const expenseAmt = expenseTransactions
    .filter((t) => t.date?.startsWith(selectedMonth))
    .reduce((a: number, t: Rec) => a + t.amount, 0);
  const feeAmt = payments
    .filter((p) => p.payment_date?.startsWith(selectedMonth))
    .reduce((a: number, p: Rec) => a + p.amount, 0);
  const activeStudents = students.filter((s) => s.status === "active").length;
  const activeStaff = staff.filter((s) => s.status === "active").length;
  const net = incomeAmt - expenseAmt;

  // Parse month label
  const [y, m] = selectedMonth.split("-");
  const monthLabel = `${MONTHS_BENGALI[parseInt(m, 10) - 1]} ${toBengaliNumber(parseInt(y, 10))}`;

  // Category breakdowns
  const monthIncomeCat: Record<string, number> = {};
  incomeTransactions.filter((t) => t.date?.startsWith(selectedMonth)).forEach((t) => {
    monthIncomeCat[t.category] = (monthIncomeCat[t.category] || 0) + t.amount;
  });
  const monthExpenseCat: Record<string, number> = {};
  expenseTransactions.filter((t) => t.date?.startsWith(selectedMonth)).forEach((t) => {
    monthExpenseCat[t.category] = (monthExpenseCat[t.category] || 0) + t.amount;
  });

  // Combined rows: income items then expense items
  const rows = [
    ...Object.entries(monthIncomeCat)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt], i) => ({
        cells: [toBengaliNumber(i + 1), "আয়", cat, formatTaka(amt)],
      })),
    ...Object.entries(monthExpenseCat)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt], i) => ({
        cells: [toBengaliNumber(Object.keys(monthIncomeCat).length + i + 1), "খরচ", cat, formatTaka(amt)],
      })),
  ];

  return {
    institution,
    reportTitle: `মাসিক রিপোর্ট — ${monthLabel}`,
    summaryCards: [
      { label: "মোট আয়", value: formatTaka(incomeAmt), color: "#28a745" },
      { label: "মোট খরচ", value: formatTaka(expenseAmt), color: "#dc3545" },
      { label: "ফি আদায়", value: formatTaka(feeAmt), color: "#d4af37" },
      { label: "নিট ব্যালেন্স", value: formatTaka(net), color: net >= 0 ? "#28a745" : "#dc3545" },
      { label: "সক্রিয় ছাত্র", value: toBengaliNumber(activeStudents), color: "#1a5c1a" },
      { label: "সক্রিয় স্টাফ", value: toBengaliNumber(activeStaff), color: "#1a5c1a" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "ধরন" },
      { header: "খাত" },
      { header: "পরিমাণ" },
    ],
    rows,
    footerNote: rows.length === 0 ? "এই মাসে কোনো লেনদেন নেই" : undefined,
  };
}

export function buildStudentAttendanceReport(
  institution: InstitutionInfo,
  selectedMonth: string,
  students: Rec[],
  attendance: Rec[],
  classes: Rec[],
  selectedClassId: number | null,
): ReportData {
  const [y, m] = selectedMonth.split("-");
  const monthLabel = `${MONTHS_BENGALI[parseInt(m, 10) - 1]} ${toBengaliNumber(parseInt(y, 10))}`;
  const selectedClass = classes.find((c) => c.class_id === selectedClassId);
  const className = selectedClass?.name || "সকল শ্রেণি";

  const activeStudents = students
    .filter((s) => s.status === "active" && (selectedClassId ? s.class_id === selectedClassId : true))
    .sort((a, b) => (Number(a.roll) || 0) - (Number(b.roll) || 0));

  const reportRows = activeStudents.map((student, i) => {
    const studentAtt = attendance.filter(
      (row: Rec) =>
        (row.studentId === student.student_id || row.studentId === student.id) &&
        row.date.startsWith(selectedMonth),
    );
    const presentDays = studentAtt.filter((r: Rec) => r.status === "present").length;
    const absentDays = studentAtt.filter((r: Rec) => r.status === "absent").length;
    const lateDays = studentAtt.filter((r: Rec) => r.status === "late").length;
    const leaveDays = studentAtt.filter((r: Rec) => r.status === "leave").length;
    const total = presentDays + absentDays + lateDays;
    const pct = total > 0 ? Math.round(((presentDays + lateDays) / total) * 100) : 0;
    return {
      cells: [
        toBengaliNumber(i + 1),
        student.name,
        toBengaliNumber(student.roll || "—"),
        toBengaliNumber(presentDays),
        toBengaliNumber(lateDays),
        toBengaliNumber(absentDays),
        toBengaliNumber(leaveDays),
        `${toBengaliNumber(pct)}%`,
      ],
    };
  }).filter((_, idx) => {
    const student = activeStudents[idx];
    const studentAtt = attendance.filter(
      (row: Rec) =>
        (row.studentId === student.student_id || row.studentId === student.id) &&
        row.date.startsWith(selectedMonth),
    );
    return studentAtt.length > 0;
  });

  const totalPresent = reportRows.reduce((a, r) => a + parseInt(String(r.cells[3]).replace(/[^\d]/g, "") || "0"), 0);
  const totalAbsent = reportRows.reduce((a, r) => a + parseInt(String(r.cells[5]).replace(/[^\d]/g, "") || "0"), 0);

  return {
    institution,
    reportTitle: `ছাত্র হাজিরা রিপোর্ট — ${monthLabel}`,
    subtitle: `শ্রেণি: ${className}`,
    summaryCards: [
      { label: "মোট ছাত্র", value: toBengaliNumber(activeStudents.length), color: "#1a5c1a" },
      { label: "মোট উপস্থিত দিন", value: toBengaliNumber(totalPresent), color: "#28a745" },
      { label: "মোট অনুপস্থিত দিন", value: toBengaliNumber(totalAbsent), color: "#dc3545" },
      { label: "হাজিরাসহ ছাত্র", value: toBengaliNumber(reportRows.length), color: "#d4af37" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "নাম" },
      { header: "রোল" },
      { header: "উপস্থিত" },
      { header: "বিলম্বে" },
      { header: "অনুপস্থিত" },
      { header: "ছুটি" },
      { header: "শতাংশ" },
    ],
    rows: reportRows,
    footerNote: reportRows.length === 0 ? "নির্বাচিত মাসে কোনো ছাত্র হাজিরা পাওয়া যায়নি" : undefined,
  };
}

export function buildYearlyFinancialReport(
  institution: InstitutionInfo,
  selectedYear: number,
  incomeTransactions: Rec[],
  expenseTransactions: Rec[],
  payments: Rec[],
  salaryPayments: Rec[],
): ReportData {
  const yearStr = String(selectedYear);

  // Filter by year
  const yearIncome = incomeTransactions.filter((t) => t.date?.startsWith(yearStr));
  const yearExpense = expenseTransactions.filter((t) => t.date?.startsWith(yearStr));
  const yearFee = payments.filter((p) => p.payment_date?.startsWith(yearStr));
  const yearSalary = salaryPayments.filter((s) => s.year === selectedYear);

  const totalIncome = yearIncome.reduce((a: number, t: Rec) => a + t.amount, 0);
  const totalExpense = yearExpense.reduce((a: number, t: Rec) => a + t.amount, 0);
  const totalFee = yearFee.reduce((a: number, p: Rec) => a + p.amount, 0);
  const totalSalary = yearSalary.reduce((a: number, s: Rec) => a + (s.netPayable || s.amount || 0), 0);
  const netProfitLoss = totalIncome - totalExpense;

  // Income by category
  const incomeCat: Record<string, number> = {};
  yearIncome.forEach((t) => { incomeCat[t.category] = (incomeCat[t.category] || 0) + t.amount; });

  // Expense by category
  const expenseCat: Record<string, number> = {};
  yearExpense.forEach((t) => { expenseCat[t.category] = (expenseCat[t.category] || 0) + t.amount; });

  // Monthly breakdown rows
  const monthlyRows = MONTHS_BENGALI.map((monthName, idx) => {
    const monthPrefix = `${yearStr}-${String(idx + 1).padStart(2, "0")}`;
    const mIncome = yearIncome.filter((t) => t.date?.startsWith(monthPrefix)).reduce((a: number, t: Rec) => a + t.amount, 0);
    const mExpense = yearExpense.filter((t) => t.date?.startsWith(monthPrefix)).reduce((a: number, t: Rec) => a + t.amount, 0);
    const mFee = yearFee.filter((p) => p.payment_date?.startsWith(monthPrefix)).reduce((a: number, p: Rec) => a + p.amount, 0);
    const mNet = mIncome - mExpense;
    return {
      cells: [
        monthName,
        formatTaka(mIncome),
        formatTaka(mExpense),
        formatTaka(mFee),
        formatTaka(mNet),
      ],
      mIncome,
      mExpense,
    };
  });

  // Build category detail rows for print
  const catRows = [
    ...Object.entries(incomeCat)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt], i) => ({
        cells: [toBengaliNumber(i + 1), "আয়", cat, formatTaka(amt)],
      })),
    ...Object.entries(expenseCat)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt], i) => ({
        cells: [toBengaliNumber(Object.keys(incomeCat).length + i + 1), "খরচ", cat, formatTaka(amt)],
      })),
  ];

  return {
    institution,
    reportTitle: `বার্ষিক আর্থিক রিপোর্ট — ${toBengaliNumber(selectedYear)}`,
    subtitle: netProfitLoss >= 0 ? `নিট লাভ: ${formatTaka(netProfitLoss)}` : `নিট ক্ষতি: ${formatTaka(Math.abs(netProfitLoss))}`,
    summaryCards: [
      { label: "মোট আয়", value: formatTaka(totalIncome), color: "#28a745" },
      { label: "মোট খরচ", value: formatTaka(totalExpense), color: "#dc3545" },
      { label: "ফি আদায়", value: formatTaka(totalFee), color: "#d4af37" },
      { label: "বেতন পরিশোধ", value: formatTaka(totalSalary), color: "#a78bfa" },
      { label: netProfitLoss >= 0 ? "নিট লাভ" : "নিট ক্ষতি", value: formatTaka(Math.abs(netProfitLoss)), color: netProfitLoss >= 0 ? "#28a745" : "#dc3545" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "ধরন" },
      { header: "খাত" },
      { header: "পরিমাণ" },
    ],
    rows: catRows,
    footerNote: catRows.length === 0
      ? `${toBengaliNumber(selectedYear)} সালে কোনো লেনদেন নেই`
      : `মাসিক সর্বোচ্চ আয়: ${formatTaka(Math.max(...monthlyRows.map(r => r.mIncome)))} | মাসিক সর্বোচ্চ খরচ: ${formatTaka(Math.max(...monthlyRows.map(r => r.mExpense)))}`,
  };
}

export function buildStaffAttendanceReport(
  institution: InstitutionInfo,
  selectedMonth: string,
  staff: Rec[],
  attendance: Rec[],
): ReportData {
  const [y, m] = selectedMonth.split("-");
  const monthLabel = `${MONTHS_BENGALI[parseInt(m, 10) - 1]} ${toBengaliNumber(parseInt(y, 10))}`;

  const activeStaff = staff.filter((s) => s.status === "active");

  const reportRows = activeStaff.map((member, i) => {
    const staffAtt = attendance.filter(
      (row: Rec) => row.staffId === member.id && row.date.startsWith(selectedMonth),
    );
    const presentDays = staffAtt.filter((r: Rec) => r.status === "present").length;
    const absentDays = staffAtt.filter((r: Rec) => r.status === "absent").length;
    const total = presentDays + absentDays;
    const pct = total > 0 ? Math.round((presentDays / total) * 100) : 0;
    return {
      cells: [
        toBengaliNumber(i + 1),
        member.name,
        member.designation || member.role || "স্টাফ",
        toBengaliNumber(presentDays),
        toBengaliNumber(absentDays),
        `${toBengaliNumber(pct)}%`,
      ],
      _hasData: presentDays > 0 || absentDays > 0,
    };
  }).filter((r) => r._hasData).map(({ _hasData: _, ...rest }) => rest);

  const totalPresent = activeStaff.reduce((a, member) => {
    return a + attendance.filter((r: Rec) => r.staffId === member.id && r.date.startsWith(selectedMonth) && r.status === "present").length;
  }, 0);
  const totalAbsent = activeStaff.reduce((a, member) => {
    return a + attendance.filter((r: Rec) => r.staffId === member.id && r.date.startsWith(selectedMonth) && r.status === "absent").length;
  }, 0);

  return {
    institution,
    reportTitle: `স্টাফ হাজিরা রিপোর্ট — ${monthLabel}`,
    summaryCards: [
      { label: "সক্রিয় স্টাফ", value: toBengaliNumber(activeStaff.length), color: "#1a5c1a" },
      { label: "মোট উপস্থিত দিন", value: toBengaliNumber(totalPresent), color: "#28a745" },
      { label: "মোট অনুপস্থিত দিন", value: toBengaliNumber(totalAbsent), color: "#dc3545" },
      { label: "হাজিরাসহ স্টাফ", value: toBengaliNumber(reportRows.length), color: "#d4af37" },
    ],
    columns: [
      { header: "ক্র.নং", width: "44px" },
      { header: "নাম" },
      { header: "পদবী" },
      { header: "উপস্থিত" },
      { header: "অনুপস্থিত" },
      { header: "শতাংশ" },
    ],
    rows: reportRows,
    footerNote: reportRows.length === 0 ? "নির্বাচিত মাসে কোনো স্টাফ হাজিরা পাওয়া যায়নি" : undefined,
  };
}
