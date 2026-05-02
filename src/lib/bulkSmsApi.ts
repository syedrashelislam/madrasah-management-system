/**
 * Bulk SMS API sender — uses the SMS API settings from the settings table.
 * Calls the configured API URL with the API key/secret to send real SMS messages.
 */
import { supabase } from "@/integrations/supabase/client";

interface SmsApiConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  senderId: string;
}

async function getSmsConfig(): Promise<SmsApiConfig | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["sms_api_url", "sms_api_key", "sms_api_secret", "sms_sender_id"]);

  if (error || !data) return null;

  const map: Record<string, string> = {};
  for (const row of data) map[row.key] = row.value;

  const apiUrl = map["sms_api_url"]?.trim();
  const apiKey = map["sms_api_key"]?.trim();

  if (!apiUrl || !apiKey) return null;

  return {
    apiUrl,
    apiKey,
    apiSecret: map["sms_api_secret"]?.trim() || "",
    senderId: map["sms_sender_id"]?.trim() || "Madrasa",
  };
}

/** Normalize BD phone: strip non-digits, ensure 88 prefix */
function normalizeBDPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("880")) return clean;
  if (clean.startsWith("88")) return clean;
  if (clean.startsWith("0")) return "88" + clean;
  return "880" + clean;
}

export interface SmsSendResult {
  phone: string;
  success: boolean;
  error?: string;
}

/**
 * Send a single SMS via the configured API.
 * Supports common BD SMS provider formats:
 * - POST JSON: { api_key, senderid, number, message } or { apikey, secretkey, callerID, toUser, messageContent }
 */
async function sendSingleSms(
  config: SmsApiConfig,
  phone: string,
  message: string,
): Promise<SmsSendResult> {
  const normalizedPhone = normalizeBDPhone(phone);

  try {
    // Generic payload that works with most BD SMS providers
    const payload: Record<string, string> = {
      api_key: config.apiKey,
      apikey: config.apiKey,
      api_secret: config.apiSecret,
      secretkey: config.apiSecret,
      senderid: config.senderId,
      callerID: config.senderId,
      sender_id: config.senderId,
      number: normalizedPhone,
      toUser: normalizedPhone,
      to: normalizedPhone,
      contacts: normalizedPhone,
      message,
      messageContent: message,
      msg: message,
      type: "text",
    };

    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { phone, success: false, error: `HTTP ${response.status}: ${text.substring(0, 200)}` };
    }

    return { phone, success: true };
  } catch (err: any) {
    return { phone, success: false, error: err?.message || "Network error" };
  }
}

export interface BulkSmsResult {
  total: number;
  sent: number;
  failed: number;
  results: SmsSendResult[];
}

/**
 * Send bulk SMS messages via the configured API.
 * Returns detailed results for each recipient.
 */
export async function sendBulkSms(
  recipients: { phone: string; message: string }[],
): Promise<BulkSmsResult> {
  const config = await getSmsConfig();
  if (!config) {
    return {
      total: recipients.length,
      sent: 0,
      failed: recipients.length,
      results: recipients.map((r) => ({
        phone: r.phone,
        success: false,
        error: "SMS API কনফিগার করা হয়নি। সেটিংস > API সেটিংস থেকে SMS API তথ্য দিন।",
      })),
    };
  }

  const results: SmsSendResult[] = [];

  // Send with small delay between each to avoid rate limits
  for (const recipient of recipients) {
    const result = await sendSingleSms(config, recipient.phone, recipient.message);
    results.push(result);
    // Small delay between sends
    if (recipients.length > 1) {
      await new Promise((r) => setTimeout(r, 200));
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

/** Check if SMS API is configured */
export async function isSmsApiConfigured(): Promise<boolean> {
  const config = await getSmsConfig();
  return config !== null;
}
