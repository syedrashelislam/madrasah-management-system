/**
 * buildRegistrationFormHTML — Generates a professional registration form HTML
 * matching the receipt template style. Used for printing student registration forms.
 */
import type { InstitutionInfo } from "@/hooks/useInstitutionInfo";
import type { StudentRow } from "@/hooks/useStudents";
import { toBengaliNumber, formatTaka } from "@/lib/constants";

export function buildRegistrationFormHTML(
  student: StudentRow,
  institution: InstitutionInfo,
): string {
  const primaryColor = institution.receiptPrimaryColor || "#1a5c1a";
  const accentColor = institution.receiptAccentColor || "#d4af37";

  const logoHTML = institution.logoUrl
    ? `<img src="${institution.logoUrl}" alt="Logo" class="rcpt-logo" />`
    : `<div class="rcpt-logo rcpt-logo--fallback">م</div>`;

  const contactParts: string[] = [];
  if (institution.phone) contactParts.push(`☎ ${institution.phone}`);
  if (institution.email) contactParts.push(`✉ ${institution.email}`);
  if (institution.website) contactParts.push(`🌐 ${institution.website}`);

  const photoSrc = student.photo_url
    ? `<img src="${student.photo_url}" style="width:90px;height:100px;object-fit:cover;border:2px solid ${primaryColor};border-radius:6px;" />`
    : `<div style="width:90px;height:100px;border:2px solid ${primaryColor};border-radius:6px;display:flex;align-items:center;justify-content:center;background:#f5f5f0;color:${primaryColor};font-size:11px;text-align:center;">ছবি<br/>Photo</div>`;

  const val = (v: string | number | null | undefined) =>
    v && String(v).trim() ? String(v) : "—";

  const customFooter = institution.receiptFooterText
    ? `<p style="font-size:10px;color:${primaryColor};font-weight:600;margin-bottom:4px;">${institution.receiptFooterText}</p>`
    : "";

  return `<div class="rcpt" style="border-color:${primaryColor};max-width:100%;font-size:11px;">
    <div class="rcpt-header" style="border-bottom-color:${primaryColor};">
      <div class="rcpt-logo-wrap">${logoHTML}</div>
      <h1 class="rcpt-inst-name">${institution.name}</h1>
      ${institution.subtitle ? `<p class="rcpt-inst-sub">${institution.subtitle}</p>` : ""}
      ${institution.address ? `<p class="rcpt-inst-addr">${institution.address}</p>` : ""}
      ${contactParts.length ? `<div class="rcpt-inst-contacts">${contactParts.map(c => `<span>${c}</span>`).join("")}</div>` : ""}
    </div>
    <div class="rcpt-title-bar" style="background:${primaryColor};">
      <span class="rcpt-title">ছাত্র ভর্তি ফরম / Registration Form</span>
    </div>

    <!-- Student ID + Photo Row -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:10px 12px 6px;border-bottom:1px dashed #d5cbb0;">
      <div style="flex:1;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;">
          <div class="rf-row"><span class="rf-label">ছাত্র আইডি:</span><span class="rf-val" style="color:${primaryColor};font-weight:700;">${val(student.student_id)}</span></div>
          <div class="rf-row"><span class="rf-label">ভর্তি নম্বর:</span><span class="rf-val" style="color:${accentColor};font-weight:700;">${val(student.admission_no)}</span></div>
          <div class="rf-row"><span class="rf-label">ভর্তির তারিখ:</span><span class="rf-val">${val(student.admission_date)}</span></div>
          <div class="rf-row"><span class="rf-label">শ্রেণি:</span><span class="rf-val">${val(student.class_name)}</span></div>
          <div class="rf-row"><span class="rf-label">সেকশন/শাখা:</span><span class="rf-val">${val(student.section)}</span></div>
          <div class="rf-row"><span class="rf-label">রোল নম্বর:</span><span class="rf-val">${val(student.roll)}</span></div>
          <div class="rf-row"><span class="rf-label">স্ট্যাটাস:</span><span class="rf-val">${student.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}</span></div>
        </div>
      </div>
      <div style="margin-right:4px;">${photoSrc}</div>
    </div>

    <!-- Personal Information -->
    <div class="rf-section">
      <div class="rf-section-title" style="background:${primaryColor}15;color:${primaryColor};border-right:3px solid ${primaryColor};">ব্যক্তিগত তথ্য</div>
      <div class="rf-grid">
        <div class="rf-row"><span class="rf-label">ছাত্রের নাম:</span><span class="rf-val rf-val-bold">${val(student.name)}</span></div>
        <div class="rf-row"><span class="rf-label">জন্ম তারিখ:</span><span class="rf-val">${val(student.date_of_birth)}</span></div>
        <div class="rf-row"><span class="rf-label">রক্তের গ্রুপ:</span><span class="rf-val">${val(student.blood_group)}</span></div>
        <div class="rf-row"><span class="rf-label">ধর্ম:</span><span class="rf-val">${val(student.religion)}</span></div>
        <div class="rf-row"><span class="rf-label">জন্ম নিবন্ধন নং:</span><span class="rf-val">${val(student.birth_reg_no)}</span></div>
        <div class="rf-row rf-row-full"><span class="rf-label">ঠিকানা:</span><span class="rf-val">${val(student.address)}</span></div>
      </div>
    </div>

    <!-- Guardian Information -->
    <div class="rf-section">
      <div class="rf-section-title" style="background:${primaryColor}15;color:${primaryColor};border-right:3px solid ${primaryColor};">অভিভাবক/পরিবারের তথ্য</div>
      <div class="rf-grid">
        <div class="rf-row"><span class="rf-label">বাবার নাম:</span><span class="rf-val">${val(student.father_name)}</span></div>
        <div class="rf-row"><span class="rf-label">মায়ের নাম:</span><span class="rf-val">${val(student.mother_name)}</span></div>
        <div class="rf-row"><span class="rf-label">অভিভাবকের নাম:</span><span class="rf-val">${val(student.guardian_name)}</span></div>
        <div class="rf-row"><span class="rf-label">মোবাইল:</span><span class="rf-val">${val(student.guardian_phone)}</span></div>
        <div class="rf-row"><span class="rf-label">হোয়াটসঅ্যাপ:</span><span class="rf-val">${val(student.guardian_whatsapp)}</span></div>
        <div class="rf-row"><span class="rf-label">ইমেইল:</span><span class="rf-val">${val(student.guardian_email)}</span></div>
        <div class="rf-row"><span class="rf-label">জরুরি যোগাযোগ:</span><span class="rf-val">${val(student.emergency_contact)}</span></div>
      </div>
    </div>

    <!-- Admission & Fee Information -->
    <div class="rf-section">
      <div class="rf-section-title" style="background:${primaryColor}15;color:${primaryColor};border-right:3px solid ${primaryColor};">আর্থিক তথ্য</div>
      <div class="rf-grid">
        <div class="rf-row"><span class="rf-label">মাসিক ফি:</span><span class="rf-val rf-val-bold" style="color:${primaryColor};">৳${toBengaliNumber((student.monthly_fee || 0).toLocaleString("en-IN"))}</span></div>
        <div class="rf-row"><span class="rf-label">ভর্তি ফি:</span><span class="rf-val rf-val-bold" style="color:${accentColor};">৳${toBengaliNumber((student.admission_fee || 0).toLocaleString("en-IN"))}</span></div>
        <div class="rf-row"><span class="rf-label">পূর্ববর্তী প্রতিষ্ঠান:</span><span class="rf-val">${val(student.previous_institution)}</span></div>
      </div>
    </div>

    <!-- Medical Notes -->
    ${student.medical_notes && student.medical_notes.trim() ? `
    <div class="rf-section">
      <div class="rf-section-title" style="background:${primaryColor}15;color:${primaryColor};border-right:3px solid ${primaryColor};">চিকিৎসা সংক্রান্ত তথ্য</div>
      <div style="padding:6px 12px;font-size:10.5px;">${student.medical_notes}</div>
    </div>` : ""}

    <!-- Declaration -->
    <div style="padding:10px 12px;font-size:10px;border-top:1px dashed #d5cbb0;">
      <p style="margin-bottom:6px;font-weight:600;color:${primaryColor};">ঘোষণা:</p>
      <p style="color:#444;line-height:1.6;">আমি, অভিভাবক হিসেবে ঘোষণা করছি যে উপরোক্ত সকল তথ্য সঠিক। আমি প্রতিষ্ঠানের নিয়ম-কানুন মেনে চলতে এবং নির্ধারিত সময়ে ফি পরিশোধ করতে সম্মত। প্রতিষ্ঠানের শৃঙ্খলা ভঙ্গ করলে কর্তৃপক্ষ যেকোনো ব্যবস্থা নিতে পারবেন।</p>
    </div>

    <!-- Signatures -->
    <div class="rcpt-sig" style="margin-top:16px;">
      <div class="rcpt-sig-box"><div class="rcpt-sig-line"></div><span>অভিভাবকের স্বাক্ষর</span></div>
      <div class="rcpt-sig-box"><div class="rcpt-sig-line"></div><span>শ্রেণি শিক্ষকের স্বাক্ষর</span></div>
      <div class="rcpt-sig-box"><div class="rcpt-sig-line"></div><span>প্রধান শিক্ষক/অধ্যক্ষ</span></div>
    </div>
    <div class="rcpt-footer">${customFooter}<p>এই ফরমটি কম্পিউটারে তৈরি এবং প্রিন্টের পর কর্তৃপক্ষের স্বাক্ষর ও সিল ছাড়া গ্রহণযোগ্য নয়।</p></div>
  </div>`;
}

/**
 * Build dual registration form page (student copy + office copy) for landscape print
 */
export function buildDualRegistrationPage(
  student: StudentRow,
  institution: InstitutionInfo,
): string {
  const studentCopy = buildRegistrationFormHTML(student, institution);
  const officeCopy = buildRegistrationFormHTML(student, institution);
  return `<div class="print-page">
    <div class="print-half"><div style="text-align:center;font-size:9px;color:#888;margin-bottom:4px;">ছাত্র কপি</div>${studentCopy}</div>
    <div class="print-half"><div style="text-align:center;font-size:9px;color:#888;margin-bottom:4px;">অফিস কপি</div>${officeCopy}</div>
  </div>`;
}
