/**
 * ReceiptTemplate — Unified receipt design for the entire application.
 *
 * Usage:
 *   <ReceiptTemplate
 *     institution={...}
 *     receiptTitle="ফি আদায় রসিদ"
 *     copyLabel="ছাত্র কপি"
 *     receiptNo="RCP-001"
 *     date="২০২৬-০৩-৩১"
 *     infoRows={[{ label: "নাম", value: "..." }, ...]}
 *     items={[{ label: "মাসিক ফি - জানুয়ারি", amount: 2500 }, ...]}
 *     summary={{ total: 5000, discount: 0, paid: 5000, due: 0 }}
 *     method="নগদ"
 *     note="কথায়: পাঁচ হাজার টাকা মাত্র।"
 *   />
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import { toBengaliNumber } from "@/lib/constants";

export interface ReceiptInfoRow {
  label: string;
  value: string;
}

export interface ReceiptItem {
  label: string;
  amount: number;
}

export interface ReceiptSummary {
  total: number;
  discount?: number;
  paid: number;
  due?: number;
}

export interface ReceiptTemplateProps {
  institution: InstitutionInfo;
  receiptTitle: string;
  copyLabel?: string;
  receiptNo: string;
  date: string;
  infoRows: ReceiptInfoRow[];
  items: ReceiptItem[];
  summary: ReceiptSummary;
  method?: string;
  note?: string;
}

function fmtTk(n: number) {
  return toBengaliNumber(n.toLocaleString("en-IN"));
}

export default function ReceiptTemplate({
  institution,
  receiptTitle,
  copyLabel,
  receiptNo,
  date,
  infoRows,
  items,
  summary,
  method,
  note,
}: ReceiptTemplateProps) {
  return (
    <div className="rcpt">
      {/* ─── Header ─── */}
      <div className="rcpt-header">
        {institution.logoUrl ? (
          <img src={institution.logoUrl} alt="Logo" className="rcpt-logo" />
        ) : (
          <div className="rcpt-logo rcpt-logo--fallback">م</div>
        )}
        <div className="rcpt-header-text">
          <h1 className="rcpt-inst-name">{institution.name}</h1>
          {institution.subtitle && (
            <p className="rcpt-inst-sub">{institution.subtitle}</p>
          )}
          {institution.address && (
            <p className="rcpt-inst-addr">{institution.address}</p>
          )}
          <div className="rcpt-inst-contacts">
            {institution.phone && <span>☎ {institution.phone}</span>}
            {institution.email && <span>✉ {institution.email}</span>}
            {institution.website && <span>🌐 {institution.website}</span>}
          </div>
        </div>
      </div>

      {/* ─── Title bar ─── */}
      <div className="rcpt-title-bar">
        <span className="rcpt-title">{receiptTitle}</span>
        {copyLabel && <span className="rcpt-copy-label">{copyLabel}</span>}
      </div>

      {/* ─── Info rows ─── */}
      <div className="rcpt-info-grid">
        <div className="rcpt-info-row">
          <span className="rcpt-info-label">রসিদ নং:</span>
          <span className="rcpt-info-value">{receiptNo}</span>
        </div>
        <div className="rcpt-info-row">
          <span className="rcpt-info-label">তারিখ:</span>
          <span className="rcpt-info-value">{date}</span>
        </div>
        {infoRows.map((row, i) => (
          <div key={i} className="rcpt-info-row">
            <span className="rcpt-info-label">{row.label}:</span>
            <span className="rcpt-info-value">{row.value}</span>
          </div>
        ))}
      </div>

      {/* ─── Items table ─── */}
      <table className="rcpt-table">
        <thead>
          <tr>
            <th className="rcpt-th rcpt-th-sl">ক্র.নং</th>
            <th className="rcpt-th">বিবরণ</th>
            <th className="rcpt-th rcpt-th-amt">টাকা</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="rcpt-td rcpt-td-sl">
                {toBengaliNumber(i + 1)}
              </td>
              <td className="rcpt-td">{item.label}</td>
              <td className="rcpt-td rcpt-td-amt">{fmtTk(item.amount)}</td>
            </tr>
          ))}
          {/* Pad empty rows to minimum 4 for consistent look */}
          {items.length < 4 &&
            Array.from({ length: 4 - items.length }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="rcpt-td rcpt-td-sl">&nbsp;</td>
                <td className="rcpt-td">&nbsp;</td>
                <td className="rcpt-td rcpt-td-amt">&nbsp;</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* ─── Summary ─── */}
      <div className="rcpt-summary">
        <div className="rcpt-sum-row">
          <span>সর্বমোট:</span>
          <span>৳{fmtTk(summary.total)}</span>
        </div>
        {(summary.discount ?? 0) > 0 && (
          <div className="rcpt-sum-row rcpt-sum-discount">
            <span>ছাড়/মওকুফ (-):</span>
            <span>৳{fmtTk(summary.discount ?? 0)}</span>
          </div>
        )}
        <div className="rcpt-sum-row rcpt-sum-paid">
          <span>পরিশোধিত:</span>
          <span>৳{fmtTk(summary.paid)}</span>
        </div>
        {(summary.due ?? 0) > 0 && (
          <div className="rcpt-sum-row rcpt-sum-due">
            <span>বকেয়া:</span>
            <span>৳{fmtTk(summary.due ?? 0)}</span>
          </div>
        )}
      </div>

      {/* ─── Method + Note ─── */}
      <div className="rcpt-meta">
        {method && (
          <p>
            <strong>পরিশোধ পদ্ধতি:</strong> {method}
          </p>
        )}
        {note && (
          <p>
            <strong>কথায়:</strong> {note}
          </p>
        )}
      </div>

      {/* ─── Signatures ─── */}
      <div className="rcpt-sig">
        <div className="rcpt-sig-box">
          <div className="rcpt-sig-line" />
          <span>গ্রহণকারীর স্বাক্ষর</span>
        </div>
        <div className="rcpt-sig-box">
          <div className="rcpt-sig-line" />
          <span>অভিভাবকের স্বাক্ষর</span>
        </div>
        <div className="rcpt-sig-box">
          <div className="rcpt-sig-line" />
          <span>কর্তৃপক্ষের স্বাক্ষর ও সিল</span>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="rcpt-footer">
        <p>এই রসিদটি কম্পিউটারে তৈরি এবং প্রিন্টের পর কর্তৃপক্ষের স্বাক্ষর ও সিল ছাড়া গ্রহণযোগ্য নয়।</p>
      </div>
    </div>
  );
}
