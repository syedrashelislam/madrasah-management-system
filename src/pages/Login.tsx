import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSettings } from "@/hooks/useSettings";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) window.location.href = '/';
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("ইমেইল ও পাসওয়ার্ড দিন"); return; }
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      if (signInError.message === "Invalid login credentials") {
        setError("ইমেইল বা পাসওয়ার্ড ভুল");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("আপনার ইমেইল এখনো যাচাই হয়নি। ইমেইল চেক করুন।");
      } else {
        setError(signInError.message);
      }
      setLoading(false);
      return;
    }

    if (data?.user) {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1);

      if (!existingRole || existingRole.length === 0) {
        const SUPER_ADMIN_EMAIL = "syedraselislam1@gmail.com";
        const isSuperAdmin = data.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
        await supabase.from("user_roles").insert([{
          user_id: data.user.id,
          role: isSuperAdmin ? "super_admin" : "member",
          allowed_pages: isSuperAdmin
            ? "dashboard,students,fees,payment_history,student_attendance,staff_attendance,biometric_attendance,income,expense,salary,cashbook,exams,notices,library,reports,whatsapp_messaging,parent,settings"
            : "parent",
        }]);
      }
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
              <Icon name="fa-shield-alt" size={12} />
              এডমিন / শিক্ষক লগইন
            </div>

            <form onSubmit={handleLogin} className="login-form" autoComplete="on">

              <div className="login-field">
                <label htmlFor="admin-email" className="login-label">ইমেইল</label>
                <div className="login-input-wrap">
                  <Icon name="fa-envelope" size={15} className="login-input-icon" />
                  <input
                    id="admin-email"
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
                <label htmlFor="admin-password" className="login-label">পাসওয়ার্ড</label>
                <div className="login-input-wrap">
                  <Icon name="fa-lock" size={15} className="login-input-icon" />
                  <input
                    id="admin-password"
                    className="glass-input login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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

              <div aria-live="polite" aria-atomic="true">
                {error && (
                  <div className="login-error" role="alert">
                    <Icon name="fa-exclamation-circle" size={14} /> {error}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-gold login-submit-btn" disabled={loading}>
                {loading
                  ? <><Icon name="fa-spinner fa-spin" size={16} /> লগইন হচ্ছে...</>
                  : <><Icon name="fa-sign-in-alt" size={16} /> লগইন করুন</>
                }
              </button>
            </form>

            {/* ── Signup link ── */}
            <p className="login-signup-prompt" style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
              অ্যাকাউন্ট নেই?{' '}
              <a
                href="/signup"
                onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
                className="login-signup-link"
              >
                অ্যাকাউন্ট তৈরি করুন
              </a>
            </p>

            {/* ── Portal Links ── */}
            <div className="login-portal-links">
              <a href="/student-login" onClick={(e) => { e.preventDefault(); navigate('/student-login'); }} className="login-portal-link login-portal-link--student">
                <Icon name="fa-user-graduate" size={13} />
                ছাত্র পোর্টাল
              </a>
              <a href="/parent-login" onClick={(e) => { e.preventDefault(); navigate('/parent-login'); }} className="login-portal-link login-portal-link--parent">
                <Icon name="fa-users" size={13} />
                অভিভাবক পোর্টাল
              </a>
            </div>
          </div>

          <p className="login-footer">{footerText}</p>
        </div>
      </div>
    </>
  );
}
