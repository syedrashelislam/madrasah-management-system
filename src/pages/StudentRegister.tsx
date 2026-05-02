import { memo, useCallback, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSettings } from "@/hooks/useSettings";
import { useClasses, type ClassRow } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";

/*
  Important focus fix:
  The admission form below is intentionally uncontrolled while the user types.
  React state is synchronized only when the user changes steps or submits.
  That prevents the form fields from being recreated/re-rendered on every letter,
  so name/details inputs keep focus normally on mobile, tablet and desktop.
*/

type AdmissionFormValues = {
  name: string;
  father_name: string;
  mother_name: string;
  date_of_birth: string;
  blood_group: string;
  religion: string;
  address: string;
  class_id: string;
  section: string;
  previous_institution: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_whatsapp: string;
  guardian_email: string;
  emergency_contact: string;
  password: string;
  confirm_password: string;
};

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  full?: boolean;
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const RELIGIONS = ["ইসলাম", "হিন্দু", "বৌদ্ধ", "খ্রিষ্টান", "অন্যান্য"];

const INITIAL_FORM: AdmissionFormValues = {
  name: "",
  father_name: "",
  mother_name: "",
  date_of_birth: "",
  blood_group: "",
  religion: "ইসলাম",
  address: "",
  class_id: "",
  section: "",
  previous_institution: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_whatsapp: "",
  guardian_email: "",
  emergency_contact: "",
  password: "",
  confirm_password: "",
};

const FORM_KEYS = Object.keys(INITIAL_FORM) as (keyof AdmissionFormValues)[];

const STEPS = [
  { icon: "fa-user", label: "ব্যক্তিগত", title: "ব্যক্তিগত তথ্য", description: "ছাত্রের মৌলিক পরিচয় ও ঠিকানা" },
  { icon: "fa-graduation-cap", label: "শিক্ষা", title: "শিক্ষা সংক্রান্ত তথ্য", description: "শ্রেণি, সেকশন ও পূর্ববর্তী প্রতিষ্ঠান" },
  { icon: "fa-users", label: "অভিভাবক", title: "অভিভাবক তথ্য", description: "যোগাযোগ ও জরুরি তথ্য" },
  { icon: "fa-lock", label: "নিরাপত্তা", title: "লগইন নিরাপত্তা", description: "ছাত্র পোর্টালের পাসওয়ার্ড" },
] as const;

const TOTAL_STEPS = STEPS.length;

const FormField = memo(function FormField({ id, label, required, hint, children, full }: FieldProps) {
  return (
    <div className={full ? "admission-field admission-field-full" : "admission-field"}>
      <label htmlFor={id} className="admission-label">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <p className="admission-hint">{hint}</p>}
    </div>
  );
});

const SectionTitle = memo(function SectionTitle({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="admission-section-title">
      <div className="admission-section-icon">
        <Icon name={icon} size={16} />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
});

const PasswordField = memo(function PasswordField({
  id,
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  name: keyof AdmissionFormValues;
  defaultValue: string;
  placeholder: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);

  return (
    <FormField id={id} label={label} required={required}>
      <div className="admission-password-wrap">
        <input
          id={id}
          name={name}
          className="glass-input admission-input"
          type={show ? "text" : "password"}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="admission-eye-button"
          onClick={() => setShow((current) => !current)}
          aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
        >
          <Icon name={show ? "fa-eye-slash" : "fa-eye"} size={16} />
        </button>
      </div>
    </FormField>
  );
});

function trimText(value: string) {
  return value.trim();
}

function collectFormValues(base: AdmissionFormValues, formElement: HTMLFormElement | null): AdmissionFormValues {
  const next: AdmissionFormValues = { ...base };
  if (!formElement) return next;

  const formData = new FormData(formElement);
  for (const key of FORM_KEYS) {
    const value = formData.get(key);
    if (typeof value === "string") {
      next[key] = value;
    }
  }
  return next;
}

function getStepError(values: AdmissionFormValues, step: number): string {
  if (step === 1) {
    if (!trimText(values.name)) return "ছাত্রের পুরো নাম লিখুন।";
    if (!trimText(values.father_name)) return "পিতার পুরো নাম লিখুন।";
  }

  if (step === 2) {
    if (!values.class_id) return "শ্রেণি নির্বাচন করুন।";
  }

  if (step === 4) {
    if (!values.password) return "পাসওয়ার্ড লিখুন।";
    if (values.password.length < 4) return "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।";
    if (values.password !== values.confirm_password) return "পাসওয়ার্ড ও নিশ্চিত পাসওয়ার্ড মিলছে না।";
  }

  return "";
}

function findFirstInvalidStep(values: AdmissionFormValues): { step: number; message: string } | null {
  for (let currentStep = 1; currentStep <= TOTAL_STEPS; currentStep += 1) {
    const message = getStepError(values, currentStep);
    if (message) return { step: currentStep, message };
  }
  return null;
}

export default function StudentRegisterPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<AdmissionFormValues>(INITIAL_FORM);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedCredentials, setSubmittedCredentials] = useState({ studentId: "", passwordLength: 0 });
  const navigate = useNavigate();

  const { data: settings = [] } = usePublicSettings();
  const { data: classes = [] } = useClasses();
  const { data: allStudents = [] } = useStudents();

  const madrasaName = settings.find((setting) => setting.key === "madrasa_name")?.value || "বাংলাদেশ ইসলামী ক্যাডেট মাদ্রাসা";
  const logoUrl = settings.find((setting) => setting.key === "madrasa_logo_url")?.value || "";
  const footerText = settings.find((setting) => setting.key === "login_footer_text")?.value || "© ২০২৫ মাদরাসা ERP সিস্টেম";

  const orderedClasses = useMemo(() => {
    return [...classes].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [classes]);

  const nextStudentId = useMemo(() => {
    const serials = allStudents
      .map((student) => student.student_id || "")
      .filter((id) => id.startsWith("STD-"))
      .map((id) => Number.parseInt(id.replace("STD-", ""), 10))
      .filter((serial) => Number.isFinite(serial));

    const nextSerial = (serials.length ? Math.max(...serials) : 0) + 1;
    return `STD-${String(nextSerial).padStart(4, "0")}`;
  }, [allStudents]);

  const syncDraftFromForm = useCallback(() => {
    const values = collectFormValues(draft, formRef.current);
    setDraft(values);
    return values;
  }, [draft]);

  const goNext = useCallback(() => {
    const values = syncDraftFromForm();
    const message = getStepError(values, step);
    if (message) {
      setError(message);
      return;
    }

    setError("");
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }, [step, syncDraftFromForm]);

  const goPrev = useCallback(() => {
    syncDraftFromForm();
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  }, [syncDraftFromForm]);

  const jumpToCompletedStep = useCallback(
    (targetStep: number) => {
      if (targetStep >= step) return;
      syncDraftFromForm();
      setError("");
      setStep(targetStep);
    },
    [step, syncDraftFromForm],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const values = collectFormValues(draft, formRef.current);
    setDraft(values);

    const invalid = findFirstInvalidStep(values);
    if (invalid) {
      setStep(invalid.step);
      setError(invalid.message);
      return;
    }

    const selectedClass: ClassRow | undefined = orderedClasses.find((classItem) => classItem.id === values.class_id);
    const studentId = nextStudentId;

    const payload = {
      student_id: studentId,
      name: trimText(values.name),
      father_name: trimText(values.father_name),
      mother_name: trimText(values.mother_name),
      date_of_birth: values.date_of_birth || null,
      dob: values.date_of_birth || null,
      blood_group: values.blood_group || null,
      religion: values.religion || "ইসলাম",
      address: trimText(values.address),
      class_id: selectedClass?.class_id || 1,
      class_name: selectedClass?.name || "",
      section: trimText(values.section),
      previous_institution: trimText(values.previous_institution),
      guardian_name: trimText(values.guardian_name),
      guardian_phone: trimText(values.guardian_phone),
      guardian_whatsapp: trimText(values.guardian_whatsapp),
      guardian_email: trimText(values.guardian_email).toLowerCase(),
      emergency_contact: trimText(values.emergency_contact),
      contact: trimText(values.guardian_phone),
      login_password: values.password,
      admission_date: new Date().toISOString().split("T")[0],
      status: "active",
      admission_status: "pending",
      monthly_fee: 2500,
      admission_fee: 0,
    };

    try {
      setLoading(true);
      setError("");

      const { error: dbError } = await supabase.from("students").insert([payload as any]);
      if (dbError) throw dbError;

      setSubmittedCredentials({ studentId, passwordLength: values.password.length });
      setSuccess(true);
    } catch (submitError) {
      console.error("Student registration failed", submitError);
      setError("রেজিস্ট্রেশন ব্যর্থ হয়েছে। ডাটাবেস সংযোগ/কলাম সেটআপ পরীক্ষা করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <>
      <ParallaxBackground />
      <main className="admission-page">
        <section className="admission-shell login-card-entrance" aria-label="ছাত্র ভর্তি ফর্ম">
          <header className="admission-hero">
            <div className="admission-logo logo-circle">
              {logoUrl ? <img src={logoUrl} alt="মাদরাসার লোগো" /> : "م"}
            </div>
            <div>
              <p className="admission-eyebrow">অনলাইন ভর্তি আবেদন</p>
              <h1>{madrasaName}</h1>
              <p>নতুন ছাত্র রেজিস্ট্রেশন ফর্ম</p>
            </div>
          </header>

          <div className="admission-card content-box">
            {success ? (
              <div className="admission-success" role="status">
                <div className="admission-success-icon">
                  <Icon name="fa-check-circle" size={34} />
                </div>
                <h2>রেজিস্ট্রেশন সফল হয়েছে!</h2>
                <p>ছাত্র আইডি ও পাসওয়ার্ড নিরাপদ জায়গায় সংরক্ষণ করুন।</p>

                <div className="admission-credential-box">
                  <div>
                    <span>ছাত্র আইডি</span>
                    <strong>{submittedCredentials.studentId}</strong>
                  </div>
                  <div>
                    <span>পাসওয়ার্ড</span>
                    <strong>{"•".repeat(submittedCredentials.passwordLength)}</strong>
                  </div>
                </div>

                <button type="button" className="btn-gold admission-wide-button" onClick={() => navigate("/student-login")}>
                  <Icon name="fa-sign-in-alt" size={15} /> ছাত্র পোর্টালে লগইন করুন
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" noValidate>
                <nav className="admission-stepper" aria-label="ভর্তি ফর্মের ধাপসমূহ">
                  {STEPS.map((item, index) => {
                    const number = index + 1;
                    const isDone = step > number;
                    const isActive = step === number;

                    return (
                      <div className="admission-step-wrap" key={item.label}>
                        <button
                          type="button"
                          className={`admission-step ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
                          onClick={() => jumpToCompletedStep(number)}
                          disabled={!isDone}
                          aria-current={isActive ? "step" : undefined}
                        >
                          <span className="admission-step-circle">
                            <Icon name={isDone ? "fa-check" : item.icon} size={13} />
                          </span>
                          <span>{item.label}</span>
                        </button>
                        {index < STEPS.length - 1 && <span className={`admission-step-line ${isDone ? "is-done" : ""}`} />}
                      </div>
                    );
                  })}
                </nav>

                <SectionTitle icon={currentStep.icon} title={`ধাপ ${step}/${TOTAL_STEPS} — ${currentStep.title}`} description={currentStep.description} />

                {step === 1 && (
                  <div className="admission-form-grid">
                    <FormField id="reg-name" label="ছাত্রের পুরো নাম" required>
                      <input
                        id="reg-name"
                        name="name"
                        className="glass-input admission-input"
                        type="text"
                        placeholder="ছাত্রের পূর্ণ নাম লিখুন"
                        defaultValue={draft.name}
                        autoComplete="name"
                      />
                    </FormField>
                    <FormField id="reg-father" label="পিতার নাম" required>
                      <input
                        id="reg-father"
                        name="father_name"
                        className="glass-input admission-input"
                        type="text"
                        placeholder="পিতার পূর্ণ নাম লিখুন"
                        defaultValue={draft.father_name}
                        autoComplete="off"
                      />
                    </FormField>
                    <FormField id="reg-mother" label="মাতার নাম">
                      <input
                        id="reg-mother"
                        name="mother_name"
                        className="glass-input admission-input"
                        type="text"
                        placeholder="মাতার পূর্ণ নাম লিখুন"
                        defaultValue={draft.mother_name}
                        autoComplete="off"
                      />
                    </FormField>
                    <FormField id="reg-dob" label="জন্ম তারিখ">
                      <input
                        id="reg-dob"
                        name="date_of_birth"
                        className="glass-input admission-input"
                        type="date"
                        defaultValue={draft.date_of_birth}
                      />
                    </FormField>
                    <FormField id="reg-blood" label="রক্তের গ্রুপ">
                      <select id="reg-blood" name="blood_group" className="glass-select admission-input" defaultValue={draft.blood_group}>
                        <option value="">নির্বাচন করুন</option>
                        {BLOOD_GROUPS.map((bloodGroup) => (
                          <option key={bloodGroup} value={bloodGroup}>
                            {bloodGroup}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="reg-religion" label="ধর্ম">
                      <select id="reg-religion" name="religion" className="glass-select admission-input" defaultValue={draft.religion}>
                        {RELIGIONS.map((religion) => (
                          <option key={religion} value={religion}>
                            {religion}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="reg-address" label="বর্তমান ঠিকানা" full>
                      <textarea
                        id="reg-address"
                        name="address"
                        className="glass-input admission-input admission-textarea"
                        placeholder="গ্রাম/মহল্লা, ডাকঘর, উপজেলা, জেলা"
                        defaultValue={draft.address}
                        rows={3}
                      />
                    </FormField>
                  </div>
                )}

                {step === 2 && (
                  <div className="admission-form-grid">
                    <FormField id="reg-class" label="ভর্তির শ্রেণি" required>
                      <select id="reg-class" name="class_id" className="glass-select admission-input" defaultValue={draft.class_id}>
                        <option value="">শ্রেণি নির্বাচন করুন</option>
                        {orderedClasses.map((classItem) => (
                          <option key={classItem.id} value={classItem.id}>
                            {classItem.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField id="reg-section" label="সেকশন">
                      <input
                        id="reg-section"
                        name="section"
                        className="glass-input admission-input"
                        type="text"
                        placeholder="যেমন: ক, খ, A"
                        defaultValue={draft.section}
                      />
                    </FormField>
                    <FormField id="reg-prev-inst" label="পূর্ববর্তী প্রতিষ্ঠান" full>
                      <input
                        id="reg-prev-inst"
                        name="previous_institution"
                        className="glass-input admission-input"
                        type="text"
                        placeholder="আগের স্কুল/মাদরাসার নাম"
                        defaultValue={draft.previous_institution}
                      />
                    </FormField>
                    <div className="admission-id-note admission-field-full">
                      <Icon name="fa-id-badge" size={17} />
                      <div>
                        <span>স্বয়ংক্রিয় ছাত্র আইডি</span>
                        <strong>{nextStudentId}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="admission-form-grid">
                    <FormField id="reg-guardian-name" label="অভিভাবকের নাম">
                      <input
                        id="reg-guardian-name"
                        name="guardian_name"
                        className="glass-input admission-input"
                        type="text"
                        placeholder="অভিভাবকের পূর্ণ নাম"
                        defaultValue={draft.guardian_name}
                      />
                    </FormField>
                    <FormField id="reg-guardian-phone" label="অভিভাবকের মোবাইল">
                      <input
                        id="reg-guardian-phone"
                        name="guardian_phone"
                        className="glass-input admission-input"
                        type="tel"
                        inputMode="tel"
                        placeholder="০১XXXXXXXXX"
                        defaultValue={draft.guardian_phone}
                      />
                    </FormField>
                    <FormField id="reg-guardian-whatsapp" label="হোয়াটসঅ্যাপ নম্বর">
                      <input
                        id="reg-guardian-whatsapp"
                        name="guardian_whatsapp"
                        className="glass-input admission-input"
                        type="tel"
                        inputMode="tel"
                        placeholder="০১XXXXXXXXX"
                        defaultValue={draft.guardian_whatsapp}
                      />
                    </FormField>
                    <FormField id="reg-guardian-email" label="অভিভাবকের ইমেইল">
                      <input
                        id="reg-guardian-email"
                        name="guardian_email"
                        className="glass-input admission-input"
                        type="email"
                        inputMode="email"
                        placeholder="name@example.com"
                        defaultValue={draft.guardian_email}
                      />
                    </FormField>
                    <FormField id="reg-emergency" label="জরুরি যোগাযোগ" full>
                      <input
                        id="reg-emergency"
                        name="emergency_contact"
                        className="glass-input admission-input"
                        type="tel"
                        inputMode="tel"
                        placeholder="জরুরি যোগাযোগ নম্বর"
                        defaultValue={draft.emergency_contact}
                      />
                    </FormField>
                  </div>
                )}

                {step === 4 && (
                  <div className="admission-form-grid">
                    <PasswordField
                      id="reg-password"
                      name="password"
                      label="পাসওয়ার্ড"
                      placeholder="কমপক্ষে ৪ অক্ষর"
                      defaultValue={draft.password}
                      required
                    />
                    <PasswordField
                      id="reg-confirm"
                      name="confirm_password"
                      label="পাসওয়ার্ড নিশ্চিত করুন"
                      placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                      defaultValue={draft.confirm_password}
                      required
                    />
                    <div className="admission-security-note admission-field-full">
                      <Icon name="fa-shield-alt" size={17} />
                      <span>এই পাসওয়ার্ড দিয়ে ছাত্র পোর্টালে লগইন করা যাবে। পাসওয়ার্ডটি অভিভাবকের কাছে নিরাপদভাবে সংরক্ষণ করুন।</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="login-error admission-error" role="alert">
                    <Icon name="fa-exclamation-circle" size={14} /> {error}
                  </div>
                )}

                <div className="admission-actions">
                  {step > 1 ? (
                    <button type="button" className="admission-secondary-button" onClick={goPrev}>
                      <Icon name="fa-arrow-left" size={13} /> আগের ধাপ
                    </button>
                  ) : (
                    <span aria-hidden="true" />
                  )}

                  {step < TOTAL_STEPS ? (
                    <button type="button" className="btn-gold admission-primary-button" onClick={goNext}>
                      পরের ধাপ <Icon name="fa-arrow-right" size={13} />
                    </button>
                  ) : (
                    <button type="submit" className="btn-gold admission-primary-button" disabled={loading}>
                      {loading ? (
                        <>
                          <Icon name="fa-spinner fa-spin" size={15} /> রেজিস্ট্রেশন হচ্ছে...
                        </>
                      ) : (
                        <>
                          <Icon name="fa-user-plus" size={15} /> রেজিস্ট্রেশন সম্পন্ন করুন
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="login-signup-prompt admission-login-link">
                  ইতিমধ্যে রেজিস্ট্রেশন আছে?{" "}
                  <a
                    href="/student-login"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate("/student-login");
                    }}
                    className="login-signup-link"
                  >
                    ছাত্র পোর্টালে লগইন করুন
                  </a>
                </p>
              </form>
            )}
          </div>

          <p className="login-footer admission-footer">{footerText}</p>
        </section>
      </main>
    </>
  );
}
