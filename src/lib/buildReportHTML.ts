/**
 * buildReportHTML — Generates portrait-mode report HTML for printing.
 *
 * Each report gets the institution header, a title bar, summary cards,
 * a data table, and a footer with print date + signatures.
 *
 * Supports optional "student copy / office copy" dual page layout.
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";

export interface ReportSummaryCard {
  label: string;
  value: string;
  color?: string;
}

export interface ReportColumn {
  header: string;
  /** width hint, e.g. "60px" */
  width?: string;
}

export interface ReportRow {
  cells: string[];
}

export interface ReportData {
  institution: InstitutionInfo;
  reportTitle: string;
  subtitle?: string;
  summaryCards?: ReportSummaryCard[];
  columns: ReportColumn[];
  rows: ReportRow[];
  footerNote?: string;
}

function buildInstitutionHeader(inst: InstitutionInfo): string {
  const logoHTML = inst.logoUrl
    ? `<img src="${inst.logoUrl}" alt="Logo" class="rpt-logo" />`
    : `<div class="rpt-logo rpt-logo--fallback">م</div>`;

  const contactParts: string[] = [];
  if (inst.phone) contactParts.push(`☎ ${inst.phone}`);
  if (inst.email) contactParts.push(`✉ ${inst.email}`);
  if (inst.website) contactParts.push(`🌐 ${inst.website}`);

  return `<div class="rpt-header">
    <div class="rpt-logo-wrap">${logoHTML}</div>
    <h1 class="rpt-inst-name">${inst.name}</h1>
    ${inst.subtitle ? `<p class="rpt-inst-sub">${inst.subtitle}</p>` : ""}
    ${inst.reportHeader ? `<p class="rpt-custom-header">${inst.reportHeader}</p>` : ""}
    ${inst.address ? `<p class="rpt-inst-addr">${inst.address}</p>` : ""}
    ${contactParts.length ? `<div class="rpt-inst-contacts">${contactParts.map(c => `<span>${c}</span>`).join("")}</div>` : ""}
  </div>`;
}

function buildSummaryCards(cards: ReportSummaryCard[]): string {
  if (!cards || cards.length === 0) return "";
  return `<div class="rpt-summary-row">${cards.map(c =>
    `<div class="rpt-sum-card">
      <div class="rpt-sum-bar" style="background:${c.color || '#1a5c1a'}"></div>
      <div class="rpt-sum-value" style="color:${c.color || '#1a5c1a'}">${c.value}</div>
      <div class="rpt-sum-label">${c.label}</div>
    </div>`
  ).join("")}</div>`;
}

function buildTable(columns: ReportColumn[], rows: ReportRow[]): string {
  const ths = columns.map((col) =>
    `<th class="rpt-th"${col.width ? ` style="width:${col.width}"` : ""}>${col.header}</th>`
  ).join("");

  const trs = rows.map((row, ri) => {
    const tds = row.cells.map((cell) =>
      `<td class="rpt-td">${cell}</td>`
    ).join("");
    return `<tr class="${ri % 2 === 1 ? "rpt-tr-alt" : ""}">${tds}</tr>`;
  }).join("");

  if (rows.length === 0) {
    return `<table class="rpt-table"><thead><tr>${ths}</tr></thead><tbody><tr><td colspan="${columns.length}" class="rpt-td rpt-td-empty">কোনো তথ্য নেই</td></tr></tbody></table>`;
  }

  return `<table class="rpt-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

export function buildSingleReportHTML(data: ReportData): string {
  const now = new Date();
  const dateStr = toBengaliNumber(now.toLocaleDateString("bn-BD"));

  return `<div class="rpt">
    ${buildInstitutionHeader(data.institution)}
    <div class="rpt-title-bar">
      <span class="rpt-title">${data.reportTitle}</span>
    </div>
    ${data.subtitle ? `<p class="rpt-subtitle">${data.subtitle}</p>` : ""}
    ${buildSummaryCards(data.summaryCards || [])}
    ${buildTable(data.columns, data.rows)}
    ${data.footerNote ? `<p class="rpt-note">${data.footerNote}</p>` : ""}
    <div class="rpt-sig">
      <div class="rpt-sig-box"><div class="rpt-sig-line"></div><span>প্রস্তুতকারী</span></div>
      <div class="rpt-sig-box"><div class="rpt-sig-line"></div><span>হিসাব রক্ষক</span></div>
      <div class="rpt-sig-box"><div class="rpt-sig-line"></div><span>কর্তৃপক্ষের স্বাক্ষর ও সিল</span></div>
    </div>
    <div class="rpt-footer">
      ${data.institution.reportFooter ? `<div class="rpt-custom-footer">${data.institution.reportFooter}</div>` : ""}
      মুদ্রণ তারিখ: ${dateStr} | মোট ${toBengaliNumber(data.rows.length)} টি রেকর্ড
    </div>
  </div>`;
}
