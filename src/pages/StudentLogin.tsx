import { useEffect, useState } from "react";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { usePublicSettings } from "@/hooks/useSettings";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useNavigate } from "react-router-dom";

export default function StudentLoginPage() {
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { data: settings = [] } = usePublicSettings();
  const { loginStudent, isAuthenticated } = useStudentAuth();
  const navigate = useNavigate();

  const madrasaName = settings.find(s => s.key === 'madrasa_name')?.value || 'বাংলাদেশ ইসলামী ক্যাডেট মাদ্রাসা';
  const logoUrl = settings.find(s => s.key === 'madrasa_logo_url')?.value || '';
  const footerText = settings.find(s => s.key === 'login_footer_text')?.value || '© ২০২৫ মাদরাসা ERP সিস্টেম';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/student-portal', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!studentId || !password) {
      setError("ছাত্র আইডি ও পাসওয়ার্ড দিন");
      return;
    }
    setLoading(true);
    const result = await loginStudent(studentId, password);
    if (!result.success) {
      setError("ছাত্র আইডি বা পাসওয়ার্ড ভুল");
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/student-portal');
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
            <p className="login-brand-subtitle">ছাত্র পোর্টাল</p>
          </div>

          {/* ── Form Card ── */}
          <div className="login-form-card">
            <div className="login-portal-badge login-portal-badge--student">
              <Icon name="fa-user-graduate" size={12} />
              ছাত্র লগইন
            </div>

            <form onSubmit={handleLogin} className="login-form" autoComplete="on">

              <div className="login-field">
                <label htmlFor="student-id-input" className="login-label">ছাত্র আইডি</label>
                <div className="login-input-wrap">
                  <Icon name="fa-id-card" size={15} className="login-input-icon" />
                  <input
                    id="student-id-input"
                    className="glass-input login-input"
                    type="text"
                    placeholder="আপনার ছাত্র আইডি লিখুন"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    autoComplete="username"
                    aria-required="true"
                    style={{ paddingLeft: 44 }}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="student-password-input" className="login-label">পাসওয়ার্ড</label>
                <div className="login-input-wrap">
                  <Icon name="fa-lock" size={15} className="login-input-icon" />
                  <input
                    id="student-password-input"
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

              <button
                type="submit"
                className="btn-gold login-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <><Icon name="fa-spinner fa-spin" size={16} /> প্রবেশ হচ্ছে...</>
                  : <><Icon name="fa-sign-in-alt" size={16} /> ছাত্র পোর্টালে প্রবেশ করুন</>
                }
              </button>
            </form>

            {/* ── Portal Links ── */}
            <div className="login-portal-links">
              <a href="/parent-login" onClick={(e) => { e.preventDefault(); navigate('/parent-login'); }} className="login-portal-link login-portal-link--parent">
                <Icon name="fa-users" size={13} />
                অভিভাবক পোর্টাল
              </a>
              <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="login-portal-link login-portal-link--admin">
                <Icon name="fa-shield-alt" size={13} />
                এডমিন লগইন
              </a>
            </div>
          </div>

          <p className="login-footer">{footerText}</p>
        </div>
      </div>
    </>
  );
}
