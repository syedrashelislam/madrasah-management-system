import { useSettings } from "@/hooks/useSettings";
import { MADRASA_NAME, MADRASA_ADDRESS } from "@/lib/constants";

export interface InstitutionInfo {
  name: string;
  subtitle: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  reportHeader: string;
  reportFooter: string;
  receiptPrimaryColor: string;
  receiptAccentColor: string;
  receiptFooterText: string;
}

export function useInstitutionInfo(): InstitutionInfo {
  const { data: settings = [] } = useSettings();
  const get = (key: string, fallback = "") =>
    settings.find((s) => s.key === key)?.value || fallback;

  return {
    name: get("madrasa_name", MADRASA_NAME),
    subtitle: get("madrasa_subtitle", ""),
    address: get("madrasa_address", MADRASA_ADDRESS),
    phone: get("madrasa_phone", ""),
    email: get("madrasa_email", ""),
    website: get("madrasa_website", ""),
    logoUrl: get("madrasa_logo_url", ""),
    reportHeader: get("report_header_text", ""),
    reportFooter: get("report_footer_text", ""),
    receiptPrimaryColor: get("receipt_primary_color", "#1a5c1a"),
    receiptAccentColor: get("receipt_accent_color", "#d4af37"),
    receiptFooterText: get("receipt_footer_text", ""),
  };
}
