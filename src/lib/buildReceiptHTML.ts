/**
 * buildReceiptHTML — Generates the HTML string for a single receipt.
 * Used by printReceipt to render in a print window.
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";

export interface ReceiptData {
  institution: InstitutionInfo;
  receiptTitle: string;
  copyLabel?: string;
  receiptNo: string;
  date: string;
  infoRows: { label: string; value: string }[];
  items: { label: string; amount: number }[];
  summary: { total: number; discount?: number; paid: number; due?: number };
  method?: string;
  note?: string;
}

function fmtTk(n: number) {
  return toBengaliNumber(n.toLocaleString("en-IN"));
}

export function buildReceiptHTML(data: ReceiptData): string {
  const { institution, receiptTitle, copyLabel, receiptNo, date, infoRows, items, summary, method, note } = data;
  const primaryColor = data.institution.receiptPrimaryColor || "#1a5c1a";
  const accentColor = data.institution.receiptAccentColor || "#d4af37";

  const logoHTML = institution.logoUrl
    ? `<img src="${institution.logoUrl}" alt="Logo" class="rcpt-logo" />`
    : `<div class="rcpt-logo rcpt-logo--fallback">م</div>`;

  const contactParts: string[] = [];
  if (institution.phone) contactParts.push(`☎ ${institution.phone}`);
  if (institution.email) contactParts.push(`✉ ${institution.email}`);
  if (institution.website) contactParts.push(`🌐 ${institution.website}`);

  const itemRows = items.map((item, i) =>
    `<tr>
      <td class="rcpt-td rcpt-td-sl">${toBengaliNumber(i + 1)}</td>
      <td class="rcpt-td">${item.label}</td>
      <td class="rcpt-td rcpt-td-amt">${fmtTk(item.amount)}</td>
    </tr>`
  ).join("");

  // Pad empty rows to min 4
  const padCount = Math.max(0, 4 - items.length);
  const emptyRows = Array.from({ length: padCount }, () =>
    `<tr><td class="rcpt-td rcpt-td-sl">&nbsp;</td><td class="rcpt-td">&nbsp;</td><td class="rcpt-td rcpt-td-amt">&nbsp;</td></tr>`
  ).join("");

  const discountRow = (summary.discount ?? 0) > 0
    ? `<div class="rcpt-sum-row rcpt-sum-discount"><span>ছাড়/মওকুফ (-):</span><span>৳${fmtTk(summary.discount ?? 0)}</span></div>`
    : "";

  const dueRow = (summary.due ?? 0) > 0
    ? `<div class="rcpt-sum-row rcpt-sum-due"><span>বকেয়া:</span><span>৳${fmtTk(summary.due ?? 0)}</span></div>`
    : "";

  const customFooter = data.institution.receiptFooterText
    ? `<p style="font-size:10px;color:${primaryColor};font-weight:600;margin-bottom:4px;">${data.institution.receiptFooterText}</p>`
    : "";

  return `<div class="rcpt" style="border-color:${primaryColor};">
    <div class="rcpt-header" style="border-bottom-color:${primaryColor};">
      <div class="rcpt-logo-wrap">${logoHTML}</div>
      <h1 class="rcpt-inst-name">${institution.name}</h1>
      ${institution.subtitle ? `<p class="rcpt-inst-sub">${institution.subtitle}</p>` : ""}
      ${institution.address ? `<p class="rcpt-inst-addr">${institution.address}</p>` : ""}
      ${contactParts.length ? `<div class="rcpt-inst-contacts">${contactParts.map(c => `<span>${c}</span>`).join("")}</div>` : ""}
    </div>
    <div class="rcpt-title-bar" style="background:${primaryColor};">
      <span class="rcpt-title">${receiptTitle}</span>
      ${copyLabel ? `<span class="rcpt-copy-label">${copyLabel}</span>` : ""}
    </div>
    <div class="rcpt-info-grid">
      <div class="rcpt-info-row"><span class="rcpt-info-label">রসিদ নং:</span><span class="rcpt-info-value">${receiptNo}</span></div>
      <div class="rcpt-info-row"><span class="rcpt-info-label">তারিখ:</span><span class="rcpt-info-value">${date}</span></div>
      ${infoRows.map(r => `<div class="rcpt-info-row"><span class="rcpt-info-label">${r.label}:</span><span class="rcpt-info-value">${r.value}</span></div>`).join("")}
    </div>
    <table class="rcpt-table">
      <thead><tr><th class="rcpt-th rcpt-th-sl">ক্র.নং</th><th class="rcpt-th">বিবরণ</th><th class="rcpt-th rcpt-th-amt">টাকা</th></tr></thead>
      <tbody>${itemRows}${emptyRows}</tbody>
    </table>
    <div class="rcpt-summary">
      <div class="rcpt-sum-row"><span>সর্বমোট:</span><span>৳${fmtTk(summary.total)}</span></div>
      ${discountRow}
      <div class="rcpt-sum-row rcpt-sum-paid"><span>পরিশোধিত:</span><span>৳${fmtTk(summary.paid)}</span></div>
      ${dueRow}
    </div>
    <div class="rcpt-meta">
      ${method ? `<p><strong>পরিশোধ পদ্ধতি:</strong> ${method}</p>` : ""}
      ${note ? `<p><strong>কথায়:</strong> ${note}</p>` : ""}
    </div>
    <div class="rcpt-sig">
      <div class="rcpt-sig-box"><div class="rcpt-sig-line"></div><span>গ্রহণকারীর স্বাক্ষর</span></div>
      <div class="rcpt-sig-box"><div class="rcpt-sig-line"></div><span>অভিভাবকের স্বাক্ষর</span></div>
      <div class="rcpt-sig-box"><div class="rcpt-sig-line"></div><span>কর্তৃপক্ষের স্বাক্ষর ও সিল</span></div>
    </div>
    <div class="rcpt-footer">${customFooter}<p>এই রসিদটি কম্পিউটারে তৈরি এবং প্রিন্টের পর কর্তৃপক্ষের স্বাক্ষর ও সিল ছাড়া গ্রহণযোগ্য নয়।</p></div>
  </div>`;
}

/**
 * Build landscape 2-per-page HTML (student copy + office copy)
 */
export function buildDualReceiptPage(data: ReceiptData): string {
  const studentCopy = buildReceiptHTML({ ...data, copyLabel: "ছাত্র কপি" });
  const officeCopy = buildReceiptHTML({ ...data, copyLabel: "অফিস কপি" });
  return `<div class="print-page">
    <div class="print-half">${studentCopy}</div>
    <div class="print-half">${officeCopy}</div>
  </div>`;
}
