// ============================================================
// smsService.ts — Bangladesh SMS Gateway Integration
// ফাইলটি src/lib/ ফোল্ডারে রাখুন
// ============================================================
// সমর্থিত গেটওয়ে:
//   1. Green Web BD       (সবচেয়ে সস্তা, popular)
//   2. SSL Wireless       (নির্ভরযোগ্য, corporate)
//   3. Twilio             (international)
//   4. BulkSMSBD          (low cost)
// ============================================================

import { supabase } from '@/integrations/supabase/client';

export type SmsGateway = 'greenweb' | 'sslwireless' | 'twilio' | 'bulksmsbd';

export interface SmsConfig {
  gateway: SmsGateway;
  apiKey: string;
  senderId: string;
  username?: string;   // SSL Wireless এর জন্য
  password?: string;   // SSL Wireless এর জন্য
  accountSid?: string; // Twilio এর জন্য
  authToken?: string;  // Twilio এর জন্য
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export interface SmsRecord {
  recipient: string;
  message: string;
  gateway: SmsGateway;
  status: 'sent' | 'failed' | 'pending';
  message_id?: string;
  error?: string;
  sent_at: string;
  type: SmsType;
}

export type SmsType =
  | 'fee_reminder'
  | 'absent_alert'
  | 'exam_result'
  | 'admission'
  | 'general'
  | 'hifz_progress';

// ── SMS Templates ─────────────────────────────────────────────
export const smsTemplates: Record<SmsType, { bn: string; en: string }> = {
  fee_reminder: {
    bn: 'সম্মানিত অভিভাবক,\n{student_name} এর {month} মাসের বেতন {amount} টাকা বকেয়া আছে। অনুগ্রহ করে দ্রুত পরিশোধ করুন।\n- {madrasa_name}',
    en: 'Dear Guardian,\n{student_name} has an outstanding fee of {amount} TK for {month}. Please pay soon.\n- {madrasa_name}',
  },
  absent_alert: {
    bn: 'সম্মানিত অভিভাবক,\nআপনার সন্তান {student_name} আজ ({date}) অনুপস্থিত ছিলেন। অনুগ্রহ করে কারণ জানান।\n- {madrasa_name}',
    en: 'Dear Guardian,\nYour child {student_name} was absent today ({date}). Please inform us of the reason.\n- {madrasa_name}',
  },
  exam_result: {
    bn: 'সম্মানিত অভিভাবক,\n{student_name} এর {exam_name} পরীক্ষার ফলাফল:\nমোট নম্বর: {total}/{full_marks}\nগ্রেড: {grade}\n- {madrasa_name}',
    en: 'Dear Guardian,\n{student_name} exam result for {exam_name}:\nTotal: {total}/{full_marks}\nGrade: {grade}\n- {madrasa_name}',
  },
  admission: {
    bn: 'অভিনন্দন!\n{student_name} এর ভর্তি সম্পন্ন হয়েছে।\nছাত্র আইডি: {student_id}\nশ্রেণী: {class_name}\n- {madrasa_name}',
    en: 'Congratulations!\n{student_name} has been admitted.\nStudent ID: {student_id}\nClass: {class_name}\n- {madrasa_name}',
  },
  hifz_progress: {
    bn: 'সম্মানিত অভিভাবক,\n{student_name} আজ {pages} পৃষ্ঠা হিফজ করেছে।\nমোট সম্পন্ন: {total_pages}/৬০৪ পৃষ্ঠা ({percentage}%)\n- {madrasa_name}',
    en: 'Dear Guardian,\n{student_name} memorized {pages} pages today.\nTotal: {total_pages}/604 pages ({percentage}%)\n- {madrasa_name}',
  },
  general: {
    bn: '{message}\n- {madrasa_name}',
    en: '{message}\n- {madrasa_name}',
  },
};

// ── Template Filler ───────────────────────────────────────────
export function fillTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replaceAll(`{${key}}`, value);
  });
  return result;
}

// ── Format BD phone number ────────────────────────────────────
export function formatBDPhone(phone: string): string {
  // Remove spaces, dashes, +880 prefix
  let cleaned = phone.replace(/[\s\-]/g, '');
  if (cleaned.startsWith('+880')) cleaned = '0' + cleaned.slice(4);
  if (cleaned.startsWith('880')) cleaned = '0' + cleaned.slice(3);
  if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
  return cleaned;
}

// ── Main SMS Sender ───────────────────────────────────────────
export async function sendSms(
  phone: string,
  message: string,
  config: SmsConfig,
  type: SmsType = 'general'
): Promise<SmsSendResult> {
  const formattedPhone = formatBDPhone(phone);

  try {
    let result: SmsSendResult;

    switch (config.gateway) {
      case 'greenweb':
        result = await sendViaGreenWeb(formattedPhone, message, config);
        break;
      case 'sslwireless':
        result = await sendViaSSL(formattedPhone, message, config);
        break;
      case 'twilio':
        result = await sendViaTwilio(formattedPhone, message, config);
        break;
      case 'bulksmsbd':
        result = await sendViaBulkSmsBD(formattedPhone, message, config);
        break;
      default:
        result = { success: false, error: 'Unknown gateway' };
    }

    // Save to SMS log in Supabase
    await logSms({
      recipient: formattedPhone,
      message,
      gateway: config.gateway,
      status: result.success ? 'sent' : 'failed',
      message_id: result.messageId,
      error: result.error,
      sent_at: new Date().toISOString(),
      type,
    });

    return result;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    await logSms({
      recipient: formattedPhone, message, gateway: config.gateway,
      status: 'failed', error, sent_at: new Date().toISOString(), type,
    });
    return { success: false, error };
  }
}

// ── Bulk SMS Sender ───────────────────────────────────────────
export async function sendBulkSms(
  recipients: Array<{ phone: string; variables: Record<string, string> }>,
  templateType: SmsType,
  lang: 'bn' | 'en',
  config: SmsConfig,
  madrasaName: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const template = smsTemplates[templateType][lang];

  for (const { phone, variables } of recipients) {
    const message = fillTemplate(template, { ...variables, madrasa_name: madrasaName });
    const result = await sendSms(phone, message, config, templateType);
    if (result.success) sent++;
    else failed++;
    // 200ms delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  return { sent, failed };
}

// ── Gateway Implementations ───────────────────────────────────

async function sendViaGreenWeb(
  phone: string,
  message: string,
  config: SmsConfig
): Promise<SmsSendResult> {
  // Green Web BD API: https://greenweb.com.bd
  const params = new URLSearchParams({
    token: config.apiKey,
    to: phone,
    message,
    from: config.senderId,
  });
  const res = await fetch(
    `https://api.greenweb.com.bd/api.php?${params.toString()}`
  );
  const text = await res.text();
  // Green Web returns "1001" on success
  if (text.startsWith('1001')) {
    return { success: true, messageId: text.trim() };
  }
  return { success: false, error: `GreenWeb error: ${text}` };
}

async function sendViaSSL(
  phone: string,
  message: string,
  config: SmsConfig
): Promise<SmsSendResult> {
  // SSL Wireless API
  const payload = {
    api_token: config.apiKey,
    sid: config.senderId,
    msisdn: phone,
    sms: message,
    csmsid: `MSG_${Date.now()}`,
  };
  const res = await fetch('https://rest.ssl.com.bd/sms/v3/index.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.status === 'ACCEPTED') {
    return { success: true, messageId: data.reference_id };
  }
  return { success: false, error: data.message || 'SSL error' };
}

async function sendViaTwilio(
  phone: string,
  message: string,
  config: SmsConfig
): Promise<SmsSendResult> {
  if (!config.accountSid || !config.authToken) {
    return { success: false, error: 'Twilio credentials missing' };
  }
  const bdPhone = phone.startsWith('0')
    ? '+880' + phone.slice(1)
    : phone;

  const body = new URLSearchParams({
    To: bdPhone,
    From: config.senderId,
    Body: message,
  });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${config.accountSid}:${config.authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  );
  const data = await res.json();
  if (data.sid) return { success: true, messageId: data.sid };
  return { success: false, error: data.message || 'Twilio error' };
}

async function sendViaBulkSmsBD(
  phone: string,
  message: string,
  config: SmsConfig
): Promise<SmsSendResult> {
  const params = new URLSearchParams({
    api_key: config.apiKey,
    type: 'text',
    contacts: phone,
    senderid: config.senderId,
    msg: message,
  });
  const res = await fetch(
    `https://bulksmsbd.net/api/smsapi?${params.toString()}`
  );
  const data = await res.json();
  if (data.response_code === 202) {
    return { success: true, messageId: String(data.message_id) };
  }
  return { success: false, error: data.error_message || 'BulkSMSBD error' };
}

// ── Check SMS Balance ─────────────────────────────────────────
export async function checkSmsBalance(config: SmsConfig): Promise<string> {
  try {
    if (config.gateway === 'greenweb') {
      const res = await fetch(
        `https://api.greenweb.com.bd/api.php?token=${config.apiKey}&check`
      );
      const text = await res.text();
      return `${text.trim()} SMS বাকি`;
    }
    if (config.gateway === 'bulksmsbd') {
      const res = await fetch(
        `https://bulksmsbd.net/api/getBalanceApi?api_key=${config.apiKey}`
      );
      const data = await res.json();
      return `${data.balance} টাকা`;
    }
    return 'ব্যালেন্স চেক এই গেটওয়েতে সমর্থিত নয়';
  } catch {
    return 'ব্যালেন্স চেক ব্যর্থ হয়েছে';
  }
}

// ── Log SMS to Supabase ───────────────────────────────────────
async function logSms(record: SmsRecord) {
  try {
    await supabase.from('sms_logs').insert({
      recipient: record.recipient,
      message: record.message,
      gateway: record.gateway,
      status: record.status,
      message_id: record.message_id ?? null,
      error_message: record.error ?? null,
      sent_at: record.sent_at,
      sms_type: record.type,
    });
  } catch {
    // Silent fail — don't break app if logging fails
  }
}

// ── Load SMS Config from Supabase settings ────────────────────
export async function loadSmsConfig(): Promise<SmsConfig | null> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', [
      'sms_gateway', 'sms_api_key', 'sms_sender_id',
      'sms_account_sid', 'sms_auth_token',
    ]);

  if (!data || data.length === 0) return null;

  const get = (k: string) => data.find(r => r.key === k)?.value ?? '';

  return {
    gateway: (get('sms_gateway') as SmsGateway) || 'greenweb',
    apiKey: get('sms_api_key'),
    senderId: get('sms_sender_id'),
    accountSid: get('sms_account_sid'),
    authToken: get('sms_auth_token'),
  };
}
