/**
 * saveSalaryPdf — Generates and downloads a salary slip as a PDF.
 * Uses jsPDF to render the salary slip HTML into a downloadable PDF file.
 */
import jsPDF from "jspdf";
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber, formatTaka } from "@/lib/constants";

export interface SalaryPdfInput {
  institution: InstitutionInfo;
  staffName: string;
  staffId: string;
  staffRole: string;
  month: string;
  year: number;
  baseSalary: number;
  totalDays: number;
  absentDays: number;
  absenceDeduction: number;
  advanceDeduction: number;
  netPayable: number;
  paymentDate: string;
}

export function saveSalarySlipPdf(input: SalaryPdfInput): void {
  const {
    institution,
    staffName,
    staffId,
    staffRole,
    month,
    year,
    baseSalary,
    totalDays,
    absentDays,
    absenceDeduction,
    advanceDeduction,
    netPayable,
    paymentDate,
  } = input;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // Helper: center text
  const centerText = (text: string, yPos: number, size: number, style: "normal" | "bold" = "normal") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, yPos);
  };

  // ── Header border ──
  doc.setDrawColor(26, 92, 26);
  doc.setLineWidth(0.8);
  doc.rect(margin - 5, 10, pageWidth - 2 * (margin - 5), 270, "S");

  // ── Institution Header (centered) ──
  y = 22;
  doc.setTextColor(26, 92, 26);
  centerText(institution.name, y, 16, "bold");
  y += 7;

  if (institution.subtitle) {
    doc.setTextColor(100, 100, 100);
    centerText(institution.subtitle, y, 10, "normal");
    y += 5;
  }

  if (institution.address) {
    doc.setTextColor(130, 130, 130);
    centerText(institution.address, y, 9, "normal");
    y += 5;
  }

  const contactParts: string[] = [];
  if (institution.phone) contactParts.push(`☎ ${institution.phone}`);
  if (institution.email) contactParts.push(`✉ ${institution.email}`);
  if (contactParts.length) {
    doc.setTextColor(150, 150, 150);
    centerText(contactParts.join("   "), y, 8, "normal");
    y += 5;
  }

  // ── Green separator line ──
  y += 2;
  doc.setDrawColor(26, 92, 26);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ── Title bar ──
  doc.setFillColor(26, 92, 26);
  doc.rect(margin, y, pageWidth - 2 * margin, 9, "F");
  doc.setTextColor(255, 255, 255);
  centerText("বেতন রসিদ / Salary Slip", y + 6.5, 12, "bold");
  y += 14;

  // ── Staff info grid ──
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  const col1 = margin + 2;
  const col2 = pageWidth / 2 + 5;

  const infoRows = [
    [`কর্মচারী: ${staffName}`, `স্টাফ আইডি: ${staffId}`],
    [`পদবী: ${staffRole}`, `বেতন মাস: ${month} ${toBengaliNumber(year)}`],
    [`মোট দিন: ${toBengaliNumber(totalDays)}`, `তারিখ: ${paymentDate}`],
  ];

  infoRows.forEach((row) => {
    doc.setFont("helvetica", "normal");
    doc.text(row[0], col1, y);
    doc.text(row[1], col2, y);
    y += 6;
  });

  y += 4;

  // ── Table ──
  const tableStartY = y;
  const colWidths = [25, pageWidth - 2 * margin - 25 - 40, 40];
  const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1]];

  // Table header
  doc.setFillColor(240, 236, 224);
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F");
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ক্র.নং", colX[0] + colWidths[0] / 2, y + 5.5, { align: "center" });
  doc.text("বিবরণ", colX[1] + colWidths[1] / 2, y + 5.5, { align: "center" });
  doc.text("টাকা", colX[2] + colWidths[2] / 2, y + 5.5, { align: "center" });
  y += 8;

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);

  const rows: [string, string, string][] = [
    [toBengaliNumber(1), "মূল বেতন", formatTaka(baseSalary)],
  ];

  if (absenceDeduction > 0) {
    rows.push([
      toBengaliNumber(rows.length + 1),
      `অনুপস্থিতি কর্তন (${toBengaliNumber(absentDays)} দিন)`,
      `(-) ${formatTaka(absenceDeduction)}`,
    ]);
  }
  if (advanceDeduction > 0) {
    rows.push([
      toBengaliNumber(rows.length + 1),
      "অগ্রিম সমন্বয়",
      `(-) ${formatTaka(advanceDeduction)}`,
    ]);
  }

  rows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 245);
      doc.rect(margin, y, pageWidth - 2 * margin, 7, "F");
    }
    doc.text(row[0], colX[0] + colWidths[0] / 2, y + 5, { align: "center" });
    doc.text(row[1], colX[1] + colWidths[1] / 2, y + 5, { align: "center" });
    doc.text(row[2], colX[2] + colWidths[2] / 2, y + 5, { align: "center" });
    y += 7;
  });

  // Draw table border
  doc.setDrawColor(213, 203, 176);
  doc.setLineWidth(0.3);
  doc.rect(margin, tableStartY, pageWidth - 2 * margin, y - tableStartY, "S");

  y += 6;

  // ── Summary ──
  doc.setDrawColor(26, 92, 26);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, pageWidth - 2 * margin, 18, "S");

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("সর্বমোট:", margin + 4, y + 6);
  doc.text(formatTaka(baseSalary), pageWidth - margin - 4, y + 6, { align: "right" });

  y += 9;
  doc.setTextColor(26, 92, 26);
  doc.setFontSize(13);
  doc.text("পরিশোধিত:", margin + 4, y + 6);
  doc.text(formatTaka(netPayable), pageWidth - margin - 4, y + 6, { align: "right" });

  y += 14;

  // ── Signatures ──
  y += 20;
  const sigY = y;
  const sigWidth = (pageWidth - 2 * margin - 20) / 3;
  const sigs = ["গ্রহণকারীর স্বাক্ষর", "অভিভাবকের স্বাক্ষর", "কর্তৃপক্ষের স্বাক্ষর ও সিল"];

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.setTextColor(130, 130, 130);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  sigs.forEach((label, i) => {
    const x = margin + i * (sigWidth + 10);
    doc.line(x, sigY, x + sigWidth, sigY);
    doc.text(label, x + sigWidth / 2, sigY + 5, { align: "center" });
  });

  // ── Footer ──
  y = sigY + 14;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(7);
  centerText(
    "এই রসিদটি কম্পিউটারে তৈরি এবং প্রিন্টের পর কর্তৃপক্ষের স্বাক্ষর ও সিল ছাড়া গ্রহণযোগ্য নয়।",
    y,
    7,
  );

  // ── Save ──
  const fileName = `salary_${staffId}_${month}_${year}.pdf`;
  doc.save(fileName);
}
