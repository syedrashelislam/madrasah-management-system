/**
 * SMS & WhatsApp utility functions for sending messages via native apps.
 */

export function generateSmsUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, "");
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}

/** Normalize a BD phone number to 88XXXXXXXXXX format */
export function normalizeBDPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) return "88" + clean;
  if (clean.startsWith("88")) return clean;
  return "88" + clean;
}

/** Generate a WhatsApp URL for a given phone number and message */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const bd = normalizeBDPhone(phone);
  return `https://wa.me/${bd}?text=${encodeURIComponent(message)}`;
}

/** Open a single WhatsApp message in a new tab */
export function openWhatsAppMessage(phone: string, message: string): void {
  window.open(generateWhatsAppUrl(phone, message), "_blank");
}

/** Open bulk WhatsApp messages with staggered delays */
export function openBulkWhatsAppMessages(
  recipients: { phone: string; message: string }[],
  delayMs = 600
): void {
  recipients.forEach((r, i) => {
    setTimeout(() => {
      window.open(generateWhatsAppUrl(r.phone, r.message), "_blank");
    }, i * delayMs);
  });
}

export function generateFeeDueMessage(
  studentName: string,
  dueAmount: number,
  madrasaName: string
): string {
  return `আসসালামু আলাইকুম,\n${madrasaName} থেকে জানানো যাচ্ছে যে, ${studentName} এর মোট বকেয়া ফি ৳${dueAmount.toLocaleString("en-IN")}।\nঅনুগ্রহ করে যত দ্রুত সম্ভব বকেয়া পরিশোধ করুন।\nধন্যবাদ।`;
}

export function openSmsReminder(
  phone: string,
  studentName: string,
  dueAmount: number,
  madrasaName: string
): void {
  const msg = generateFeeDueMessage(studentName, dueAmount, madrasaName);
  window.open(generateSmsUrl(phone, msg), "_self");
}

export function openBulkSmsReminders(
  students: { phone: string; name: string; totalDueAmount: number }[],
  madrasaName: string
): void {
  students.forEach((s, i) => {
    setTimeout(() => {
      const msg = generateFeeDueMessage(s.name, s.totalDueAmount, madrasaName);
      window.open(generateSmsUrl(s.phone, msg), "_blank");
    }, i * 500);
  });
}
