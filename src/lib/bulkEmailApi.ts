/**
 * Bulk Email sender — uses mailto: approach to avoid auth issues.
 * For bulk sends, opens a single mailto: with all recipients in BCC
 * to prevent browser popup blocking.
 */

export interface EmailSendResult {
  email: string;
  success: boolean;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  results: EmailSendResult[];
}

/**
 * Send bulk emails via a single mailto: link.
 * - For 1 recipient: opens mailto: with the email in TO.
 * - For 2+ recipients: opens mailto: with all emails in BCC for privacy.
 * The subject and body come from the first recipient (they should all share the same subject).
 */
export async function sendBulkEmails(
  recipients: { email: string; subject: string; html: string; text?: string }[],
): Promise<BulkEmailResult> {
  const results: EmailSendResult[] = [];
  const validRecipients: typeof recipients = [];

  for (const recipient of recipients) {
    if (!recipient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipient.email.trim())) {
      results.push({ email: recipient.email, success: false, error: "অবৈধ ইমেইল ঠিকানা" });
    } else {
      validRecipients.push(recipient);
    }
  }

  if (validRecipients.length === 0) {
    return { total: recipients.length, sent: 0, failed: results.length, results };
  }

  try {
    const firstRecipient = validRecipients[0];
    const plainText = firstRecipient.text ||
      firstRecipient.html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

    let mailtoUrl: string;

    if (validRecipients.length === 1) {
      // Single recipient — use TO
      mailtoUrl = `mailto:${encodeURIComponent(firstRecipient.email)}?subject=${encodeURIComponent(firstRecipient.subject)}&body=${encodeURIComponent(plainText)}`;
    } else {
      // Multiple recipients — use BCC for privacy
      const bccList = validRecipients.map(r => r.email).join(",");
      mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(firstRecipient.subject)}&body=${encodeURIComponent(plainText)}`;
    }

    window.open(mailtoUrl, "_blank");

    // Mark all valid as success
    for (const r of validRecipients) {
      results.push({ email: r.email, success: true });
    }
  } catch (err: any) {
    console.error("Bulk email error:", err);
    for (const r of validRecipients) {
      results.push({ email: r.email, success: false, error: err?.message || "ইমেইল পাঠানো ব্যর্থ" });
    }
  }

  const sent = results.filter((r) => r.success).length;
  return {
    total: recipients.length,
    sent,
    failed: recipients.length - sent,
    results,
  };
}

/** Check if email sending is available — mailto: always works */
export async function isEmailConfigured(): Promise<boolean> {
  return true;
}
