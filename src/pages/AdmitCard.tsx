import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/Icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/hooks/useClasses';
import { useStudents } from '@/hooks/useStudents';
import { useExamRoutines, useExamNames } from '@/hooks/useExamRoutines';
import { useInstitutionInfo } from '@/hooks/useInstitutionInfo';
import { toBengaliNumber, MONTHS_BENGALI } from '@/lib/constants';
import { buildSingleAdmitCardHTML, buildBulkAdmitCardHTML } from './admit-card/admitCardPrintHTML';

const EXAM_LINKS = [
  { path: '/exams',               icon: 'fa-edit',           label: 'নম্বর এন্ট্রি',   color: '#d4af37' },
  { path: '/teacher-grade-entry', icon: 'fa-pen-fancy',      label: 'গ্রেড এন্ট্রি',   color: '#3b82f6' },
  { path: '/exam-routine',        icon: 'fa-calendar-alt',   label: 'পরীক্ষার রুটিন',  color: '#10b981' },
  { path: '/admit-card',          icon: 'fa-address-card',   label: 'অ্যাডমিট কার্ড',  color: '#f59e0b' },
  { path: '/marksheet',           icon: 'fa-scroll',         label: 'মার্কশিট',        color: '#8b5cf6' },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    return `${toBengaliNumber(d.getDate())} ${MONTHS_BENGALI[d.getMonth()]} ${toBengaliNumber(d.getFullYear())} (${days[d.getDay()]})`;
  } catch { return dateStr; }
}

const AdmitCard = () => {
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: students = [] } = useStudents();
  const { data: allExamNames = [] } = useExamNames();
  const institution = useInstitutionInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [searchText, setSearchText] = useState('');

  const classId = selectedClassId ?? (classes.length > 0 ? classes[0].class_id : null);
  const selectedClass = classes.find(c => c.class_id === classId);

  const { data: routines = [], isLoading: routinesLoading } = useExamRoutines(classId ?? undefined, selectedExam || undefined);
  const classExamNames = useMemo(() => {
    if (!classId) return [];
    return [...new Set(routines.map(r => r.exam_name))].sort();
  }, [routines, classId]);
  const mergedExamNames = useMemo(() => [...new Set([...allExamNames, ...classExamNames])].sort(), [allExamNames, classExamNames]);
  const { data: examRoutinesForCard = [] } = useExamRoutines(classId ?? undefined, selectedExam || undefined);

  const classStudents = useMemo(() => {
    if (!classId) return [];
    return students
      .filter(s => s.class_id === classId && s.status === 'active')
      .filter(s => !searchText || s.name.includes(searchText) || (s.roll || '').includes(searchText) || s.student_id.includes(searchText))
      .sort((a, b) => (a.roll || '').localeCompare(b.roll || '', 'bn'));
  }, [classId, students, searchText]);

  const sortedRoutines = useMemo(() =>
    [...examRoutinesForCard].sort((a, b) => a.exam_date.localeCompare(b.exam_date) || a.start_time.localeCompare(b.start_time)),
  [examRoutinesForCard]);

  const handlePrintAll = () => {
    if (!selectedClass || !selectedExam || classStudents.length === 0 || sortedRoutines.length === 0) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(buildBulkAdmitCardHTML(classStudents, selectedExam, sortedRoutines, institution));
    printWin.document.close();
  };

  const handlePrintSingle = (student: typeof classStudents[0]) => {
    if (!selectedClass || !selectedExam || sortedRoutines.length === 0) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(buildSingleAdmitCardHTML(student, selectedExam, sortedRoutines, institution));
    printWin.document.close();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header exam-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="fa-address-card" size={22} style={{ color: '#f59e0b' }} />
            অ্যাডমিট কার্ড
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            পরীক্ষার অ্যাডমিট কার্ড জেনারেট ও প্রিন্ট করুন
          </p>
        </div>
        {selectedExam && classStudents.length > 0 && sortedRoutines.length > 0 && (
          <div className="exam-page-actions">
            <button className="erp-btn erp-btn--primary" onClick={handlePrintAll} style={{ width: '100%' }}>
              <Icon name="fa-print" size={14} /> সকলের অ্যাডমিট কার্ড প্রিন্ট
            </button>
          </div>
        )}
      </div>

      {/* পরীক্ষা মডিউল দ্রুত নেভিগেশন */}
      <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(245,158,11,0.6)', marginBottom: 10, letterSpacing: 1 }}>
          ⚡ পরীক্ষা মডিউল — দ্রুত যান
        </div>
        <div className="exam-nav-bar" style={{ marginBottom: 0 }}>
          {EXAM_LINKS.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button key={link.path}
                className={'exam-nav-item' + (isActive ? ' exam-nav-item--active' : '')}
                onClick={() => navigate(link.path)}
                style={isActive ? { borderColor: link.color, color: link.color, background: link.color + '14' } : {}}>
                <i className={'fas ' + link.icon} style={{ fontSize: 18, color: isActive ? link.color : 'rgba(255,255,255,0.45)' }} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Class + Exam Selector */}
      <div className="erp-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            <Icon name="fa-chalkboard" size={14} style={{ marginRight: 6, color: '#d4af37' }} /> ক্লাস:
          </label>
          {classesLoading ? <Skeleton className="h-9 w-48" /> : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {classes.map(c => (
                <button key={c.class_id}
                  onClick={() => { setSelectedClassId(c.class_id); setSelectedExam(''); setSearchText(''); }}
                  className="erp-btn"
                  style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20, background: classId === c.class_id ? 'var(--accent)' : 'var(--bg-secondary)', color: classId === c.class_id ? '#fff' : 'var(--text-primary)', border: classId === c.class_id ? '2px solid var(--accent)' : '2px solid var(--border)', fontWeight: classId === c.class_id ? 700 : 500, transition: 'all 0.2s' }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {classId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <Icon name="fa-file-alt" size={12} style={{ marginRight: 4, color: '#f59e0b' }} /> পরীক্ষা:
            </label>
            {mergedExamNames.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {mergedExamNames.map(name => (
                  <button key={name} onClick={() => setSelectedExam(name)} className="erp-btn"
                    style={{ fontSize: 12, padding: '4px 12px', borderRadius: 16, background: selectedExam === name ? '#f59e0b' : 'var(--bg-secondary)', color: selectedExam === name ? '#000' : 'var(--text-secondary)', border: selectedExam === name ? '1.5px solid #f59e0b' : '1.5px solid var(--border)', fontWeight: selectedExam === name ? 700 : 500 }}>
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>কোনো পরীক্ষার রুটিন পাওয়া যায়নি</span>
            )}
          </div>
        )}
      </div>

      {/* Search */}
      {selectedExam && classStudents.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <Icon name="fa-search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              className="erp-input"
              placeholder="ছাত্র খুঁজুন (নাম, রোল, আইডি)..."
              style={{ width: '100%', paddingLeft: 36, fontSize: 13 }} />
          </div>
        </div>
      )}

      {/* Stats */}
      {selectedExam && sortedRoutines.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { icon: 'fa-users', color: '#d4af37', val: toBengaliNumber(classStudents.length), label: 'পরীক্ষার্থী' },
            { icon: 'fa-book', color: '#3b82f6', val: toBengaliNumber(sortedRoutines.length), label: 'বিষয়' },
            { icon: 'fa-calendar-check', color: '#10b981', val: toBengaliNumber(new Set(sortedRoutines.map(r => r.exam_date)).size), label: 'পরীক্ষার দিন' },
            { icon: 'fa-calculator', color: '#f59e0b', val: toBengaliNumber(sortedRoutines.reduce((s, r) => s + r.full_marks, 0)), label: 'মোট পূর্ণমান' },
          ].map((s, i) => (
            <div key={i} className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule preview */}
      {selectedExam && sortedRoutines.length > 0 && (
        <div className="erp-card" style={{ padding: 12, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="fa-calendar-alt" size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{selectedExam}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— {selectedClass?.name} — পরীক্ষার সময়সূচি</span>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, width: 36 }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>তারিখ</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700 }}>বিষয়</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>সময়</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>নম্বর</th>
                </tr>
              </thead>
              <tbody>
                {sortedRoutines.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDate(r.exam_date)}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.subject_name}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>{r.start_time} — {r.end_time}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ background: '#d4af3718', color: '#d4af37', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>{r.full_marks}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student list */}
      {!classId ? (
        <div className="erp-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Icon name="fa-address-card" size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>ক্লাস ও পরীক্ষা নির্বাচন করুন</p>
        </div>
      ) : !selectedExam ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-file-alt" size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>উপরে থেকে একটি পরীক্ষা নির্বাচন করুন</p>
        </div>
      ) : routinesLoading ? (
        <div className="erp-card" style={{ padding: 20 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" style={{ marginBottom: 8 }} />)}
        </div>
      ) : sortedRoutines.length === 0 ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-calendar" size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>"{selectedExam}" পরীক্ষার কোনো সময়সূচি নেই</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>প্রথমে "পরীক্ষার রুটিন" পেজে সময়সূচি যোগ করুন</p>
        </div>
      ) : classStudents.length === 0 ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-users" size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
            {searchText ? `"${searchText}" এর জন্য কোনো ছাত্র পাওয়া যায়নি` : 'এই ক্লাসে কোনো সক্রিয় ছাত্র নেই'}
          </p>
        </div>
      ) : (
        <div className="erp-card" style={{ padding: 12, overflow: 'hidden' }}>
          {/* Mobile card view */}
          <div className="student-cards">
            {classStudents.map((student, idx) => (
              <div key={student.id} className="erp-student-card">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(245,158,11,0.2)' }}>
                    <Icon name="fa-user" size={18} style={{ color: '#f59e0b' }} />
                  </div>
                )}
                <div className="erp-student-card__info">
                  <div className="erp-student-card__name">{student.name}</div>
                  <div className="erp-student-card__meta">
                    রোল: {student.roll || '—'} &nbsp;|&nbsp; আইডি: {student.student_id}
                    {student.father_name && <>&nbsp;|&nbsp; পিতা: {student.father_name}</>}
                  </div>
                </div>
                <button className="erp-btn erp-btn--ghost" onClick={() => handlePrintSingle(student)}
                  style={{ padding: '8px 12px', fontSize: 13, flexShrink: 0 }}>
                  <Icon name="fa-print" size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="student-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 580 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, width: 40 }}>#</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>ছাত্রের নাম</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>আইডি</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>রোল</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 700 }}>পিতার নাম</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 700, width: 90 }}>প্রিন্ট</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student, idx) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '10px', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {student.photo_url
                          ? <img src={student.photo_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                          : <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon name="fa-user" size={14} style={{ color: '#f59e0b' }} />
                            </div>
                        }
                        {student.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>{student.student_id}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>{student.roll || '—'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{student.father_name || '—'}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button className="erp-btn erp-btn--ghost" onClick={() => handlePrintSingle(student)} style={{ padding: '4px 10px', fontSize: 12 }}>
                        <Icon name="fa-print" size={13} /> প্রিন্ট
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmitCard;
