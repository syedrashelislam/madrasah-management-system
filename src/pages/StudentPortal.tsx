import { useStudentAuth } from '@/hooks/useStudentAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePublicSettings } from '@/hooks/useSettings';
import { useClassRoutines, DAYS_BENGALI, DEFAULT_PERIODS } from '@/hooks/useClassRoutines';
import { useExamRoutines } from '@/hooks/useExamRoutines';
import Icon from '@/components/Icon';
import { formatTaka, toBengaliNumber, MONTHS_BENGALI } from '@/lib/constants';

interface AttendanceRow { id: string; date: string; status: string }
interface PaymentRow { id: string; amount: number; month: string; date: string; method?: string }
interface ExamRow { id: string; name: string }
interface ExamSubjectRow { id: string; exam_id: string; exam_subject_id?: string; subject_name: string; full_marks: number; pass_marks: number }
interface MarkEntryRow { id: string; exam_id: string; exam_subject_id: string; obtained_marks: number }
interface NoticeRow { id: string; title: string; body: string; date: string; target: string }

type TabKey = 'home' | 'academic' | 'results' | 'fees' | 'notices';

/* ══════════════════════════════════════════
   PORTAL HEADER
══════════════════════════════════════════ */
function PortalHeader({
  madrasaName, madrasaSubtitle, logoUrl, studentName, onLogout,
}: {
  madrasaName: string; madrasaSubtitle: string; logoUrl: string; studentName: string; onLogout: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: scrolled ? 'rgba(10,16,36,0.97)' : 'linear-gradient(135deg,rgba(10,14,30,0.98) 0%,rgba(20,28,56,0.98) 100%)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(212,175,55,0.15)',
      boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.5)' : 'none',
      transition: 'background 0.3s,box-shadow 0.3s',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', height: 62, padding: '0 16px', gap: 12 }}>
        {/* Logo + Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))',
            border: '1.5px solid rgba(212,175,55,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#d4af37', fontSize: 20, fontWeight: 800 }}>م</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {madrasaName}
            </div>
            {madrasaSubtitle && (
              <div style={{ fontSize: 10, color: 'rgba(212,175,55,0.75)', fontWeight: 600, letterSpacing: '0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {madrasaSubtitle}
              </div>
            )}
          </div>
        </div>

        {/* Badge */}
        <div style={{
          padding: '4px 12px', borderRadius: 20, flexShrink: 0,
          background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)',
          fontSize: 11, fontWeight: 700, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Icon name="fa-user-graduate" size={10} /> ছাত্র পোর্টাল
        </div>

        {/* User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {studentName}
          </span>
          <button
            onClick={onLogout}
            style={{
              padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
              background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)',
              color: '#fca5a5', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Icon name="fa-sign-out-alt" size={12} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ══════════════════════════════════════════
   BOTTOM TAB BAR
══════════════════════════════════════════ */
function BottomTabBar({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; icon: string; label: string; color: string }[] = [
    { key: 'home',     icon: 'fa-home',            label: 'হোম',      color: '#60a5fa' },
    { key: 'academic', icon: 'fa-chalkboard-teacher', label: 'ক্লাস', color: '#34d399' },
    { key: 'results',  icon: 'fa-trophy',           label: 'ফলাফল',   color: '#f59e0b' },
    { key: 'fees',     icon: 'fa-coins',             label: 'ফি',       color: '#a855f7' },
    { key: 'notices',  icon: 'fa-bullhorn',          label: 'নোটিশ',   color: '#f87171' },
  ];
  return (
    <>
      <div style={{ height: 72 }} />
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'rgba(10,14,30,0.97)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(212,175,55,0.12)',
        display: 'flex', height: 66, paddingBottom: 'env(safe-area-inset-bottom,0px)',
      }}>
        {tabs.map(t => {
          const isActive = active === t.key;
          return (
            <button key={t.key} onClick={() => onChange(t.key)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4, border: 'none', cursor: 'pointer',
              background: 'transparent', padding: '8px 0', position: 'relative',
            }}>
              {isActive && <span style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, borderRadius: '0 0 3px 3px', background: t.color }} />}
              <span style={{ width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? `${t.color}22` : 'transparent', transition: 'background 0.2s' }}>
                <Icon name={t.icon} size={18} style={{ color: isActive ? t.color : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }} />
              </span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? t.color : 'rgba(255,255,255,0.35)', transition: 'color 0.2s' }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ══════════════════════════════════════════
   HOME TAB — greeting + attendance summary
══════════════════════════════════════════ */
function HomeTab({ s, attendance, madrasaName, logoUrl }: {
  s: ReturnType<typeof useStudentAuth>['studentUser'];
  attendance: AttendanceRow[];
  madrasaName: string;
  logoUrl: string;
}) {
  if (!s) return null;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount  = attendance.filter(a => a.status === 'absent').length;
  const lateCount    = attendance.filter(a => a.status === 'late').length;
  const totalDays    = attendance.length;
  const rate         = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
  const rateColor    = rate >= 75 ? '#34d399' : rate >= 50 ? '#fbbf24' : '#f87171';

  const BENGALI_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'সুপ্রভাত' : hour < 17 ? 'শুভ অপরাহ্ন' : 'শুভ সন্ধ্যা';
  const todayDay = BENGALI_DAYS[now.getDay()];

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        borderRadius: 20, padding: '24px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg,rgba(37,99,235,0.18) 0%,rgba(29,78,216,0.08) 100%)',
        border: '1px solid rgba(96,165,250,0.2)',
      }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(96,165,250,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{greeting} • {todayDay}</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            স্বাগতম, {s.name.split(' ')[0]}! 👋
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            {s.class_name} {s.section ? `(${s.section})` : ''} • রোল: {s.roll || '—'} • আইডি: {s.student_id}
          </p>
        </div>
      </div>

      {/* Profile mini card */}
      <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 18px', marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, overflow: 'hidden', background: 'rgba(96,165,250,0.15)', border: '2px solid rgba(96,165,250,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {s.photo_url
            ? <img src={s.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Icon name="fa-user-graduate" size={26} style={{ color: '#60a5fa' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{s.name}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {s.class_name && <Chip label={s.class_name} color="#60a5fa" />}
            {s.roll && <Chip label={`রোল ${s.roll}`} color="#d4af37" />}
            {s.section && <Chip label={`সেকশন ${s.section}`} color="#a855f7" />}
          </div>
        </div>
      </div>

      {/* Attendance quick stats */}
      <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="fa-calendar-check" size={14} style={{ color: '#34d399' }} /> হাজিরা সারসংক্ষেপ
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'উপস্থিত',   value: presentCount, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
            { label: 'অনুপস্থিত', value: absentCount,  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
            { label: 'বিলম্ব',    value: lateCount,    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
            { label: 'হার %',     value: rate,         color: rateColor, bg: `${rateColor}22`, suffix: '%' },
          ].map(st => (
            <div key={st.label} style={{ textAlign: 'center', padding: '12px 4px', borderRadius: 12, background: st.bg, border: `1px solid ${st.color}22` }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: st.color, lineHeight: 1 }}>{toBengaliNumber(st.value)}{(st as any).suffix || ''}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{st.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6, width: `${rate}%`, transition: 'width 0.6s ease',
            background: rate >= 75 ? 'linear-gradient(90deg,#34d399,#10b981)' : rate >= 50 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#f87171,#ef4444)',
          }} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ACADEMIC TAB — class routine + exam routine
══════════════════════════════════════════ */
function AcademicTab({ s, classRoutines, examRoutines }: {
  s: ReturnType<typeof useStudentAuth>['studentUser'];
  classRoutines: ReturnType<typeof useClassRoutines>['data'];
  examRoutines: ReturnType<typeof useExamRoutines>['data'];
}) {
  if (!s) return null;
  const now = new Date();
  const todayRoutineDays = DAYS_BENGALI as readonly string[];
  const dayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };
  const todayRoutineIndex = dayMap[now.getDay()];
  const todayRoutineDay = todayRoutineIndex !== undefined ? todayRoutineDays[todayRoutineIndex] : null;
  const todayClasses = todayRoutineDay
    ? (classRoutines || []).filter((r: any) => r.day === todayRoutineDay).sort((a: any, b: any) => a.period - b.period)
    : [];

  const todayStr = now.toISOString().slice(0, 10);
  const upcomingExams = (examRoutines || [])
    .filter((r: any) => r.exam_date >= todayStr)
    .sort((a: any, b: any) => a.exam_date.localeCompare(b.exam_date));

  const fmtExamDate = (ds: string) => {
    try {
      const d = new Date(ds + 'T00:00:00');
      const dayNames = ['রবি', 'সোম', 'মঙ্গ', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
      return `${toBengaliNumber(d.getDate())} ${MONTHS_BENGALI[d.getMonth()]} (${dayNames[d.getDay()]})`;
    } catch { return ds; }
  };

  const BENGALI_DAYS_FULL = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  return (
    <div>
      {/* Today's Classes */}
      <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="fa-chalkboard-teacher" size={14} style={{ color: '#34d399' }} /> আজকের ক্লাস
          </div>
          {todayRoutineDay && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 10 }}>
              {BENGALI_DAYS_FULL[now.getDay()]}
            </span>
          )}
        </div>
        {todayClasses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayClasses.map((slot: any, idx: number) => {
              const periodInfo = DEFAULT_PERIODS.find((p: any) => p.period === slot.period);
              const timeLabel = periodInfo ? `${(periodInfo as any).start} - ${(periodInfo as any).end}` : `পিরিয়ড ${toBengaliNumber(slot.period)}`;
              return (
                <div key={slot.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: idx % 2 === 0 ? 'rgba(52,211,153,0.05)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(52,211,153,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#34d399',
                  }}>
                    {toBengaliNumber(slot.period)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{slot.subject_name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                      {slot.teacher_name && <><Icon name="fa-user" size={10} /> {slot.teacher_name}</>}
                      {slot.room && <>{slot.teacher_name ? ' • ' : ''}<Icon name="fa-door-open" size={10} /> {slot.room}</>}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{timeLabel}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.25)' }}>
            <Icon name="fa-coffee" size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: 13 }}>আজকের জন্য কোনো ক্লাস নির্ধারিত নেই</p>
          </div>
        )}
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="fa-calendar-alt" size={14} style={{ color: '#f59e0b' }} /> আসন্ন পরীক্ষা
            <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 9px', borderRadius: 10, marginLeft: 4 }}>
              {toBengaliNumber(upcomingExams.length)} টি
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcomingExams.slice(0, 8).map((r: any) => {
              const examToday = r.exam_date === todayStr;
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: examToday ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                  border: examToday ? '1.5px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    minWidth: 46, height: 46, borderRadius: 11, flexShrink: 0,
                    background: examToday ? '#f59e0b' : 'rgba(245,158,11,0.12)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: examToday ? '#000' : '#f59e0b',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>
                      {toBengaliNumber(new Date(r.exam_date + 'T00:00:00').getDate())}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 600 }}>
                      {MONTHS_BENGALI[new Date(r.exam_date + 'T00:00:00').getMonth()]?.slice(0, 3)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{r.subject_name}</p>
                      {examToday && <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '1px 8px', borderRadius: 8 }}>আজ</span>}
                    </div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                      {fmtExamDate(r.exam_date)} • {r.start_time} — {r.end_time}
                    </p>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>
                    {toBengaliNumber(r.full_marks)} নম্বর
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   RESULTS TAB
══════════════════════════════════════════ */
function ResultsTab({ markEntries, exams, examSubjects }: {
  markEntries: MarkEntryRow[];
  exams: ExamRow[];
  examSubjects: ExamSubjectRow[];
}) {
  const examMap = new Map(exams.map(e => [e.id, e.name]));
  const subjectMap = new Map(examSubjects.map(es => [es.id, es]));
  const marksByExam = markEntries.reduce<Record<string, MarkEntryRow[]>>((acc, m) => {
    (acc[m.exam_id] = acc[m.exam_id] || []).push(m);
    return acc;
  }, {});

  if (Object.keys(marksByExam).length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
        <Icon name="fa-trophy" size={40} style={{ display: 'block', margin: '0 auto 14px', opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>কোনো পরীক্ষার ফলাফল নেই</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {Object.entries(marksByExam).map(([examId, marks]) => {
        const examName = examMap.get(examId) || 'পরীক্ষা';
        const totalObtained = marks.reduce((s, m) => s + Number(m.obtained_marks), 0);
        const totalFull = marks.reduce((s, m) => {
          const sub = subjectMap.get(m.exam_subject_id);
          return s + (sub ? Number(sub.full_marks) : 0);
        }, 0);
        const pct = totalFull > 0 ? Math.round((totalObtained / totalFull) * 100) : 0;
        const pctColor = pct >= 80 ? '#34d399' : pct >= 60 ? '#60a5fa' : pct >= 40 ? '#fbbf24' : '#f87171';

        return (
          <div key={examId} style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{examName}</h4>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: pctColor }}>{toBengaliNumber(totalObtained)}/{toBengaliNumber(totalFull)}</div>
                <div style={{ fontSize: 11, color: pctColor, opacity: 0.8 }}>{toBengaliNumber(pct)}%</div>
              </div>
            </div>
            {/* Score bar */}
            <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 4, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 6 }}>
              {marks.map(m => {
                const sub = subjectMap.get(m.exam_subject_id);
                const subPct = sub ? Math.round((m.obtained_marks / sub.full_marks) * 100) : 0;
                const subColor = subPct >= 80 ? '#34d399' : subPct >= 60 ? '#60a5fa' : subPct >= 40 ? '#fbbf24' : '#f87171';
                return (
                  <div key={m.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: 13, padding: '8px 10px', borderRadius: 9,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.65)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
                      {sub?.subject_name || '—'}
                    </span>
                    <span style={{ fontWeight: 700, color: subColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {toBengaliNumber(m.obtained_marks)}/{toBengaliNumber(sub?.full_marks ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   FEES TAB
══════════════════════════════════════════ */
function FeesTab({ s, payments }: {
  s: ReturnType<typeof useStudentAuth>['studentUser'];
  payments: PaymentRow[];
}) {
  if (!s) return null;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const sortedPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date));
  const monthlyFee = Number(s.monthly_fee) || 0;

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${toBengaliNumber(dt.getDate())} ${MONTHS_BENGALI[dt.getMonth()]} ${toBengaliNumber(dt.getFullYear())}`;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'মোট পরিশোধ', value: formatTaka(totalPaid), color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: 'fa-check-circle' },
          { label: 'মাসিক ফি',   value: formatTaka(monthlyFee), color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: 'fa-coins' },
        ].map(st => (
          <div key={st.label} style={{ textAlign: 'center', padding: '18px 8px', borderRadius: 16, background: st.bg, border: `1px solid ${st.color}22` }}>
            <Icon name={st.icon} size={22} style={{ color: st.color, marginBottom: 8, display: 'block' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: st.color, lineHeight: 1.2 }}>{st.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
          পেমেন্ট ইতিহাস ({toBengaliNumber(payments.length)} টি)
        </div>
        {sortedPayments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedPayments.slice(0, 12).map(p => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 14px', borderRadius: 12,
                background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.1)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.month}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{formatDate(p.date)}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>{formatTaka(p.amount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.25)' }}>
            <p style={{ fontSize: 14 }}>কোনো পেমেন্ট পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   NOTICES TAB
══════════════════════════════════════════ */
function NoticesTab({ notices }: { notices: NoticeRow[] }) {
  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${toBengaliNumber(dt.getDate())} ${MONTHS_BENGALI[dt.getMonth()]} ${toBengaliNumber(dt.getFullYear())}`;
  };

  if (notices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
        <Icon name="fa-bullhorn" size={40} style={{ display: 'block', margin: '0 auto 14px', opacity: 0.3 }} />
        <p style={{ fontSize: 14 }}>কোনো নোটিশ নেই</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notices.map(n => (
        <div key={n.id} style={{
          padding: '14px 16px', borderRadius: 14,
          background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: n.body ? 8 : 0 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>{n.title}</h4>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatDate(n.date)}</span>
          </div>
          {n.body && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{n.body}</p>}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   SHARED
══════════════════════════════════════════ */
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${color}20`, color, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

function Spinner({ color = '#60a5fa' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${color}25`, borderTopColor: color, animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function StudentPortal() {
  const { studentUser, isLoading, isAuthenticated, logoutStudent } = useStudentAuth();
  const navigate = useNavigate();
  const { data: settings = [] } = usePublicSettings();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubjectRow[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntryRow[]>([]);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const madrasaName     = settings.find(s => s.key === 'madrasa_name')?.value     || 'মাদরাসা ইআরপি';
  const madrasaSubtitle = settings.find(s => s.key === 'madrasa_subtitle')?.value || '';
  const logoUrl         = settings.find(s => s.key === 'madrasa_logo_url')?.value || '';

  const { data: classRoutines = [] } = useClassRoutines(studentUser?.class_id);
  const { data: examRoutines  = [] } = useExamRoutines(studentUser?.class_id);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/student-login', { replace: true });
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!studentUser) return;
    const sid = studentUser.student_id;
    setDataLoading(true);
    Promise.all([
      supabase.from('attendance').select('*').eq('student_id', sid),
      supabase.from('payments').select('*').eq('student_id', sid).is('deleted_at', null),
      supabase.from('mark_entries').select('*').eq('student_id', sid),
      supabase.from('exams').select('*').is('deleted_at', null),
      supabase.from('exam_subjects').select('*'),
      supabase.from('notices').select('*').is('deleted_at', null)
        .or('target.eq.all,target.eq.students').order('date', { ascending: false }).limit(10),
    ]).then(([attRes, payRes, markRes, examRes, subRes, noticeRes]) => {
      setAttendance((attRes.data || []) as AttendanceRow[]);
      setPayments((payRes.data || []) as PaymentRow[]);
      setMarkEntries((markRes.data || []) as MarkEntryRow[]);
      setExams((examRes.data || []) as ExamRow[]);
      setExamSubjects((subRes.data || []) as ExamSubjectRow[]);
      setNotices((noticeRes.data || []) as NoticeRow[]);
      setDataLoading(false);
    });
  }, [studentUser]);

  if (isLoading) return <Spinner />;
  if (!studentUser) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--th-body-bg)' }}>
      <PortalHeader
        madrasaName={madrasaName}
        madrasaSubtitle={madrasaSubtitle}
        logoUrl={logoUrl}
        studentName={studentUser.name}
        onLogout={logoutStudent}
      />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '20px 14px 16px' }}>
        {activeTab === 'home' && (
          <HomeTab s={studentUser} attendance={attendance} madrasaName={madrasaName} logoUrl={logoUrl} />
        )}
        {activeTab === 'academic' && (
          <AcademicTab s={studentUser} classRoutines={classRoutines} examRoutines={examRoutines} />
        )}
        {activeTab === 'results' && (
          dataLoading ? <Spinner /> : <ResultsTab markEntries={markEntries} exams={exams} examSubjects={examSubjects} />
        )}
        {activeTab === 'fees' && (
          dataLoading ? <Spinner /> : <FeesTab s={studentUser} payments={payments} />
        )}
        {activeTab === 'notices' && (
          dataLoading ? <Spinner /> : <NoticesTab notices={notices} />
        )}
      </main>

      <BottomTabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
