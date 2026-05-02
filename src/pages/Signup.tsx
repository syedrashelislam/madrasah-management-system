import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSettings } from "@/hooks/useSettings";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { data: settings = [] } = usePublicSettings();
  const navigate = useNavigate();

  const madrasaName = settings.find(s => s.key === 'madrasa_name')?.value || 'বাংলাদেশ ইসলামী ক্যাডেট মাদ্রাসা';
  const madrasaSubtitle = settings.find(s => s.key === 'madrasa_subtitle')?.value || 'ERP ম্যানেজমেন্ট সিস্টেম';
  const logoUrl = settings.find(s => s.key === 'madrasa_logo_url')?.value || '';
  const footerText = settings.find(s => s.key === 'login_footer_text')?.value || '© ২০২৫ মাদরাসা ERP সিস্টেম';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) window.location.href = '/';
    });
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) { setError("সব তথ্য পূরণ করুন"); return; }
    if (password.length < 6) { setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"); return; }
    if (password !== confirmPassword) { setError("পাসওয়ার্ড মিলছে না"); return; }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/login' },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে");
        } else if (signUpError.message.includes("valid email")) {
          setError("সঠিক ইমেইল ঠিকানা দিন");
        } else if (signUpError.message.includes("password")) {
          setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      const SUPER_ADMIN_EMAIL = "syedraselislam1@gmail.com";
      const isSuperAdmin = email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
      const rolePayload = {
        role: isSuperAdmin ? "super_admin" : "member",
        allowed_pages: isSuperAdmin
          ? "dashboard,students,fees,payment_history,student_attendance,staff_attendance,biometric_attendance,income,expense,salary,cashbook,exams,notices,library,reports,whatsapp_messaging,parent,settings"
          : "parent",
      };

      if (signUpData?.session && signUpData?.user) {
        await supabase.from("user_roles").insert([{ user_id: signUpData.user.id, ...rolePayload }]);
        window.location.href = '/';
      } else if (signUpData?.user) {
        await supabase.from("user_roles").insert([{ user_id: signUpData.user.id, ...rolePayload }]);
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "অ্যাকাউন্ট তৈরি ব্যর্থ হয়েছে");
    }

    setLoading(false);
  };

  return (
    <>
      <ParallaxBackground />
      <div className="login-page-wrapper">
        <div className="login-mobile-card login-card-entrance">

          {/* ── Branding Header ── */}
          <div className="login-brand-header">
            <div className="login-logo-wrap">
              {logoUrl
                ? <img src={logoUrl} alt="মাদ্রাসার লোগো" className="login-logo-img" />
                : <span className="login-logo-fallback">م</span>
              }
            </div>
            <h1 className="login-brand-name">{madrasaName}</h1>
            <p className="login-brand-subtitle">{madrasaSubtitle}</p>
          </div>

          {/* ── Form Card ── */}
          <div className="login-form-card">
            <div className="login-portal-badge login-portal-badge--admin">
              <Icon name="fa-user-plus" size={12} />
              নতুন এডমিন অ্যাকাউন্ট
            </div>

            {/* ── Success State ── */}
            {success ? (
              <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(52,211,153,0.12)',
                  border: '2px solid rgba(52,211,153,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Icon name="fa-check-circle" size={30} style={{ color: '#34d399' }} />
                </div>
                <p style={{ color: '#34d399', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                  অ্যাকাউন্ট তৈরি হয়েছে!
                </p>
                <p style={{ fontSize: 13, color: 'var(--th-text-muted)', marginBottom: 20, lineHeight: 1.7 }}>
                  আপনার ইমেইলে একটি যাচাইকরণ লিংক পাঠানো হয়েছে।<br />
                  ইমেইল যাচাই করে লগইন করুন।
                </p>
                <button
                  className="btn-gold login-submit-btn"
                  onClick={() => navigate('/login')}
                >
                  <Icon name="fa-sign-in-alt" size={16} /> লগইন পেজে যান
                </button>
              </div>
            ) : (
              /* ── Signup Form ── */
              <form onSubmit={handleSignup} className="login-form" autoComplete="off">

                <div className="login-field">
                  <label htmlFor="signup-email" className="login-label">ইমেইল</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-envelope" size={15} className="login-input-icon" />
                    <input
                      id="signup-email"
                      className="glass-input login-input"
                      type="email"
                      placeholder="আপনার ইমেইল লিখুন"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="signup-password" className="login-label">পাসওয়ার্ড</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-lock" size={15} className="login-input-icon" />
                    <input
                      id="signup-password"
                      className="glass-input login-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-required="true"
                      style={{ paddingLeft: 44, paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                      className="login-eye-btn"
                    >
                      <Icon name={showPassword ? "fa-eye-slash" : "fa-eye"} size={15} />
                    </button>
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="signup-confirm" className="login-label">পাসওয়ার্ড নিশ্চিত করুন</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-lock" size={15} className="login-input-icon" />
                    <input
                      id="signup-confirm"
                      className="glass-input login-input"
                      type={showConfirm ? "text" : "password"}
                      placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-required="true"
                      style={{ paddingLeft: 44, paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                      className="login-eye-btn"
                    >
                      <Icon name={showConfirm ? "fa-eye-slash" : "fa-eye"} size={15} />
                    </button>
                  </div>
                </div>

                <div aria-live="polite" aria-atomic="true">
                  {error && (
                    <div className="login-error" role="alert">
                      <Icon name="fa-exclamation-circle" size={14} /> {error}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-gold login-submit-btn" disabled={loading}>
                  {loading
                    ? <><Icon name="fa-spinner fa-spin" size={16} /> তৈরি হচ্ছে...</>
                    : <><Icon name="fa-user-plus" size={16} /> অ্যাকাউন্ট তৈরি করুন</>
                  }
                </button>

                <p className="login-signup-prompt" style={{ marginTop: 4 }}>
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <a
                    href="/login"
                    onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                    className="login-signup-link"
                  >
                    লগইন করুন
                  </a>
                </p>
              </form>
            )}
          </div>

          <p className="login-footer">{footerText}</p>
        </div>
      </div>
    </>
  );
}
