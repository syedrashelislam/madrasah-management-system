import Icon from '@/components/Icon';
import type { SyllabusRow } from '@/hooks/useSyllabus';

interface Props {
  items: SyllabusRow[];
  onEdit: (row: SyllabusRow) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (row: SyllabusRow) => void;
  canWrite: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'অপেক্ষমান', color: '#f59e0b', bg: '#f59e0b18', icon: 'fa-clock' },
  in_progress: { label: 'চলমান', color: '#3b82f6', bg: '#3b82f618', icon: 'fa-spinner' },
  completed: { label: 'সম্পন্ন', color: '#10b981', bg: '#10b98118', icon: 'fa-check-circle' },
};

const NEXT_STATUS: Record<string, SyllabusRow['status']> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

const SyllabusTable = ({ items, onEdit, onDelete, onToggleStatus, canWrite }: Props) => {
  if (items.length === 0) return null;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', width: 60 }}>ক্রম</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>অধ্যায়ের শিরোনাম</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)', minWidth: 200 }}>টপিকসমূহ</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', width: 120 }}>স্ট্যাটাস</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)', minWidth: 120 }}>নোট</th>
            {canWrite && (
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)', width: 100 }}>কার্যক্রম</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const st = STATUS_MAP[row.status] || STATUS_MAP.pending;
            const topicsList = row.topics ? row.topics.split('\n').filter(Boolean) : [];

            return (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                  {row.chapter_no}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {row.chapter_title}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {topicsList.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
                      {topicsList.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  <button
                    onClick={() => canWrite && onToggleStatus(row)}
                    disabled={!canWrite}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                      background: st.bg, color: st.color,
                      border: `1px solid ${st.color}30`,
                      cursor: canWrite ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                    }}
                    title={canWrite ? 'ক্লিক করে স্ট্যাটাস পরিবর্তন করুন' : ''}
                  >
                    <Icon name={st.icon} size={11} />
                    {st.label}
                  </button>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                  {row.notes || '—'}
                </td>
                {canWrite && (
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        className="erp-btn erp-btn--ghost"
                        onClick={() => onEdit(row)}
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        title="সম্পাদনা"
                      >
                        <Icon name="fa-edit" size={13} />
                      </button>
                      <button
                        className="erp-btn erp-btn--ghost"
                        onClick={() => onDelete(row.id)}
                        style={{ padding: '4px 8px', fontSize: 12, color: '#ef4444' }}
                        title="মুছুন"
                      >
                        <Icon name="fa-trash" size={13} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SyllabusTable;
