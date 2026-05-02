import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { SyllabusRow } from '@/hooks/useSyllabus';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    chapter_no: number;
    chapter_title: string;
    topics: string;
    status: SyllabusRow['status'];
    notes: string;
  }) => void;
  editRow: SyllabusRow | null;
  loading: boolean;
}

const STATUS_OPTIONS: { value: SyllabusRow['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'অপেক্ষমান', color: '#f59e0b' },
  { value: 'in_progress', label: 'চলমান', color: '#3b82f6' },
  { value: 'completed', label: 'সম্পন্ন', color: '#10b981' },
];

const SyllabusDialog = ({ open, onClose, onSave, editRow, loading }: Props) => {
  const [chapterNo, setChapterNo] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [topics, setTopics] = useState('');
  const [status, setStatus] = useState<SyllabusRow['status']>('pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editRow) {
      setChapterNo(editRow.chapter_no);
      setChapterTitle(editRow.chapter_title);
      setTopics(editRow.topics);
      setStatus(editRow.status);
      setNotes(editRow.notes);
    } else {
      setChapterNo(1);
      setChapterTitle('');
      setTopics('');
      setStatus('pending');
      setNotes('');
    }
  }, [editRow, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;
    onSave({ chapter_no: chapterNo, chapter_title: chapterTitle.trim(), topics: topics.trim(), status, notes: notes.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editRow ? 'অধ্যায় সম্পাদনা' : 'নতুন অধ্যায় যোগ'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                অধ্যায় নং
              </label>
              <input
                type="number"
                min={1}
                value={chapterNo}
                onChange={e => setChapterNo(Number(e.target.value))}
                className="erp-input"
                style={{ width: '100%', padding: '8px 10px', fontSize: 14 }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                অধ্যায়ের শিরোনাম *
              </label>
              <input
                type="text"
                value={chapterTitle}
                onChange={e => setChapterTitle(e.target.value)}
                className="erp-input"
                style={{ width: '100%', padding: '8px 10px', fontSize: 14 }}
                placeholder="যেমন: তাওহীদ"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              টপিকসমূহ
            </label>
            <textarea
              value={topics}
              onChange={e => setTopics(e.target.value)}
              className="erp-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, minHeight: 80, resize: 'vertical' }}
              placeholder="প্রতিটি টপিক আলাদা লাইনে লিখুন..."
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              স্ট্যাটাস
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: `2px solid ${status === opt.value ? opt.color : 'var(--border)'}`,
                    background: status === opt.value ? `${opt.color}18` : 'var(--bg-secondary)',
                    color: status === opt.value ? opt.color : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
              নোট
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="erp-input"
              style={{ width: '100%', padding: '8px 10px', fontSize: 13 }}
              placeholder="ঐচ্ছিক নোট..."
            />
          </div>

          <DialogFooter style={{ marginTop: 4 }}>
            <button type="button" className="erp-btn erp-btn--ghost" onClick={onClose}>বাতিল</button>
            <button type="submit" className="erp-btn erp-btn--primary" disabled={loading || !chapterTitle.trim()}>
              {loading ? 'সংরক্ষণ হচ্ছে...' : editRow ? 'আপডেট করুন' : 'যোগ করুন'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SyllabusDialog;
