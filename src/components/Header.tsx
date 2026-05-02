import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createHoverPrefetchProps } from '@/lib/prefetch';
import Icon from './Icon';

/* ═══════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV
   - Smooth icon-up / label-down animation (তোমার design)
   - Ripple effect on tap
   - Sub-menu accordion
   - Zero jank: CSS transition only, no re-render on animation
═══════════════════════════════════════════════════════════ */

interface MobNavProps {
  go: (path: string) => void;
  pathname: string;
  P: (key: string) => boolean;
  handleLogout: () => void;
}

function MobileBottomNav({ go, pathname, P, handleLogout }: MobNavProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    const fn = (e: TouchEvent | MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenMenu(null); setOpenSub(null);
      }
    };
    document.addEventListener('touchstart', fn);
    document.addEventListener('mousedown', fn);
    return () => { document.removeEventListener('touchstart', fn); document.removeEventListener('mousedown', fn); };
  }, []);

  // Close on route change
  useEffect(() => { setOpenMenu(null); setOpenSub(null); }, [pathname]);

  const toggle = useCallback((key: string) => {
    setOpenMenu(prev => prev === key ? null : key);
    setOpenSub(null);
  }, []);

  const nav = useCallback((path: string) => {
    go(path);
    setOpenMenu(null);
    setOpenSub(null);
  }, [go]);

  const isActive = (paths: string[]) =>
    paths.some(p => p === '/' ? pathname === '/' : pathname.startsWith(p));

  // Ripple effect
  const addRipple = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left - size / 2;
      y = e.touches[0].clientY - rect.top - size / 2;
    } else {
      x = e.clientX - rect.left - size / 2;
      y = e.clientY - rect.top - size / 2;
    }
    ripple.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;background:rgba(212,175,55,0.25);width:${size}px;height:${size}px;left:${x}px;top:${y}px;transform:scale(0);animation:mob-ripple 0.5s ease-out forwards;`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // Nav items config — শিক্ষার্থী ও হাজিরা সরাসরি accessible
  const navItems = [
    { key: 'home',     icon: 'fa-home',          label: 'হোম',        show: P('dashboard'), path: '/', active: isActive(['/']) && !openMenu },
    { key: 'students', icon: 'fa-user-graduate',  label: 'ছাত্র',      show: P('students')||P('student_attendance'), path: null, active: openMenu === 'students' || (isActive(['/students','/student-attendance','/id-card']) && !openMenu) },
    { key: 'admit',    icon: 'fa-user-plus',      label: 'নতুন ভর্তি', show: P('students'), path: '/students/new', active: isActive(['/students/new']) && !openMenu },
    { key: 'att',      icon: 'fa-clipboard-check',label: 'হাজিরা',     show: P('student_attendance')||P('staff_attendance'), path: null, active: openMenu === 'att' || (isActive(['/student-attendance','/attendance']) && !openMenu) },
    { key: 'more',     icon: 'fa-ellipsis-h',     label: 'আরও',        show: true, path: null, active: openMenu === 'more' },
  ].filter(item => item.show);

  return (
    <div ref={wrapRef} className="mnav-wrap">
      {/* Backdrop */}
      {openMenu && (
        <div className="mnav-backdrop" onClick={() => { setOpenMenu(null); setOpenSub(null); }} />
      )}

      {/* ── হিসাব popup ── */}
      {openMenu === 'hisab' && (
        <div className="mnav-popup mnav-popup--left">
          <div className="mnav-popup-head">💰 হিসাব ও ফি</div>
          {P('fees') && <MPopBtn icon="fa-hand-holding-usd" label="ফি আদায়" onClick={() => nav('/fees')}/>}
          {P('payment_history') && <MPopBtn icon="fa-receipt" label="পেমেন্ট ইতিহাস" onClick={() => nav('/student-payment-history')}/>}
          {P('income') && <MPopBtn icon="fa-arrow-circle-down" label="আয়" color="#34d399" onClick={() => nav('/income')}/>}
          {P('expense') && <MPopBtn icon="fa-arrow-circle-up" label="ব্যয়" color="#f87171" onClick={() => nav('/expense')}/>}
          {P('salary') && <MPopBtn icon="fa-money-check-alt" label="বেতন" onClick={() => nav('/salary')}/>}
          {P('cashbook') && <MPopBtn icon="fa-book" label="ক্যাশবুক" onClick={() => nav('/cashbook')}/>}
        </div>
      )}

      {/* ── শিক্ষার্থী popup ── */}
      {openMenu === 'students' && (
        <div className="mnav-popup mnav-popup--cl">
          <div className="mnav-popup-head">👨‍🎓 শিক্ষার্থী</div>
          {P('students') && <MPopBtn icon="fa-list" label="ছাত্র তালিকা" onClick={() => nav('/students')}/>}
          {P('students') && <MPopBtn icon="fa-user-plus" label="নতুন ভর্তি" onClick={() => nav('/students/new')}/>}
          {P('student_attendance') && <MPopBtn icon="fa-calendar-check" label="দৈনিক হাজিরা" onClick={() => nav('/student-attendance')}/>}
          {P('id_card') && <MPopBtn icon="fa-id-card" label="আইডি কার্ড" onClick={() => nav('/id-card')}/>}
        </div>
      )}

      {/* ── হাজিরা popup ── */}
      {openMenu === 'att' && (
        <div className="mnav-popup mnav-popup--cl">
          <div className="mnav-popup-head">✅ হাজিরা</div>
          {P('student_attendance') && <MPopBtn icon="fa-clipboard-check" label="ছাত্র হাজিরা" onClick={() => nav('/student-attendance')}/>}
          {P('staff_attendance') && <MPopBtn icon="fa-user-check" label="স্টাফ হাজিরা" onClick={() => nav('/attendance')}/>}
          {P('biometric_attendance') && <MPopBtn icon="fa-fingerprint" label="বায়োমেট্রিক" onClick={() => nav('/biometric-attendance')}/>}
        </div>
      )}

      {/* ── স্টাফ popup ── */}
      {openMenu === 'staff' && (
        <div className="mnav-popup mnav-popup--cl">
          <div className="mnav-popup-head">👨‍🏫 স্টাফ</div>
          {P('staff_attendance') && <MPopBtn icon="fa-users" label="স্টাফ হাজিরা" onClick={() => nav('/attendance')}/>}
          {P('salary') && <MPopBtn icon="fa-money-check-alt" label="বেতন ব্যবস্থাপনা" onClick={() => nav('/salary')}/>}
          {P('biometric_attendance') && <MPopBtn icon="fa-fingerprint" label="বায়োমেট্রিক" onClick={() => nav('/biometric-attendance')}/>}
        </div>
      )}

      {/* ── আরও popup (nested accordion) ── */}
      {openMenu === 'more' && (
        <div className="mnav-popup mnav-popup--right mnav-popup--scroll">
          <div className="mnav-popup-head">☰ আরও</div>

          {(P('fees')||P('income')||P('expense')||P('cashbook')) && (
            <MAccord
              icon="fa-calculator" label="হিসাব ও ফি"
              open={openSub === 'hisab'} onToggle={() => setOpenSub(s => s==='hisab'?null:'hisab')}
            >
              {P('fees') && <MAccordItem icon="fa-hand-holding-usd" label="ফি আদায়" onClick={() => nav('/fees')}/>}
              {P('payment_history') && <MAccordItem icon="fa-receipt" label="পেমেন্ট ইতিহাস" onClick={() => nav('/student-payment-history')}/>}
              {P('income') && <MAccordItem icon="fa-arrow-circle-down" label="আয়" onClick={() => nav('/income')}/>}
              {P('expense') && <MAccordItem icon="fa-arrow-circle-up" label="ব্যয়" onClick={() => nav('/expense')}/>}
              {P('salary') && <MAccordItem icon="fa-money-check-alt" label="বেতন" onClick={() => nav('/salary')}/>}
              {P('cashbook') && <MAccordItem icon="fa-book" label="ক্যাশবুক" onClick={() => nav('/cashbook')}/>}
            </MAccord>
          )}

          {(P('staff_attendance')||P('salary')||P('biometric_attendance')) && (
            <MAccord
              icon="fa-users" label="স্টাফ"
              open={openSub === 'staff'} onToggle={() => setOpenSub(s => s==='staff'?null:'staff')}
            >
              {P('staff_attendance') && <MAccordItem icon="fa-user-check" label="স্টাফ হাজিরা" onClick={() => nav('/attendance')}/>}
              {P('salary') && <MAccordItem icon="fa-calendar-minus" label="ছুটি ব্যবস্থাপনা" onClick={() => nav('/salary?tab=leave')}/>}
              {P('salary') && <MAccordItem icon="fa-money-check-alt" label="বেতন ও ভাতা" onClick={() => nav('/salary')}/>}
              {P('biometric_attendance') && <MAccordItem icon="fa-fingerprint" label="বায়োমেট্রিক" onClick={() => nav('/biometric-attendance')}/>}
            </MAccord>
          )}

          {(P('class_routine')||P('syllabus')||P('assignments')||P('hifz_tracking')) && (
            <MAccord
              icon="fa-graduation-cap" label="একাডেমিক"
              open={openSub === 'acad'} onToggle={() => setOpenSub(s => s==='acad'?null:'acad')}
            >
              {P('class_routine') && <MAccordItem icon="fa-clock" label="ক্লাস রুটিন" onClick={() => nav('/class-routine')}/>}
              {P('syllabus') && <MAccordItem icon="fa-book-open" label="সিলেবাস" onClick={() => nav('/syllabus')}/>}
              {P('assignments') && <MAccordItem icon="fa-tasks" label="অ্যাসাইনমেন্ট" onClick={() => nav('/assignments')}/>}
              {P('hifz_tracking') && <MAccordItem icon="fa-mosque" label="হিফজ ট্র্যাকিং" onClick={() => nav('/hifz')} gold/>}
            </MAccord>
          )}

          {(P('exams')||P('exam_routine')||P('admit_card')||P('marksheet')||P('teacher_grade_entry')) && (
            <MAccord
              icon="fa-file-alt" label="পরীক্ষা"
              open={openSub === 'exam'} onToggle={() => setOpenSub(s => s==='exam'?null:'exam')}
            >
              {P('exam_routine') && <MAccordItem icon="fa-calendar-alt" label="পরীক্ষার রুটিন" onClick={() => nav('/exam-routine')}/>}
              {P('admit_card') && <MAccordItem icon="fa-id-badge" label="অ্যাডমিট কার্ড" onClick={() => nav('/admit-card')}/>}
              {P('exams') && <MAccordItem icon="fa-edit" label="নম্বর এন্ট্রি" onClick={() => nav('/exams')}/>}
              {P('teacher_grade_entry') && <MAccordItem icon="fa-pen-fancy" label="গ্রেড এন্ট্রি" onClick={() => nav('/teacher-grade-entry')}/>}
              {P('marksheet') && <MAccordItem icon="fa-scroll" label="মার্কশিট" onClick={() => nav('/marksheet')}/>}
            </MAccord>
          )}

          {(P('notices')||P('whatsapp_messaging')) && (
            <MAccord
              icon="fa-comments" label="যোগাযোগ"
              open={openSub === 'comm'} onToggle={() => setOpenSub(s => s==='comm'?null:'comm')}
            >
              {P('notices') && <MAccordItem icon="fa-bullhorn" label="নোটিশ বোর্ড" onClick={() => nav('/notices')}/>}
              {P('whatsapp_messaging') && <MAccordItem icon="fa-sms" label="মেসেজ / এসএমএস" onClick={() => nav('/whatsapp')}/>}
            </MAccord>
          )}

          {(P('library')||P('hostel')||P('inventory')||P('reports')) && (
            <MAccord
              icon="fa-th-large" label="অন্যান্য"
              open={openSub === 'oth'} onToggle={() => setOpenSub(s => s==='oth'?null:'oth')}
            >
              {P('library') && <MAccordItem icon="fa-book-reader" label="লাইব্রেরি" onClick={() => nav('/library')}/>}
              {P('hostel') && <MAccordItem icon="fa-building" label="হোস্টেল" onClick={() => nav('/hostel')}/>}
              {P('inventory') && <MAccordItem icon="fa-boxes" label="ইনভেন্টরি" onClick={() => nav('/inventory')}/>}
              {P('reports') && <MAccordItem icon="fa-chart-bar" label="রিপোর্ট" onClick={() => nav('/reports')}/>}
            </MAccord>
          )}

          <div className="mnav-popup-divider"/>
          {P('settings') && <MPopBtn icon="fa-cog" label="সেটিংস" onClick={() => nav('/settings')}/>}
          <MPopBtn icon="fa-sign-out-alt" label="লগআউট" color="#f87171" onClick={handleLogout}/>
        </div>
      )}

      {/* ── Bottom Bar ── */}
      <nav className="mnav-bar">
        {navItems.map(item => (
          <button
            key={item.key}
            data-key={item.key}
            className={`mnav-btn${item.active ? ' mnav-btn--active' : ''}`}
            onClick={(e) => {
              addRipple(e);
              if (item.path) { setOpenMenu(null); go(item.path); }
              else toggle(item.key);
            }}
            onTouchStart={addRipple}
          >
            <span className="mnav-btn-ico">
              <Icon name={item.icon} size={22}/>
            </span>
            <span className="mnav-btn-lbl">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

/* Small helper components */
function MPopBtn({ icon, label, color, onClick }: { icon: string; label: string; color?: string; onClick: () => void }) {
  return (
    <button className="mnav-pop-btn" onClick={onClick} style={color ? { color } : undefined}>
      <Icon name={icon} size={15} style={color ? { color } : undefined}/> {label}
    </button>
  );
}

function MAccord({ icon, label, open, onToggle, children }: {
  icon: string; label: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`mnav-accord${open ? ' mnav-accord--open' : ''}`}>
      <button className="mnav-accord-head" onClick={onToggle}>
        <Icon name={icon} size={14}/> {label}
        <Icon name="fa-chevron-down" size={10} style={{ marginLeft: 'auto', transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}/>
      </button>
      <div className="mnav-accord-body">{children}</div>
    </div>
  );
}

function MAccordItem({ icon, label, onClick, gold }: { icon: string; label: string; onClick: () => void; gold?: boolean }) {
  return (
    <button className="mnav-accord-item" onClick={onClick} style={gold ? { color: '#d4af37' } : undefined}>
      <Icon name={icon} size={12} style={gold ? { color: '#d4af37' } : undefined}/> {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN HEADER (Desktop unchanged)
═══════════════════════════════════════════════════════════ */
const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const { data: settings = [] } = useSettings();
  const { isMember, hasPageAccess } = useUserRole();
  const { profile: userProfile } = useUserProfile();

  const madrasaName = settings.find(s => s.key === 'madrasa_name')?.value || 'বাংলাদেশ ইসলামী ক্যাডেট মাদ্রাসা';
  const madrasaSubtitle = settings.find(s => s.key === 'madrasa_subtitle')?.value || 'এন্ড স্কিল ডেভেলপমেন্ট';
  const logoUrl = settings.find(s => s.key === 'madrasa_logo_url')?.value || '';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUserEmail(session?.user?.email || ''));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setCurrentUserEmail(s?.user?.email || ''));
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (paths: string[]) => paths.includes(location.pathname);
  const go = (path: string) => { navigate(path); setMobileOpen(false); setOpenDropdown(null); };
  const toggleDropdown = (name: string) => setOpenDropdown(openDropdown === name ? null : name);
  const prefetch = (path: string) => createHoverPrefetchProps(path);
  const P = hasPageAccess;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('সফলভাবে লগআউট হয়েছে');
    navigate('/login');
  };

  const userName = userProfile?.display_name || (currentUserEmail ? currentUserEmail.split('@')[0] : '...');
  const userAvatarUrl = userProfile?.avatar_url || '';
  const userInitials = (userProfile?.display_name || currentUserEmail || '?')
    .split(/[\s@]/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 999 }} onClick={() => setMobileOpen(false)} />}
      <header className={`hdr ${scrolled ? 'hdr--scrolled' : ''}`}>
        <div className="hdr__inner">
          {/* Logo */}
          <a onClick={() => isMember ? go('/parent') : go('/')} className="hdr__brand" style={{ cursor: 'pointer' }} {...(isMember ? prefetch('/parent') : prefetch('/'))}>
            <div className="hdr__logo">
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : 'م'}
            </div>
            <div className="hdr__brand-text">
              <h1 className="hdr__title">{madrasaName}</h1>
              <p className="hdr__subtitle">{madrasaSubtitle}</p>
            </div>
          </a>

          <button className={`mobile-menu-btn ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(!mobileOpen)}>
            <span/><span/><span/>
          </button>

          {/* Desktop nav */}
          <nav className={`hdr__nav ${mobileOpen ? 'active' : ''}`}>
            {P('dashboard') && <a onClick={() => go('/')} className={`hdr__pill ${isActive(['/']) ? 'hdr__pill--active' : ''}`} {...prefetch('/')}><Icon name="fa-tachometer-alt" size={13}/> ড্যাশবোর্ড</a>}

            {(P('students')||P('student_attendance')||P('id_card')) && (
              <div className={`hdr__dropdown ${openDropdown === 'students' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('students') : go('/students')} className={`hdr__pill ${isActive(['/students','/students/new','/student-attendance','/id-card']) ? 'hdr__pill--active' : ''}`} {...prefetch('/students')}>
                  <Icon name="fa-user-graduate" size={13}/> শিক্ষার্থী <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('students') && <a onClick={() => go('/students/new')} className="hdr__dropdown-link" {...prefetch('/students/new')}><Icon name="fa-user-plus" size={13} className="hdr__dropdown-icon"/> নতুন ভর্তি</a>}
                  {P('students') && <a onClick={() => go('/students')} className="hdr__dropdown-link" {...prefetch('/students')}><Icon name="fa-users" size={13} className="hdr__dropdown-icon"/> শিক্ষার্থীর তালিকা</a>}
                  {P('student_attendance') && <a onClick={() => go('/student-attendance')} className="hdr__dropdown-link" {...prefetch('/student-attendance')}><Icon name="fa-clipboard-check" size={13} className="hdr__dropdown-icon"/> দৈনিক হাজিরা</a>}
                  {P('id_card') && <a onClick={() => go('/id-card')} className="hdr__dropdown-link" {...prefetch('/id-card')}><Icon name="fa-id-card" size={13} className="hdr__dropdown-icon"/> আইডি কার্ড</a>}
                </div>
              </div>
            )}

            {(P('staff_attendance')||P('salary')||P('biometric_attendance')) && (
              <div className={`hdr__dropdown ${openDropdown === 'staff' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('staff') : go('/attendance')} className={`hdr__pill ${isActive(['/attendance','/salary','/biometric-attendance']) ? 'hdr__pill--active' : ''}`} {...prefetch('/attendance')}>
                  <Icon name="fa-chalkboard-teacher" size={13}/> স্টাফ <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('staff_attendance') && <a onClick={() => go('/attendance')} className="hdr__dropdown-link" {...prefetch('/attendance')}><Icon name="fa-users" size={13} className="hdr__dropdown-icon"/> স্টাফ তালিকা ও হাজিরা</a>}
                  {P('salary') && <a onClick={() => go('/salary?tab=leave')} className="hdr__dropdown-link"><Icon name="fa-calendar-minus" size={13} className="hdr__dropdown-icon"/> ছুটি ব্যবস্থাপনা</a>}
                  {P('salary') && <a onClick={() => go('/salary')} className="hdr__dropdown-link" {...prefetch('/salary')}><Icon name="fa-money-check-alt" size={13} className="hdr__dropdown-icon"/> বেতন ও ভাতা</a>}
                  {P('biometric_attendance') && <a onClick={() => go('/biometric-attendance')} className="hdr__dropdown-link" {...prefetch('/biometric-attendance')}><Icon name="fa-fingerprint" size={13} className="hdr__dropdown-icon"/> বায়োমেট্রিক হাজিরা</a>}
                </div>
              </div>
            )}

            {(P('class_routine')||P('syllabus')||P('assignments')||P('hifz_tracking')) && (
              <div className={`hdr__dropdown ${openDropdown === 'academic' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('academic') : undefined} className={`hdr__pill ${isActive(['/class-routine','/syllabus','/assignments','/hifz']) ? 'hdr__pill--active' : ''}`}>
                  <Icon name="fa-university" size={13}/> একাডেমিক <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('class_routine') && <a onClick={() => go('/class-routine')} className="hdr__dropdown-link" {...prefetch('/class-routine')}><Icon name="fa-clock" size={13} className="hdr__dropdown-icon"/> ক্লাস রুটিন</a>}
                  {P('syllabus') && <a onClick={() => go('/syllabus')} className="hdr__dropdown-link" {...prefetch('/syllabus')}><Icon name="fa-book-reader" size={13} className="hdr__dropdown-icon"/> সিলেবাস</a>}
                  {P('assignments') && <a onClick={() => go('/assignments')} className="hdr__dropdown-link" {...prefetch('/assignments')}><Icon name="fa-tasks" size={13} className="hdr__dropdown-icon"/> অ্যাসাইনমেন্ট</a>}
                  {P('hifz_tracking') && <a onClick={() => go('/hifz')} className="hdr__dropdown-link" {...prefetch('/hifz')}><Icon name="fa-mosque" size={13} className="hdr__dropdown-icon" style={{color:'#d4af37'}}/> হিফজ ট্র্যাকিং</a>}
                </div>
              </div>
            )}

            {(P('exams')||P('exam_routine')||P('admit_card')||P('marksheet')||P('teacher_grade_entry')) && (
              <div className={`hdr__dropdown ${openDropdown === 'exams' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('exams') : go('/exams')} className={`hdr__pill ${isActive(['/exams','/exam-routine','/admit-card','/marksheet','/teacher-grade-entry']) ? 'hdr__pill--active' : ''}`} {...prefetch('/exams')}>
                  <Icon name="fa-file-alt" size={13}/> পরীক্ষা <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('exam_routine') && <a onClick={() => go('/exam-routine')} className="hdr__dropdown-link" {...prefetch('/exam-routine')}><Icon name="fa-calendar-alt" size={13} className="hdr__dropdown-icon"/> পরীক্ষার রুটিন</a>}
                  {P('admit_card') && <a onClick={() => go('/admit-card')} className="hdr__dropdown-link" {...prefetch('/admit-card')}><Icon name="fa-address-card" size={13} className="hdr__dropdown-icon"/> অ্যাডমিট কার্ড</a>}
                  {P('exams') && <a onClick={() => go('/exams')} className="hdr__dropdown-link" {...prefetch('/exams')}><Icon name="fa-edit" size={13} className="hdr__dropdown-icon"/> নম্বর এন্ট্রি</a>}
                  {P('teacher_grade_entry') && <a onClick={() => go('/teacher-grade-entry')} className="hdr__dropdown-link" {...prefetch('/teacher-grade-entry')}><Icon name="fa-pen-fancy" size={13} className="hdr__dropdown-icon"/> শিক্ষক গ্রেড এন্ট্রি</a>}
                  {P('marksheet') && <a onClick={() => go('/marksheet')} className="hdr__dropdown-link" {...prefetch('/marksheet')}><Icon name="fa-scroll" size={13} className="hdr__dropdown-icon"/> মার্কশিট</a>}
                </div>
              </div>
            )}

            {(P('fees')||P('payment_history')||P('income')||P('expense')||P('cashbook')) && (
              <div className={`hdr__dropdown ${openDropdown === 'accounts' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('accounts') : go('/fees')} className={`hdr__pill ${isActive(['/fees','/student-payment-history','/income','/expense','/cashbook','/monthly-closing']) ? 'hdr__pill--active' : ''}`} {...prefetch('/fees')}>
                  <Icon name="fa-wallet" size={13}/> হিসাব <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('fees') && <a onClick={() => go('/fees')} className="hdr__dropdown-link" {...prefetch('/fees')}><Icon name="fa-hand-holding-usd" size={13} className="hdr__dropdown-icon"/> ফি কালেকশন</a>}
                  {P('payment_history') && <a onClick={() => go('/student-payment-history')} className="hdr__dropdown-link" {...prefetch('/student-payment-history')}><Icon name="fa-receipt" size={13} className="hdr__dropdown-icon"/> রশিদ / ইনভয়েস</a>}
                  {P('income') && <a onClick={() => go('/income')} className="hdr__dropdown-link" {...prefetch('/income')}><Icon name="fa-money-bill-wave" size={13} className="hdr__dropdown-icon"/> আয় ব্যবস্থাপনা</a>}
                  {P('expense') && <a onClick={() => go('/expense')} className="hdr__dropdown-link" {...prefetch('/expense')}><Icon name="fa-file-invoice-dollar" size={13} className="hdr__dropdown-icon"/> খরচ ব্যবস্থাপনা</a>}
                  {P('cashbook') && <a onClick={() => go('/cashbook')} className="hdr__dropdown-link" {...prefetch('/cashbook')}><Icon name="fa-book" size={13} className="hdr__dropdown-icon"/> ক্যাশবুক</a>}
                </div>
              </div>
            )}

            {(P('notices')||P('whatsapp_messaging')) && (
              <div className={`hdr__dropdown ${openDropdown === 'communication' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('communication') : go('/notices')} className={`hdr__pill ${isActive(['/notices','/whatsapp']) ? 'hdr__pill--active' : ''}`} {...prefetch('/notices')}>
                  <Icon name="fa-bullhorn" size={13}/> যোগাযোগ <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('notices') && <a onClick={() => go('/notices')} className="hdr__dropdown-link" {...prefetch('/notices')}><Icon name="fa-bullhorn" size={13} className="hdr__dropdown-icon"/> নোটিশ বোর্ড</a>}
                  {P('whatsapp_messaging') && <a onClick={() => go('/whatsapp')} className="hdr__dropdown-link" {...prefetch('/whatsapp')}><Icon name="fa-whatsapp" size={13} style={{color:'#25D366'}}/> মেসেজ / এসএমএস</a>}
                </div>
              </div>
            )}

            {(P('library')||P('hostel')||P('inventory')||P('reports')) && (
              <div className={`hdr__dropdown ${openDropdown === 'others' ? 'open' : ''}`}>
                <a onClick={() => window.innerWidth < 992 ? toggleDropdown('others') : undefined} className={`hdr__pill ${isActive(['/library','/hostel','/inventory','/reports']) ? 'hdr__pill--active' : ''}`}>
                  <Icon name="fa-th-large" size={13}/> অন্যান্য <Icon name="fa-chevron-down" size={9}/>
                </a>
                <div className="hdr__dropdown-panel">
                  {P('library') && <a onClick={() => go('/library')} className="hdr__dropdown-link" {...prefetch('/library')}><Icon name="fa-book-open" size={13} className="hdr__dropdown-icon"/> লাইব্রেরি</a>}
                  {P('hostel') && <a onClick={() => go('/hostel')} className="hdr__dropdown-link" {...prefetch('/hostel')}><Icon name="fa-bed" size={13} className="hdr__dropdown-icon"/> হোস্টেল</a>}
                  {P('inventory') && <a onClick={() => go('/inventory')} className="hdr__dropdown-link" {...prefetch('/inventory')}><Icon name="fa-boxes" size={13} className="hdr__dropdown-icon"/> ইনভেন্টরি</a>}
                  {P('reports') && <a onClick={() => go('/reports')} className="hdr__dropdown-link" {...prefetch('/reports')}><Icon name="fa-chart-line" size={13} className="hdr__dropdown-icon"/> রিপোর্ট</a>}
                </div>
              </div>
            )}

            <div className="hdr__mobile-bottom">
              {P('settings') && <a onClick={() => go('/settings')} className={`hdr__pill ${isActive(['/settings']) ? 'hdr__pill--active' : ''}`} {...prefetch('/settings')}><Icon name="fa-cog" size={15}/> সেটিংস</a>}
              <a onClick={handleLogout} className="hdr__pill hdr__pill--logout"><Icon name="fa-sign-out-alt" size={15}/> লগআউট</a>
              {currentUserEmail && (
                <div className="hdr__mobile-user-info" style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="hdr__user-avatar-inline hdr__user-avatar-inline--sm">
                    {userAvatarUrl ? <img src={userAvatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span className="hdr__initials hdr__initials--sm">{userInitials}</span>}
                  </div>
                  <span>{userName}</span>
                </div>
              )}
            </div>
          </nav>

          {/* Desktop settings dropdown */}
          <div className="hdr__actions">
            <div className={`hdr__dropdown hdr__settings-dropdown ${openDropdown === 'settings-menu' ? 'open' : ''}`}>
              <button onClick={() => toggleDropdown('settings-menu')} className="hdr__settings-trigger-btn" title="সেটিংস">
                <Icon name="fa-cog" size={18}/><Icon name="fa-chevron-down" size={10}/>
              </button>
              <div className="hdr__dropdown-panel hdr__settings-panel">
                <div className="hdr__user-info" style={{display:'flex',alignItems:'center',gap:12}}>
                  <div className="hdr__user-avatar-inline">
                    {userAvatarUrl ? <img src={userAvatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <span className="hdr__initials hdr__initials--lg">{userInitials}</span>}
                  </div>
                  <div>
                    <p className="hdr__user-display-name">{userName}</p>
                    <p className="hdr__user-info-email" style={{margin:0}}>{currentUserEmail}</p>
                  </div>
                </div>
                <a onClick={() => go('/settings?tab=account')} className="hdr__dropdown-link"><Icon name="fa-user-edit" size={13} className="hdr__dropdown-icon"/> আমার প্রোফাইল</a>
                {P('settings') && <a onClick={() => go('/settings')} className="hdr__dropdown-link" {...prefetch('/settings')}><Icon name="fa-cog" size={13} className="hdr__dropdown-icon"/> সেটিংস</a>}
                <a onClick={handleLogout} className="hdr__dropdown-link hdr__logout-link"><Icon name="fa-sign-out-alt" size={13}/> লগআউট</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      {!isMember && (
        <MobileBottomNav go={go} pathname={location.pathname} P={hasPageAccess} handleLogout={handleLogout}/>
      )}
    </>
  );
};

export default Header;
