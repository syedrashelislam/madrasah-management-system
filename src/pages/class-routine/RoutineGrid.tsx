import Icon from '@/components/Icon';
import { ClassRoutineRow, DAYS_BENGALI, DEFAULT_PERIODS } from '@/hooks/useClassRoutines';

interface RoutineGridProps {
  routines: ClassRoutineRow[];
  onEditSlot: (slot: ClassRoutineRow) => void;
  onAddSlot: (day: string, period: number) => void;
  onDeleteSlot: (id: string) => void;
  canWrite: boolean;
}

const SUBJECT_COLORS: Record<string, string> = {
  'বিরতি': '#f59e0b',
  'জুহরের নামাজ': '#10b981',
  'আসরের নামাজ': '#10b981',
};

function getSlotColor(subject: string): string {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  // Generate consistent color from subject name
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 50%)`;
}

export default function RoutineGrid({ routines, onEditSlot, onAddSlot, onDeleteSlot, canWrite }: RoutineGridProps) {
  // Find all unique periods used
  const usedPeriods = DEFAULT_PERIODS.filter(p =>
    routines.some(r => r.period === p.period) || p.period <= 7
  );
  const periods = usedPeriods.length > 0 ? usedPeriods : DEFAULT_PERIODS.slice(0, 7);

  const getSlot = (day: string, period: number): ClassRoutineRow | undefined => {
    return routines.find(r => r.day === day && r.period === period);
  };

  const isBreak = (subject: string) => ['বিরতি', 'জুহরের নামাজ', 'আসরের নামাজ'].includes(subject);

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table className="erp-table" style={{ minWidth: 900, borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 90, position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 2, padding: '10px 8px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)' }}>
              বার / পিরিয়ড
            </th>
            {periods.map(p => (
              <th key={p.period} style={{
                padding: '8px 6px', textAlign: 'center', fontSize: 12, fontWeight: 600,
                color: 'var(--text-secondary)', borderBottom: '2px solid var(--border)', minWidth: 110,
              }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>পিরিয়ড {p.period}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{p.start} - {p.end}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS_BENGALI.map(day => (
            <tr key={day}>
              <td style={{
                position: 'sticky', left: 0, background: 'var(--card-bg)', zIndex: 1,
                padding: '10px 8px', fontWeight: 700, fontSize: 13, color: 'var(--accent)',
                borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
              }}>
                {day}
              </td>
              {periods.map(p => {
                const slot = getSlot(day, p.period);
                if (!slot) {
                  return (
                    <td key={p.period} style={{
                      padding: 4, borderBottom: '1px solid var(--border)',
                      textAlign: 'center', verticalAlign: 'middle',
                    }}>
                      {canWrite && (
                        <button
                          onClick={() => onAddSlot(day, p.period)}
                          style={{
                            width: '100%', height: 52, border: '2px dashed var(--border)',
                            borderRadius: 8, background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="ক্লাস যোগ করুন"
                        >
                          <Icon name="fa-plus" size={14} />
                        </button>
                      )}
                    </td>
                  );
                }

                const color = getSlotColor(slot.subject_name);
                const breakSlot = isBreak(slot.subject_name);

                return (
                  <td key={p.period} style={{ padding: 4, borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                    <div
                      style={{
                        background: breakSlot ? `${color}18` : `${color}14`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 8, padding: '6px 8px', minHeight: 52,
                        cursor: canWrite ? 'pointer' : 'default',
                        position: 'relative', transition: 'box-shadow 0.15s',
                      }}
                      onClick={() => canWrite && onEditSlot(slot)}
                      onMouseEnter={e => canWrite && (e.currentTarget.style.boxShadow = `0 2px 8px ${color}30`)}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {breakSlot ? `🕐 ${slot.subject_name}` : slot.subject_name}
                      </div>
                      {!breakSlot && slot.teacher_name && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Icon name="fa-user-tie" size={10} /> {slot.teacher_name}
                        </div>
                      )}
                      {slot.room && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                          📍 {slot.room}
                        </div>
                      )}
                      {/* Delete button */}
                      {canWrite && (
                        <button
                          onClick={e => { e.stopPropagation(); onDeleteSlot(slot.id); }}
                          style={{
                            position: 'absolute', top: 2, right: 4, background: 'none',
                            border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                            padding: 2, borderRadius: 4, fontSize: 10, opacity: 0.4,
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="মুছুন"
                        >
                          <Icon name="fa-times" size={10} />
                        </button>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
