import type { ReceiptData } from "@/lib/buildReceiptHTML";
import { toBengaliNumber } from "@/lib/constants";

/**
 * Validate email format using a standard regex.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function fmtTk(n: number) {
  return toBengaliNumber(n.toLocaleString("en-IN"));
}

/**
 * Send receipt via email using mailto: link.
 * Builds a detailed plain-text body with full student info and payment breakdown.
 */
export async function emailReceipt(
  recipientEmail: string,
  data: ReceiptData,
): Promise<{ success: boolean; error?: string }> {
  if (!isValidEmail(recipientEmail)) {
    return { success: false, error: `"${recipientEmail}" একটি বৈধ ইমেইল ঠিকানা নয়। সঠিক ফরম্যাট: name@example.com` };
  }

  try {
    const studentName = data.infoRows.find(r => r.label === "ছাত্রের নাম")?.value || "";
    const studentId = data.infoRows.find(r => r.label === "আইডি")?.value || "";
    const className = data.infoRows.find(r => r.label === "শ্রেণি")?.value || "";
    const roll = data.infoRows.find(r => r.label === "রোল")?.value || "";
    const subject = `${data.receiptTitle} — ${studentName} (${studentId}) — ${data.institution.name}`;

    const separator = "─".repeat(40);
    const lines: string[] = [
      `${data.institution.name}`,
      data.institution.subtitle || "",
      data.institution.address || "",
      data.institution.phone ? `☎ ${data.institution.phone}` : "",
      "",
      separator,
      `  ${data.receiptTitle}`,
      separator,
      "",
      `রসিদ নং: ${data.receiptNo}`,
      `তারিখ: ${data.date}`,
      "",
      "── ছাত্রের তথ্য ──",
      `ছাত্রের নাম: ${studentName}`,
      `আইডি: ${studentId}`,
      `শ্রেণি: ${className}`,
      roll && roll !== "—" ? `রোল: ${roll}` : "",
      "",
    ].filter(Boolean);

    // Additional info rows (guardian etc.)
    const extraInfoRows = data.infoRows.filter(
      r => !["ছাত্রের নাম", "আইডি", "শ্রেণি", "রোল"].includes(r.label)
    );
    if (extraInfoRows.length > 0) {
      for (const r of extraInfoRows) {
        lines.push(`${r.label}: ${r.value}`);
      }
      lines.push("");
    }

    // Payment breakdown — uses `items` (the correct field name)
    lines.push("── ফি বিবরণ ──");
    if (data.items.length > 0) {
      let idx = 1;
      for (const item of data.items) {
        lines.push(`  ${toBengaliNumber(idx)}. ${item.label}: ৳${fmtTk(item.amount)}`);
        idx++;
      }
    } else {
      lines.push("  (কোনো আইটেম নেই)");
    }
    lines.push("");

    // Summary
    lines.push("── হিসাব সারাংশ ──");
    lines.push(`সর্বমোট: ৳${fmtTk(data.summary.total)}`);
    if (data.summary.discount && data.summary.discount > 0) {
      lines.push(`ছাড়/মওকুফ: ৳${fmtTk(data.summary.discount)}`);
    }
    lines.push(`পরিশোধিত: ৳${fmtTk(data.summary.paid)}`);
    if (data.summary.due && data.summary.due > 0) {
      lines.push(`বকেয়া: ৳${fmtTk(data.summary.due)}`);
    }
    lines.push("");

    // Payment method
    if (data.method) {
      lines.push(`পরিশোধ পদ্ধতি: ${data.method}`);
      lines.push("");
    }

    lines.push(separator);
    lines.push(`এই রসিদটি ${data.institution.name} থেকে স্বয়ংক্রিয়ভাবে তৈরি।`);
    if (data.institution.receiptFooterText) {
      lines.push(data.institution.receiptFooterText);
    }

    const plainText = lines.join("\n");
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;
    window.open(mailtoUrl, "_blank");

    return { success: true };
  } catch (err: any) {
    console.error("Email receipt error:", err);
    return { success: false, error: err?.message || "ইমেইল পাঠানো ব্যর্থ হয়েছে" };
  }
}
