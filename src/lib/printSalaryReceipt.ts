/**
 * printSalaryReceipt — Uses the unified ReceiptTemplate to print salary slips.
 * Landscape A4, 2 copies per page (staff copy + office copy).
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { buildDualReceiptPage, type ReceiptData } from "@/lib/buildReceiptHTML";
import { printReceiptHTML } from "@/lib/printReceipt";
import { toBengaliNumber } from "@/lib/constants";

export interface SalaryReceiptInput {
  institution: InstitutionInfo;
  staff: {
    name: string;
    staff_id: string;
    role: string;
    phone?: string;
    join_date?: string;
  };
  month: string;
  year: number;
  breakdown: {
    baseSalary: number;
    totalDays: number;
    absentDays: number;
    absenceDeduction: number;
    advanceDeduction: number;
    netPayable: number;
    totalOpenAdvance: number;
    dailyWage: number;
  };
  date?: string;
  receiptNo?: string;
}

export function printSalaryReceiptUnified(input: SalaryReceiptInput) {
  const { institution, staff, month, year, breakdown: b, date, receiptNo } = input;

  const todayBn = date
    ? toBengaliNumber(date)
    : new Date().toLocaleDateString("bn-BD");

  const items: { label: string; amount: number }[] = [
    { label: "মূল বেতন", amount: b.baseSalary },
  ];

  if (b.absenceDeduction > 0) {
    items.push({
      label: `অনুপস্থিতি কর্তন (${toBengaliNumber(b.absentDays)} দিন × ${toBengaliNumber(Math.round(b.dailyWage))} দৈনিক)`,
      amount: -b.absenceDeduction,
    });
  }

  if (b.advanceDeduction > 0) {
    items.push({
      label: "অগ্রিম সমন্বয়",
      amount: -b.advanceDeduction,
    });
  }

  const totalDeduction = b.absenceDeduction + b.advanceDeduction;
  const rNo = receiptNo || `SAL-${Date.now().toString(36).toUpperCase()}`;

  const receiptData: ReceiptData = {
    institution,
    receiptTitle: "বেতন রসিদ",
    receiptNo: rNo,
    date: todayBn,
    infoRows: [
      { label: "কর্মচারীর নাম", value: staff.name },
      { label: "স্টাফ আইডি", value: staff.staff_id },
      { label: "পদবী", value: staff.role || "—" },
      { label: "বেতন মাস", value: `${month} ${toBengaliNumber(year)}` },
      { label: "মোট দিন", value: toBengaliNumber(b.totalDays) },
      { label: "উপস্থিত দিন", value: toBengaliNumber(b.totalDays - b.absentDays) },
    ],
    items: items.map((i) => ({
      label: i.label,
      amount: Math.abs(i.amount),
    })),
    summary: {
      total: b.baseSalary,
      discount: totalDeduction > 0 ? totalDeduction : 0,
      paid: b.netPayable,
      due: 0,
    },
    method: "নগদ",
  };

  const pageHTML = buildDualReceiptPage(receiptData);
  printReceiptHTML(pageHTML, "landscape");
}
