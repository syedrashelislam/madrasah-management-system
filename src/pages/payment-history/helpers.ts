import { MONTHS_BENGALI, toBengaliNumber } from "@/lib/constants";
import type { PaymentRow } from "@/hooks/usePayments";
import type { StudentRow } from "@/hooks/useStudents";
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { buildDualReceiptPage, type ReceiptData } from "@/lib/buildReceiptHTML";
import { printReceiptHTML } from "@/lib/printReceipt";

export function generateMonthsFromAdmission(admissionDate: string): string[] {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-01-01`;
  const startStr = admissionDate && admissionDate.trim() ? admissionDate : defaultStart;
  const start = new Date(startStr);
  const months: string[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth();
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${MONTHS_BENGALI[month]} ${toBengaliNumber(year)}`);
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return months;
}

/**
 * buildReceiptDataForPayment — builds ReceiptData for a given payment row,
 * grouping by receipt_no. Shared by printReceipt & emailReceipt.
 */
export function buildReceiptDataForPayment(
  p: PaymentRow,
  student: StudentRow,
  institution: InstitutionInfo,
  allPayments?: PaymentRow[],
): ReceiptData {
  const receiptNo = p.receipt_no || p.id.slice(0, 8);

  let grouped: PaymentRow[];
  if (p.receipt_no && allPayments) {
    grouped = allPayments
      .filter(pay => pay.receipt_no === p.receipt_no)
      .sort((a, b) => a.month.localeCompare(b.month));
  } else {
    grouped = [p];
  }

  const items = grouped.map(pay => ({
    label: pay.month,
    amount: Number(pay.amount) || 0,
  }));

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    institution,
    receiptTitle: "বেতন রসিদ",
    receiptNo,
    date: grouped[0]?.payment_date || p.payment_date,
    infoRows: [
      { label: "ছাত্রের নাম", value: student.name },
      { label: "আইডি", value: student.student_id },
      { label: "শ্রেণি", value: student.class_name },
      { label: "রোল", value: student.roll || "—" },
    ],
    items,
    summary: { total: totalAmount, paid: totalAmount, due: 0 },
    method: grouped[0]?.method || p.method,
  };
}

/**
 * printReceipt — Groups all payments sharing the same receipt_no
 * and prints them as line items on a single receipt page.
 * If receipt_no is empty, falls back to printing only the clicked payment.
 */
export function printReceipt(
  p: PaymentRow,
  student: StudentRow,
  institution: InstitutionInfo,
  allPayments?: PaymentRow[],
) {
  const receiptData = buildReceiptDataForPayment(p, student, institution, allPayments);
  const pageHTML = buildDualReceiptPage(receiptData);
  printReceiptHTML(pageHTML, "landscape", { primaryColor: institution.receiptPrimaryColor });
}
