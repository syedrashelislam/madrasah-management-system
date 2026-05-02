import Icon from '@/components/Icon';
import { ExamRoutineRow } from '@/hooks/useExamRoutines';

interface ExamRoutineTableProps {
  routines: ExamRoutineRow[];
  onEdit: (row: ExamRoutineRow) => void;
  onDelete: (id: string) => void;
  canWrite: boolean;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} (${days[d.getDay()]})`;
  } catch {
    return dateStr;
  }
}

function getSubjectColor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 50%)`;
}

function isPast(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + 'T00:00:00') < today;
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date().toISOString().slice(0, 10) === dateStr;
}

export default function ExamRoutineTable({ routines, onEdit, onDelete, canWrite }: ExamRoutineTableProps) {
  // Group by date
  const grouped: Record<string, ExamRoutineRow[]> = {};
  routines.forEach(r => {
    if (!grouped[r.exam_date]) grouped[r.exam_date] = [];
    grouped[r.exam_date].push(r);
  });
  const sortedDates = Object.keys(grouped).sort();

  // ── Mobile card view ──
  const MobileCards = () => (
    <div className="exam-routine-cards">
      {sortedDates.map((date, dateIdx) => {
        const items = grouped[date];
        const past = isPast(date);
        const today = isToday(date);
        return (
          <div key={date}>
            {/* Date header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 4px', marginBottom: 6,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: today ? '#d4af3730' : past ? 'rgba(255,255,255,0.05)' : '#3b82f615',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: today ? '#d4af37' : past ? 'var(--text-muted)' : '#3b82f6',
                flexShrink: 0,
              }}>{dateIdx + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: today ? '#d4af37' : 'var(--text-primary)' }}>
                {today && (
                  <span style={{ background: '#d4af37', color: '#000', fontSize: 9, padding: '1px 6px', borderRadius: 8, marginRight: 6, fontWeight: 700 }}>আজ</span>
                )}
                {formatDate(date)}
              </div>
            </div>

            {items.map((row) => {
              const color = getSubjectColor(row.subject_name);
              return (
                <div
                  key={row.id}
                  className={'erp-routine-card' + (today ? ' erp-routine-card--today' : '') + (past && !today ? ' erp-routine-card--past' : '')}
                  style={{ marginBottom: 8, marginLeft: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 4, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.subject_name}
                        </div>
                        {row.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{row.note}</div>}
                        <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span><Icon name="fa-clock" size={11} /> {row.start_time} — {row.end_time}</span>
                          <span style={{ background: '#d4af3718', color: '#d4af37', padding: '1px 8px', borderRadius: 8, fontWeight: 700 }}>
                            {row.full_marks} নম্বর
                          </span>
                          {row.room && <span><Icon name="fa-door-open" size={11} /> রুম: {row.room}</span>}
                        </div>
                      </div>
                    </div>
                    {canWrite && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => onEdit(row)}
                          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#3b82f6' }}
                          title="সম্পাদনা"
                        >
                          <Icon name="fa-edit" size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(row.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#ef4444' }}
                          title="মুছুন"
                        >
                          <Icon name="fa-trash" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  // ── Desktop table view ──
  const DesktopTable = () => (
    <div className="exam-routine-table-wrap" style={{ overflowX: 'auto' }}>
      <table className="erp-table" style={{ minWidth: 700, borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: 'left', width: 50 }}>#</th>
            <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>তারিখ</th>
            <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>বিষয়</th>
            <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: 'center' }}>সময়</th>
            <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: 'center' }}>পূর্ণমান</th>
            <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: 'center' }}>রুম</th>
            {canWrite && (
              <th style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, borderBottom: '2px solid var(--border)', textAlign: 'center', width: 80 }}>অ্যাকশন</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedDates.map(date => {
            const items = grouped[date];
            const past = isPast(date);
            const today = isToday(date);
            return items.map((row, idx) => {
              const color = getSubjectColor(row.subject_name);
              return (
                <tr
                  key={row.id}
                  style={{
                    opacity: past && !today ? 0.55 : 1,
                    background: today ? 'var(--accent-light, #d4af3710)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!today) e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.04))'; }}
                  onMouseLeave={e => { if (!today) e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                    {idx === 0 && (
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: today ? '#d4af3730' : past ? 'var(--bg-secondary)' : '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: today ? '#d4af37' : past ? 'var(--text-muted)' : '#3b82f6' }}>
                        {sortedDates.indexOf(date) + 1}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {idx === 0 ? (
                      <div style={{ fontWeight: 700, fontSize: 13, color: today ? '#d4af37' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {today && <span style={{ background: '#d4af37', color: '#000', fontSize: 10, padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>আজ</span>}
                        {formatDate(date)}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>↳</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{row.subject_name}</div>
                        {row.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{row.note}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.start_time}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>—</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{row.end_time}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                    <span style={{ background: '#d4af3718', color: '#d4af37', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>
                      {row.full_marks}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {row.room || '—'}
                  </td>
                  {canWrite && (
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => onEdit(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 4 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')} title="সম্পাদনা">
                          <Icon name="fa-edit" size={14} />
                        </button>
                        <button onClick={() => onDelete(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 4 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')} title="মুছুন">
                          <Icon name="fa-trash" size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <MobileCards />
      <DesktopTable />
    </>
  );
}
