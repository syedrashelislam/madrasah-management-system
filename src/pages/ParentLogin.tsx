import { useEffect, useState } from "react";
import { useParentEmailAuth } from "@/hooks/useParentEmailAuth";
import { usePublicSettings } from "@/hooks/useSettings";
import Icon from "@/components/Icon";
import ParallaxBackground from "@/components/ParallaxBackground";
import { useNavigate } from "react-router-dom";

type Tab = "login" | "signup";

export default function ParentLoginPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: settings = [] } = usePublicSettings();
  const { signIn, signUp, isAuthenticated, isLoading } = useParentEmailAuth();
  const navigate = useNavigate();

  const madrasaName = settings.find(s => s.key === "madrasa_name")?.value || "বাংলাদেশ ইসলামী ক্যাডেট মাদ্রাসা";
  const logoUrl = settings.find(s => s.key === "madrasa_logo_url")?.value || "";
  const footerText = settings.find(s => s.key === "login_footer_text")?.value || "© ২০২৫ মাদরাসা ERP সিস্টেম";

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/parent", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const resetForm = () => { setError(""); setSuccessMsg(""); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    if (!email || !password) { setError("ইমেইল ও পাসওয়ার্ড দিন"); return; }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (!result.success) { setError(result.error || "লগইন ব্যর্থ হয়েছে"); return; }
    navigate("/parent");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    if (!email || !password) { setError("ইমেইল ও পাসওয়ার্ড দিন"); return; }
    setLoading(true);
    const result = await signUp(email, password);
    setLoading(false);
    if (!result.success) { setError(result.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে"); return; }
    setSuccessMsg("রেজিস্ট্রেশন সফল! এখন লগইন করুন।");
    setTab("login");
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
            <p className="login-brand-subtitle">অভিভাবক পোর্টাল</p>
          </div>

          {/* ── Form Card ── */}
          <div className="login-form-card">
            <div className="login-portal-badge login-portal-badge--parent">
              <Icon name="fa-users" size={12} />
              অভিভাবক পোর্টাল
            </div>

            {/* Tab switcher */}
            <div className="login-tab-bar">
              {(["login", "signup"] as Tab[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); resetForm(); }}
                  className={`login-tab-btn login-tab-btn--parent${tab === t ? " active" : ""}`}
                >
                  <Icon name={t === "login" ? "fa-sign-in-alt" : "fa-user-plus"} size={13} />
                  {t === "login" ? "লগইন" : "নতুন অ্যাকাউন্ট"}
                </button>
              ))}
            </div>

            {/* Success message */}
            {successMsg && (
              <div className="login-success-msg">
                <Icon name="fa-check-circle" size={15} />
                {successMsg}
              </div>
            )}

            {/* ── Login Form ── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="login-form" autoComplete="on">
                <div className="login-field">
                  <label htmlFor="pl-email" className="login-label">ইমেইল</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-envelope" size={15} className="login-input-icon" />
                    <input
                      id="pl-email"
                      className="glass-input login-input"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      style={{ paddingLeft: 44 }}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="pl-password" className="login-label">পাসওয়ার্ড</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-lock" size={15} className="login-input-icon" />
                    <input
                      id="pl-password"
                      className="glass-input login-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="পাসওয়ার্ড লিখুন"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      style={{ paddingLeft: 44, paddingRight: 48 }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="login-eye-btn">
                      <Icon name={showPassword ? "fa-eye-slash" : "fa-eye"} size={15} />
                    </button>
                  </div>
                </div>

                <p className="login-info-note">
                  <Icon name="fa-info-circle" size={11} /> ছাত্রের রেজিস্ট্রেশনে ব্যবহৃত অভিভাবকের ইমেইল দিন।
                </p>

                <div aria-live="polite">
                  {error && <div className="login-error" role="alert"><Icon name="fa-exclamation-circle" size={14} /> {error}</div>}
                </div>

                <button type="submit" className="btn-gold login-submit-btn" disabled={loading}>
                  {loading
                    ? <><Icon name="fa-spinner fa-spin" size={16} /> লগইন হচ্ছে...</>
                    : <><Icon name="fa-sign-in-alt" size={16} /> অভিভাবক পোর্টালে প্রবেশ</>}
                </button>
              </form>
            )}

            {/* ── Sign-up Form ── */}
            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="login-form" autoComplete="off">
                <div className="login-field">
                  <label htmlFor="ps-email" className="login-label">ইমেইল</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-envelope" size={15} className="login-input-icon" />
                    <input
                      id="ps-email"
                      className="glass-input login-input"
                      type="email"
                      placeholder="আপনার ইমেইল লিখুন"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      style={{ paddingLeft: 44 }}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="ps-password" className="login-label">পাসওয়ার্ড তৈরি করুন</label>
                  <div className="login-input-wrap">
                    <Icon name="fa-lock" size={15} className="login-input-icon" />
                    <input
                      id="ps-password"
                      className="glass-input login-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      minLength={6}
                      style={{ paddingLeft: 44, paddingRight: 48 }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="login-eye-btn">
                      <Icon name={showPassword ? "fa-eye-slash" : "fa-eye"} size={15} />
                    </button>
                  </div>
                </div>

                <div className="login-notice-box login-notice-box--parent">
                  <Icon name="fa-info-circle" size={12} />
                  শুধুমাত্র যে ইমেইলটি ছাত্রের ভর্তি ফর্মে অভিভাবকের ইমেইল হিসেবে দেওয়া হয়েছে সেটি দিয়ে রেজিস্ট্রেশন করুন।
                </div>

                <div aria-live="polite">
                  {error && <div className="login-error" role="alert"><Icon name="fa-exclamation-circle" size={14} /> {error}</div>}
                </div>

                <button type="submit" className="btn-gold login-submit-btn" disabled={loading}>
                  {loading
                    ? <><Icon name="fa-spinner fa-spin" size={16} /> নিবন্ধন হচ্ছে...</>
                    : <><Icon name="fa-user-plus" size={16} /> অ্যাকাউন্ট তৈরি করুন</>}
                </button>
              </form>
            )}

            {/* ── Cross-portal links ── */}
            <div className="login-portal-links">
              <a href="/student-login" onClick={e => { e.preventDefault(); navigate("/student-login"); }} className="login-portal-link login-portal-link--student">
                <Icon name="fa-user-graduate" size={13} />
                ছাত্র পোর্টাল
              </a>
              <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }} className="login-portal-link login-portal-link--admin">
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
