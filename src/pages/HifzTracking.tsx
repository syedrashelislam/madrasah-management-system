// ============================================================
// HifzTracking.tsx — হিফজ ট্র্যাকিং পেজ
// ফাইলটি src/pages/ ফোল্ডারে রাখুন
// ============================================================

import React, { useState } from 'react';
import Icon from '@/components/Icon';
import {
  useHifzStudents,
  useHifzProgress,
  useHifzSummary,
  useAddHifzStudent,
  useAddHifzProgress,
  useUpdateHifzStudent,
  type HifzSummary,
} from '@/hooks/useHifz';
import { useStudents } from '@/hooks/useStudents';
import { useStaff } from '@/hooks/useStaff';
import { surahNames } from '@/lib/i18n';
import { toast } from 'sonner';

type TabKey = 'overview' | 'students' | 'session' | 'report';

const QUALITY_LABELS = {
  excellent: { label: 'চমৎকার', color: '#22c55e', icon: 'fa-star' },
  good:      { label: 'ভালো',   color: '#3b82f6', icon: 'fa-thumbs-up' },
  average:   { label: 'মাঝারি', color: '#f59e0b', icon: 'fa-minus' },
  needs_work:{ label: 'উন্নতি দরকার', color: '#ef4444', icon: 'fa-exclamation' },
} as const;

const PARA_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ pct, color = '#d4af37' }: { pct: number; color?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, pct)}%`, height: '100%',
          background: pct >= 100 ? '#22c55e' : color,
          borderRadius: 8, transition: 'width 0.5s',
        }}
      />
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="content-box" style={{ textAlign: 'center', padding: '20px 16px' }}>
      <div style={{ fontSize: 28, color, marginBottom: 8 }}>
        <Icon name={icon} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────
function OverviewTab() {
  const { data: summary = [], isLoading } = useHifzSummary();
  const [search, setSearch] = useState('');

  const active = summary.filter(s => s.status === 'active');
  const completed = summary.filter(s => s.status === 'completed');
  const totalPages = summary.reduce((a, s) => a + s.total_pages, 0);

  const filtered = summary.filter(s =>
    !search || s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    s.class_name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
      <Icon name="fa-spinner fa-spin" /> লোড হচ্ছে...
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        <StatCard icon="fa-users" label="মোট হিফজ ছাত্র" value={summary.length} color="#d4af37" />
        <StatCard icon="fa-book-open" label="সক্রিয়" value={active.length} color="#3b82f6" />
        <StatCard icon="fa-check-circle" label="সম্পন্ন" value={completed.length} color="#22c55e" />
        <StatCard icon="fa-file-alt" label="মোট পৃষ্ঠা মুখস্থ" value={totalPages.toLocaleString()} color="#a855f7" />
      </div>

      {/* Student Cards */}
      <div className="content-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', margin: 0 }}>
            <Icon name="fa-list" /> সকল হিফজ ছাত্রদের অগ্রগতি
          </h3>
          <input
            placeholder="ছাত্র বা শ্রেণী খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 13, width: 220,
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
            <Icon name="fa-mosque" style={{ fontSize: 36, marginBottom: 12 }} />
            <p>কোনো হিফজ ছাত্র পাওয়া যায়নি</p>
            <p style={{ fontSize: 12 }}>প্রথমে "হিফজ ছাত্র" ট্যাব থেকে ছাত্র যোগ করুন</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(s => <StudentProgressCard key={s.student_id} summary={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentProgressCard({ summary: s }: { summary: HifzSummary }) {
  const isComplete = s.status === 'completed';
  const color = isComplete ? '#22c55e' : s.completion_pct > 50 ? '#3b82f6' : '#d4af37';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', borderRadius: 12,
      padding: '14px 16px', border: `1px solid ${isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.student_name}</span>
            {isComplete && (
              <span style={{ fontSize: 10, background: '#22c55e', color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                সম্পন্ন ✓
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {s.class_name} {s.teacher_name ? `• শিক্ষক: ${s.teacher_name}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color }}>
            {s.completion_pct}%
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {s.total_pages}/৬০৪ পৃষ্ঠা
          </div>
        </div>
      </div>

      <ProgressBar pct={s.completion_pct} color={color} />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        <span>দৈনিক লক্ষ্য: {s.daily_target} পৃষ্ঠা</span>
        <span>সর্বশেষ সেশন: {s.last_session ? new Date(s.last_session).toLocaleDateString('bn-BD') : 'নেই'}</span>
      </div>
    </div>
  );
}

// ── Students Tab ──────────────────────────────────────────────
function StudentsTab() {
  const { data: hifzStudents = [] } = useHifzStudents();
  const { data: allStudents = [] } = useStudents();
  const { data: staff = [] } = useStaff();
  const addHifzStudent = useAddHifzStudent();
  const updateHifzStudent = useUpdateHifzStudent();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    teacher_id: '',
    daily_target_pages: '1',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Students not yet enrolled in hifz
  const enrolledIds = new Set(hifzStudents.map(h => h.student_id));
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id));

  const handleAdd = async () => {
    if (!form.student_id) return toast.error('ছাত্র নির্বাচন করুন');
    await addHifzStudent.mutateAsync({
      student_id: form.student_id,
      teacher_id: form.teacher_id || undefined,
      daily_target_pages: parseInt(form.daily_target_pages) || 1,
      start_date: form.start_date,
      notes: form.notes || undefined,
    });
    setShowAdd(false);
    setForm({ student_id: '', teacher_id: '', daily_target_pages: '1', start_date: new Date().toISOString().split('T')[0], notes: '' });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: 13, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="content-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', margin: 0 }}>
            <Icon name="fa-user-graduate" /> হিফজ ছাত্রদের তালিকা
          </h3>
          <button className="btn-gold" onClick={() => setShowAdd(true)} style={{ fontSize: 13 }}>
            <Icon name="fa-plus" /> নতুন ছাত্র যোগ
          </button>
        </div>

        {showAdd && (
          <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h4 style={{ color: '#d4af37', marginBottom: 16 }}>নতুন হিফজ ছাত্র নিবন্ধন</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>ছাত্র নির্বাচন *</label>
                <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} style={inputStyle}>
                  <option value="">-- ছাত্র নির্বাচন করুন --</option>
                  {availableStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.class_name} (রোল: {s.roll})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>হিফজ শিক্ষক</label>
                <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })} style={inputStyle}>
                  <option value="">-- শিক্ষক নির্বাচন করুন --</option>
                  {staff.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>দৈনিক লক্ষ্য (পৃষ্ঠা)</label>
                <input type="number" min="1" max="10" value={form.daily_target_pages}
                  onChange={e => setForm({ ...form, daily_target_pages: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>শুরুর তারিখ</label>
                <input type="date" value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>মন্তব্য</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ ...inputStyle, height: 70, resize: 'vertical' }} placeholder="বিশেষ নোট থাকলে লিখুন..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-gold" onClick={handleAdd} disabled={addHifzStudent.isPending} style={{ fontSize: 13 }}>
                {addHifzStudent.isPending ? 'সংরক্ষণ হচ্ছে...' : '✓ সংরক্ষণ করুন'}
              </button>
              <button className="btn-outline-gold" onClick={() => setShowAdd(false)} style={{ fontSize: 13 }}>বাতিল</button>
            </div>
          </div>
        )}

        {hifzStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
            কোনো হিফজ ছাত্র নেই। উপরের বোতাম থেকে যোগ করুন।
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['ছাত্রের নাম', 'শ্রেণী', 'শিক্ষক', 'অগ্রগতি', 'দৈনিক লক্ষ্য', 'অবস্থা'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#d4af37', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hifzStudents.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>{h.student_name}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)' }}>{h.class_name}</td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)' }}>{h.teacher_name ?? '—'}</td>
                    <td style={{ padding: '10px 12px', minWidth: 140 }}>
                      <div style={{ fontSize: 12, color: '#d4af37', marginBottom: 4 }}>
                        {h.total_pages_memorized}/৬০৪ ({Math.round((h.total_pages_memorized / 604) * 100)}%)
                      </div>
                      <ProgressBar pct={Math.round((h.total_pages_memorized / 604) * 100)} />
                    </td>
                    <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.6)' }}>{h.daily_target_pages} পৃষ্ঠা</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 20,
                        background: h.status === 'completed' ? 'rgba(34,197,94,0.2)' : h.status === 'paused' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                        color: h.status === 'completed' ? '#22c55e' : h.status === 'paused' ? '#ef4444' : '#3b82f6',
                      }}>
                        {h.status === 'completed' ? 'সম্পন্ন' : h.status === 'paused' ? 'বিরতি' : 'সক্রিয়'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Session Entry Tab ─────────────────────────────────────────
function SessionTab() {
  const { data: hifzStudents = [] } = useHifzStudents();
  const { data: staff = [] } = useStaff();
  const addProgress = useAddHifzProgress();

  const [selectedHifzId, setSelectedHifzId] = useState('');
  const [form, setForm] = useState({
    session_type: 'memorization' as 'memorization' | 'revision',
    surah_number: '',
    para_number: '',
    start_page: '',
    end_page: '',
    quality: 'good' as 'excellent' | 'good' | 'average' | 'needs_work',
    test_date: new Date().toISOString().split('T')[0],
    teacher_id: '',
    notes: '',
  });

  const selectedStudent = hifzStudents.find(h => h.id === selectedHifzId);
  const { data: progressList = [] } = useHifzProgress(selectedHifzId || undefined);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: 13, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' };

  const handleSubmit = async () => {
    if (!selectedHifzId) return toast.error('ছাত্র নির্বাচন করুন');
    if (!form.start_page || !form.end_page) return toast.error('পৃষ্ঠা নম্বর দিন');
    const sp = parseInt(form.start_page), ep = parseInt(form.end_page);
    if (sp > ep) return toast.error('শুরুর পৃষ্ঠা শেষ পৃষ্ঠার চেয়ে বড় হতে পারে না');
    if (sp < 1 || ep > 604) return toast.error('পৃষ্ঠা নম্বর ১-৬০৪ এর মধ্যে হতে হবে');

    const surah = surahNames.find(s => s.number === parseInt(form.surah_number));
    await addProgress.mutateAsync({
      hifz_student_id: selectedHifzId,
      student_id: selectedStudent!.student_id,
      surah_number: form.surah_number ? parseInt(form.surah_number) : undefined,
      surah_name: surah ? surah.bn : undefined,
      para_number: form.para_number ? parseInt(form.para_number) : undefined,
      start_page: sp, end_page: ep,
      session_type: form.session_type,
      quality: form.quality,
      test_date: form.test_date,
      teacher_id: form.teacher_id || undefined,
      notes: form.notes || undefined,
    });
    setForm(f => ({ ...f, start_page: '', end_page: '', notes: '', surah_number: '', para_number: '' }));
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="content-box">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
          <Icon name="fa-plus-circle" /> নতুন হিফজ সেশন এন্ট্রি
        </h3>

        <div style={{ display: 'grid', gap: 12 }}>
          {/* Student & Session Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>ছাত্র নির্বাচন *</label>
              <select value={selectedHifzId} onChange={e => setSelectedHifzId(e.target.value)} style={inputStyle}>
                <option value="">-- ছাত্র নির্বাচন করুন --</option>
                {hifzStudents.filter(h => h.status === 'active').map(h => (
                  <option key={h.id} value={h.id}>
                    {h.student_name} — {h.class_name} ({h.total_pages_memorized}/৬০৪ পৃষ্ঠা)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>সেশনের ধরন *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['memorization', 'revision'] as const).map(t => (
                  <button key={t}
                    onClick={() => setForm(f => ({ ...f, session_type: t }))}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid',
                      fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                      borderColor: form.session_type === t ? '#d4af37' : 'rgba(255,255,255,0.15)',
                      background: form.session_type === t ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                      color: form.session_type === t ? '#d4af37' : 'rgba(255,255,255,0.6)',
                    }}>
                    {t === 'memorization' ? '📖 মুখস্থ' : '🔄 পুনরাবৃত্তি'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Surah & Para */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>সূরা</label>
              <select value={form.surah_number} onChange={e => setForm(f => ({ ...f, surah_number: e.target.value }))} style={inputStyle}>
                <option value="">-- সূরা --</option>
                {surahNames.map(s => (
                  <option key={s.number} value={s.number}>{s.number}. {s.bn}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>পারা</label>
              <select value={form.para_number} onChange={e => setForm(f => ({ ...f, para_number: e.target.value }))} style={inputStyle}>
                <option value="">-- পারা --</option>
                {PARA_NUMBERS.map(p => (
                  <option key={p} value={p}>{p} নম্বর পারা</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>শুরুর পৃষ্ঠা *</label>
              <input type="number" min="1" max="604" placeholder="১" value={form.start_page}
                onChange={e => setForm(f => ({ ...f, start_page: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>শেষ পৃষ্ঠা *</label>
              <input type="number" min="1" max="604" placeholder="৬০৪" value={form.end_page}
                onChange={e => setForm(f => ({ ...f, end_page: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {form.start_page && form.end_page && parseInt(form.end_page) >= parseInt(form.start_page) && (
            <div style={{ background: 'rgba(212,175,55,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#d4af37' }}>
              📄 মোট পৃষ্ঠা: <strong>{parseInt(form.end_page) - parseInt(form.start_page) + 1}</strong>
            </div>
          )}

          {/* Quality, Date, Teacher */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>মান *</label>
              <select value={form.quality} onChange={e => setForm(f => ({ ...f, quality: e.target.value as any }))} style={inputStyle}>
                {Object.entries(QUALITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>পরীক্ষার তারিখ *</label>
              <input type="date" value={form.test_date}
                onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>শিক্ষক</label>
              <select value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))} style={inputStyle}>
                <option value="">-- শিক্ষক --</option>
                {staff.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>মন্তব্য</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              style={{ ...inputStyle, height: 60, resize: 'vertical' }} placeholder="শিক্ষকের মন্তব্য..." />
          </div>

          <button className="btn-gold" onClick={handleSubmit} disabled={addProgress.isPending} style={{ fontSize: 14, padding: '10px 24px' }}>
            {addProgress.isPending ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সেশন সংরক্ষণ করুন</>}
          </button>
        </div>
      </div>

      {/* Recent Sessions */}
      {selectedHifzId && progressList.length > 0 && (
        <div className="content-box">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#d4af37', marginBottom: 12 }}>
            <Icon name="fa-history" /> সাম্প্রতিক সেশন ({selectedStudent?.student_name})
          </h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {progressList.slice(0, 5).map(p => {
              const q = QUALITY_LABELS[p.quality];
              return (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                      {p.surah_name ? `${p.surah_name} — ` : ''}পৃষ্ঠা {p.start_page}–{p.end_page}
                    </span>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {p.session_type === 'memorization' ? '📖 মুখস্থ' : '🔄 পুনরাবৃত্তি'} • {p.pages_count} পৃষ্ঠা
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 12, color: q.color, fontWeight: 600 }}>{q.label}</span>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      {new Date(p.test_date).toLocaleDateString('bn-BD')}
                    </div>
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

// ── Report Tab ────────────────────────────────────────────────
function ReportTab() {
  const { data: summary = [] } = useHifzSummary();
  const currentDate = new Date();
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
  const [year, setYear] = useState(String(currentDate.getFullYear()));
  const { data: monthlyData = [] } = useHifzSummary();

  const completedCount = summary.filter(s => s.status === 'completed').length;
  const avgPct = summary.length > 0
    ? Math.round(summary.reduce((a, s) => a + s.completion_pct, 0) / summary.length)
    : 0;
  const topStudents = [...summary].sort((a, b) => b.total_pages - a.total_pages).slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <StatCard icon="fa-percentage" label="গড় সম্পন্নতা" value={`${avgPct}%`} color="#d4af37" />
        <StatCard icon="fa-trophy" label="হিফজ সম্পন্ন" value={completedCount} color="#22c55e" />
        <StatCard icon="fa-book" label="মোট ছাত্র" value={summary.length} color="#3b82f6" />
        <StatCard icon="fa-star" label="মোট পৃষ্ঠা মুখস্থ" value={summary.reduce((a,s)=>a+s.total_pages,0)} color="#a855f7" />
      </div>

      {/* Top Students */}
      <div className="content-box">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
          <Icon name="fa-trophy" /> শীর্ষ হিফজ ছাত্র
        </h3>
        {topStudents.map((s, i) => (
          <div key={s.student_id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
              background: i === 0 ? '#d4af37' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : 'rgba(255,255,255,0.1)',
              color: i < 3 ? '#000' : '#fff',
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{s.student_name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.class_name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#d4af37' }}>{s.total_pages} পৃষ্ঠা</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.completion_pct}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Print Button */}
      <div style={{ textAlign: 'right' }}>
        <button className="btn-outline-gold" onClick={() => window.print()} style={{ fontSize: 13 }}>
          <Icon name="fa-print" /> প্রিন্ট করুন
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function HifzTracking() {
  const [tab, setTab] = useState<TabKey>('overview');

  const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
    { key: 'overview', label: 'সামগ্রিক অবস্থা', icon: 'fa-chart-bar' },
    { key: 'students', label: 'হিফজ ছাত্র', icon: 'fa-user-graduate' },
    { key: 'session', label: 'সেশন এন্ট্রি', icon: 'fa-plus-circle' },
    { key: 'report', label: 'রিপোর্ট', icon: 'fa-file-alt' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}>
          <Icon name="fa-mosque" style={{ marginLeft: 8 }} /> হিফজ ট্র্যাকিং
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>
          কুরআন মুখস্থ অগ্রগতি পর্যবেক্ষণ ও ব্যবস্থাপনা
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={tab === t.key ? 'btn-gold' : 'btn-outline-gold'}
            onClick={() => setTab(t.key)}
          >
            <Icon name={t.icon} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'students' && <StudentsTab />}
      {tab === 'session' && <SessionTab />}
      {tab === 'report' && <ReportTab />}
    </div>
  );
}
