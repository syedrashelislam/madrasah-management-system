import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSettings } from "@/hooks/useSettings";
import { useClasses, type ClassRow } from "@/hooks/useClasses";
import { useStudents } from "@/hooks/useStudents";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useNavigate } from "react-router-dom";

/* ────────────────────────────────────────────
   Helpers (defined OUTSIDE component to keep
   them stable across re-renders — fixes focus)
───────────────────────────────────────────── */
function FormField({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="login-label">
        {label} {required && <span style={{ color: '#f87171' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionDivider({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 0 8px', marginTop: 4,
      borderBottom: '1px solid rgba(255,255,255,0.10)',
      marginBottom: 14,
    }}>
      <Icon name={icon} size={15} style={{ color: 'var(--th-accent)' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--th-accent)' }}>{title}</span>
    </div>
  );
}

function PasswordField({
  id, label, required, value, name, onChange, placeholder,
}: {
  id: string; label: string; required?: boolean; value: string;
  name: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <FormField id={id} label={label} required={required}>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          name={name}
          className="glass-input"
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 8,
            borderRadius: 8, color: 'var(--th-text-dim)', display: 'flex', alignItems: 'center',
          }}
        >
          <Icon name={show ? "fa-eye-slash" : "fa-eye"} size={16} />
        </button>
      </div>
    </FormField>
  );
}

/* ── constants ── */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const RELIGIONS   = ['ইসলাম', 'হিন্দু', 'বৌদ্ধ', 'খ্রিষ্টান', 'অন্যান্য'];

const INITIAL_FORM = {
  name: '', father_name: '', mother_name: '', date_of_birth: '',
  blood_group: '', religion: 'ইসলাম', address: '',
  class_id: '', section: '', previous_institution: '',
  guardian_name: '', guardian_phone: '', guardian_whatsapp: '',
  guardian_email: '', emergency_contact: '',
  password: '', confirm_password: '',
};

const STEPS = [
  { icon: 'fa-user',           label: 'ব্যক্তিগত'  },
  { icon: 'fa-graduation-cap', label: 'শিক্ষা'      },
  { icon: 'fa-users',          label: 'অভিভাবক'     },
  { icon: 'fa-lock',           label: 'নিরাপত্তা'   },
];
const TOTAL_STEPS = STEPS.length;

/* ────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function StudentRegisterPage() {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const navigate              = useNavigate();

  const { data: settings = [] } = usePublicSettings();
  const { data: classes  = [] } = useClasses();
  const { data: allStudents   } = useStudents();

  const madrasaName = settings.find(s => s.key === 'madrasa_name')?.value    || 'বাংলাদেশ ইসলামী ক্যাডেট মাদ্রাসা';
  const logoUrl     = settings.find(s => s.key === 'madrasa_logo_url')?.value || '';
  const footerText  = settings.find(s => s.key === 'login_footer_text')?.value || '© ২০২৫ মাদরাসা ERP সিস্টেম';

  const nextStudentId = useMemo(() => {
    const ids = (allStudents || [])
      .map(s => s.student_id)
      .filter(id => id.startsWith('STD-'))
      .map(id => parseInt(id.replace('STD-', ''), 10))
      .filter(n => !isNaN(n));
    return `STD-${String((ids.length > 0 ? Math.max(...ids) : 0) + 1).padStart(4, '0')}`;
  }, [allStudents]);

  const selectedClass: ClassRow | undefined = classes.find(c => c.id === form.class_id);

  /* ── STABLE change handler — fixes focus-loss bug ──
     Uses input's `name` attribute; never recreated     */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm(prev => ({ ...prev, [name]: value }));
      setError('');          // always safe — if already '' React skips the re-render
    },
    [],                      // no deps — function is stable for entire component lifetime
  );

  /* ── Step validation ── */
  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.name.trim())        { setError('ছাত্রের নাম আবশ্যক।');     return false; }
      if (!form.father_name.trim()) { setError('পিতার নাম আবশ্যক।');       return false; }
    }
    if (step === 2) {
      if (!form.class_id)           { setError('শ্রেণি নির্বাচন করুন।');   return false; }
    }
    if (step === 4) {
      if (!form.password)           { setError('পাসওয়ার্ড আবশ্যক।');       return false; }
      if (form.password.length < 4) { setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'); return false; }
      if (form.password !== form.confirm_password) { setError('পাসওয়ার্ড মিলছে না।'); return false; }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setError('');
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goPrev = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    const { error: dbError } = await supabase.from('students').insert([{
      student_id: nextStudentId,
      name: form.name.trim(),
      father_name: form.father_name.trim(),
      mother_name: form.mother_name.trim(),
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group,
      religion: form.religion || 'ইসলাম',
      address: form.address.trim(),
      class_id: selectedClass?.class_id || 1,
      class_name: selectedClass?.name || '',
      section: form.section.trim(),
      previous_institution: form.previous_institution.trim(),
      guardian_name: form.guardian_name.trim(),
      guardian_phone: form.guardian_phone.trim(),
      guardian_whatsapp: form.guardian_whatsapp.trim(),
      guardian_email: form.guardian_email.trim(),
      emergency_contact: form.emergency_contact.trim(),
      login_password: form.password,
      admission_date: new Date().toISOString().split('T')[0],
      status: 'active',
      monthly_fee: 2500,
    }]);

    if (dbError) {
      setError('রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  /* ──────────────────────────── Render ─────────────────────────── */
  return (
    <>
      <ParallaxBackground />
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px 16px',
        position: 'relative', zIndex: 1,
      }}>
        <div className="login-card-entrance" style={{ width: '100%', maxWidth: 560 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div className="logo-circle" style={{ margin: '0 auto 14px', width: 66, height: 66, fontSize: 30, overflow: 'hidden' }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'م'}
            </div>
            <h1 className="header-title" style={{ fontSize: 20 }}>{madrasaName}</h1>
            <p className="login-subtitle">ছাত্র ভর্তি ফর্ম</p>
          </div>

          {/* Card */}
          <div className="content-box" style={{ padding: '26px 28px' }}>

            {success ? (
              /* Success */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgba(40,167,69,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon name="fa-check-circle" size={32} style={{ color: '#28a745' }} />
                </div>
                <h2 style={{ fontSize: 19, fontWeight: 700, color: '#28a745', marginBottom: 8 }}>
                  রেজিস্ট্রেশন সফল হয়েছে!
                </h2>
                <p style={{ fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.7, marginBottom: 6 }}>
                  আপনার ছাত্র আইডি ও পাসওয়ার্ড সংরক্ষণ করুন।
                </p>
                <div style={{
                  background: 'rgba(var(--th-accent-rgb),0.08)',
                  border: '1px solid rgba(var(--th-accent-rgb),0.2)',
                  borderRadius: 12, padding: '14px 18px', margin: '14px 0 18px', textAlign: 'left',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
                    <span style={{ fontSize:13, color:'var(--th-text-dim)' }}>ছাত্র আইডি</span>
                    <span style={{ fontSize:16, fontWeight:700, color:'var(--th-accent)', fontFamily:'monospace', letterSpacing:1 }}>{nextStudentId}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, color:'var(--th-text-dim)' }}>পাসওয়ার্ড</span>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--th-text)', fontFamily:'monospace' }}>{'•'.repeat(form.password.length)}</span>
                  </div>
                </div>
                <p style={{ fontSize:12, color:'#f59e0b', marginBottom:18, lineHeight:1.6 }}>
                  <Icon name="fa-exclamation-triangle" size={12} />{' '}
                  এই তথ্য নিরাপদ জায়গায় লিখে রাখুন।
                </p>
                <button className="btn-gold" style={{ width:'100%', justifyContent:'center', padding:'11px 24px' }}
                  onClick={() => navigate('/student-login')}>
                  <Icon name="fa-sign-in-alt" size={15} /> ছাত্র পোর্টালে লগইন করুন
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} autoComplete="off">

                {/* ── Step Indicator ── */}
                <div style={{ display:'flex', alignItems:'center', marginBottom: 24, gap: 0 }}>
                  {STEPS.map((s, i) => {
                    const num   = i + 1;
                    const done  = step > num;
                    const active = step === num;
                    return (
                      <div key={num} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                        {/* Circle */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          background: done  ? 'var(--th-accent)'
                                   : active ? 'rgba(var(--th-accent-rgb),0.20)'
                                   :          'rgba(255,255,255,0.06)',
                          border: active ? '2px solid var(--th-accent)' : done ? 'none' : '2px solid rgba(255,255,255,0.12)',
                          transition: 'all 0.3s',
                          cursor: done ? 'pointer' : 'default',
                        }}
                          onClick={() => done && setStep(num)}
                        >
                          {done
                            ? <Icon name="fa-check" size={13} style={{ color: '#0f172a' }} />
                            : <Icon name={s.icon}   size={13} style={{ color: active ? 'var(--th-accent)' : 'rgba(255,255,255,0.35)' }} />
                          }
                        </div>
                        {/* Label below */}
                        <div style={{
                          position: 'absolute',
                          marginTop: 52,
                          fontSize: 10, fontWeight: active ? 700 : 500,
                          color: active ? 'var(--th-accent)' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
                          width: 34, textAlign: 'center',
                          display: 'none', // hidden for space — shown by CSS below
                        }}>{s.label}</div>
                        {/* Connector line */}
                        {i < STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 2, margin: '0 4px',
                            background: done ? 'var(--th-accent)' : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Step title ── */}
                <div style={{ marginBottom: 18 }}>
                  <SectionDivider icon={STEPS[step-1].icon} title={
                    step === 1 ? 'ধাপ ১/৪ — ব্যক্তিগত তথ্য'
                  : step === 2 ? 'ধাপ ২/৪ — শিক্ষা সংক্রান্ত তথ্য'
                  : step === 3 ? 'ধাপ ৩/৪ — অভিভাবক তথ্য'
                  :              'ধাপ ৪/৪ — নিরাপত্তা'
                  } />
                </div>

                {/* ══ STEP 1: Personal Info ══ */}
                {step === 1 && (
                  <div className="responsive-form-grid">
                    <FormField id="reg-name" label="ছাত্রের নাম" required>
                      <input id="reg-name" name="name" className="glass-input" type="text"
                        placeholder="ছাত্রের পূর্ণ নাম" value={form.name} onChange={handleChange} autoFocus />
                    </FormField>
                    <FormField id="reg-father" label="পিতার নাম" required>
                      <input id="reg-father" name="father_name" className="glass-input" type="text"
                        placeholder="পিতার পূর্ণ নাম" value={form.father_name} onChange={handleChange} />
                    </FormField>
                    <FormField id="reg-mother" label="মাতার নাম">
                      <input id="reg-mother" name="mother_name" className="glass-input" type="text"
                        placeholder="মাতার পূর্ণ নাম" value={form.mother_name} onChange={handleChange} />
                    </FormField>
                    <FormField id="reg-dob" label="জন্ম তারিখ">
                      <input id="reg-dob" name="date_of_birth" className="glass-input" type="date"
                        value={form.date_of_birth} onChange={handleChange} />
                    </FormField>
                    <FormField id="reg-blood" label="রক্তের গ্রুপ">
                      <select id="reg-blood" name="blood_group" className="glass-select"
                        value={form.blood_group} onChange={handleChange}>
                        <option value="">নির্বাচন করুন</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </FormField>
                    <FormField id="reg-religion" label="ধর্ম">
                      <select id="reg-religion" name="religion" className="glass-select"
                        value={form.religion} onChange={handleChange}>
                        {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </FormField>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FormField id="reg-address" label="ঠিকানা">
                        <textarea id="reg-address" name="address" className="glass-input"
                          placeholder="বর্তমান ঠিকানা" value={form.address} onChange={handleChange}
                          rows={2} style={{ resize:'vertical', minHeight:60 }} />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* ══ STEP 2: Academic ══ */}
                {step === 2 && (
                  <div className="responsive-form-grid">
                    <FormField id="reg-class" label="শ্রেণি" required>
                      <select id="reg-class" name="class_id" className="glass-select"
                        value={form.class_id} onChange={handleChange}>
                        <option value="">শ্রেণি নির্বাচন করুন</option>
                        {classes.map((c: ClassRow) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </FormField>
                    <FormField id="reg-section" label="সেকশন">
                      <input id="reg-section" name="section" className="glass-input" type="text"
                        placeholder="যেমন: ক, খ" value={form.section} onChange={handleChange} />
                    </FormField>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FormField id="reg-prev-inst" label="পূর্ববর্তী প্রতিষ্ঠান">
                        <input id="reg-prev-inst" name="previous_institution" className="glass-input" type="text"
                          placeholder="আগের শিক্ষা প্রতিষ্ঠানের নাম" value={form.previous_institution} onChange={handleChange} />
                      </FormField>
                    </div>
                    {/* Auto ID notice */}
                    <div style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10,
                      background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.2)', fontSize:13 }}>
                      <Icon name="fa-id-badge" size={16} style={{ color:'#60a5fa' }} />
                      <span style={{ color:'var(--th-text-muted)' }}>
                        আপনার ছাত্র আইডি হবে:{' '}
                        <strong style={{ color:'#60a5fa', fontFamily:'monospace' }}>{nextStudentId}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* ══ STEP 3: Guardian ══ */}
                {step === 3 && (
                  <div className="responsive-form-grid">
                    <FormField id="reg-guardian-name" label="অভিভাবকের নাম">
                      <input id="reg-guardian-name" name="guardian_name" className="glass-input" type="text"
                        placeholder="অভিভাবকের পূর্ণ নাম" value={form.guardian_name} onChange={handleChange} />
                    </FormField>
                    <FormField id="reg-guardian-phone" label="অভিভাবকের মোবাইল">
                      <input id="reg-guardian-phone" name="guardian_phone" className="glass-input" type="text"
                        placeholder="০১XXXXXXXXX" value={form.guardian_phone} onChange={handleChange} />
                    </FormField>
                    <FormField id="reg-guardian-whatsapp" label="হোয়াটসঅ্যাপ">
                      <input id="reg-guardian-whatsapp" name="guardian_whatsapp" className="glass-input" type="text"
                        placeholder="০১XXXXXXXXX" value={form.guardian_whatsapp} onChange={handleChange} />
                    </FormField>
                    <FormField id="reg-guardian-email" label="অভিভাবকের ইমেইল">
                      <input id="reg-guardian-email" name="guardian_email" className="glass-input" type="email"
                        placeholder="email@example.com" value={form.guardian_email} onChange={handleChange} />
                    </FormField>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FormField id="reg-emergency" label="জরুরি যোগাযোগ">
                        <input id="reg-emergency" name="emergency_contact" className="glass-input" type="text"
                          placeholder="জরুরি যোগাযোগ নম্বর" value={form.emergency_contact} onChange={handleChange} />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* ══ STEP 4: Security ══ */}
                {step === 4 && (
                  <div className="responsive-form-grid">
                    <PasswordField id="reg-password" name="password" label="পাসওয়ার্ড" required
                      value={form.password} onChange={handleChange} placeholder="কমপক্ষে ৪ অক্ষর" />
                    <PasswordField id="reg-confirm" name="confirm_password" label="পাসওয়ার্ড নিশ্চিত করুন" required
                      value={form.confirm_password} onChange={handleChange} placeholder="পুনরায় পাসওয়ার্ড লিখুন" />
                  </div>
                )}

                {/* ── Error ── */}
                {error && (
                  <div className="login-error" role="alert" style={{ marginTop: 14 }}>
                    <Icon name="fa-exclamation-circle" /> {error}
                  </div>
                )}

                {/* ── Navigation Buttons ── */}
                <div style={{
                  display: 'flex', gap: 10, marginTop: 22,
                  justifyContent: step === 1 ? 'flex-end' : 'space-between',
                }}>
                  {/* Previous Step Button */}
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goPrev}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '11px 22px', borderRadius: 10,
                        border: '1.5px solid rgba(255,255,255,0.18)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#F1F5F9',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Hind Siliguri, Noto Sans Bengali, sans-serif',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)';
                      }}
                    >
                      <Icon name="fa-arrow-left" size={13} />
                      আগের ধাপ
                    </button>
                  )}

                  {/* Next Step / Submit Button */}
                  {step < TOTAL_STEPS ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="btn-gold"
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 24px' }}
                    >
                      পরের ধাপ
                      <Icon name="fa-arrow-right" size={13} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn-gold"
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 24px' }}
                      disabled={loading}
                    >
                      {loading
                        ? <><Icon name="fa-spinner fa-spin" size={15} /> রেজিস্ট্রেশন হচ্ছে...</>
                        : <><Icon name="fa-user-plus" size={15} /> রেজিস্ট্রেশন সম্পন্ন করুন</>
                      }
                    </button>
                  )}
                </div>

                {/* Login link */}
                <p className="login-signup-prompt" style={{ marginTop: 14 }}>
                  ইতিমধ্যে রেজিস্ট্রেশন আছে?{' '}
                  <a href="/student-login"
                    onClick={e => { e.preventDefault(); navigate('/student-login'); }}
                    className="login-signup-link"
                  >
                    ছাত্র পোর্টালে লগইন করুন
                  </a>
                </p>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="login-footer">{footerText}</p>
        </div>
      </div>
    </>
  );
}
