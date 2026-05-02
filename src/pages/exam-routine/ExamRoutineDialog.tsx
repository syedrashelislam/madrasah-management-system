import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import { SubjectRow } from '@/hooks/useSubjects';
import { ExamRoutineRow } from '@/hooks/useExamRoutines';

interface ExamRoutineDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<ExamRoutineRow, 'id' | 'created_at' | 'updated_at' | 'class_id' | 'class_name'>) => void;
  slot?: ExamRoutineRow | null;
  subjects: SubjectRow[];
  examNames: string[];
  loading?: boolean;
}

export default function ExamRoutineDialog({
  open, onClose, onSave, slot, subjects, examNames, loading,
}: ExamRoutineDialogProps) {
  const [examName, setExamName] = useState('');
  const [customExamName, setCustomExamName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [room, setRoom] = useState('');
  const [fullMarks, setFullMarks] = useState(100);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (slot) {
      const nameInList = examNames.includes(slot.exam_name);
      setExamName(nameInList ? slot.exam_name : '__custom__');
      setCustomExamName(nameInList ? '' : slot.exam_name);
      setSubjectName(slot.subject_name);
      setExamDate(slot.exam_date);
      setStartTime(slot.start_time);
      setEndTime(slot.end_time);
      setRoom(slot.room || '');
      setFullMarks(slot.full_marks);
      setNote(slot.note || '');
    } else {
      setExamName(examNames.length > 0 ? examNames[0] : '__custom__');
      setCustomExamName('');
      setSubjectName('');
      setExamDate('');
      setStartTime('09:00');
      setEndTime('12:00');
      setRoom('');
      setFullMarks(100);
      setNote('');
    }
  }, [slot, open, examNames]);

  const handleSubmit = () => {
    const finalExamName = examName === '__custom__' ? customExamName.trim() : examName;
    if (!finalExamName) { toast.error('পরীক্ষার নাম দিন'); return; }
    if (!subjectName.trim()) { toast.error('বিষয় নির্বাচন করুন'); return; }
    if (!examDate) { toast.error('তারিখ নির্বাচন করুন'); return; }
    onSave({
      exam_name: finalExamName,
      subject_name: subjectName,
      exam_date: examDate,
      start_time: startTime,
      end_time: endTime,
      room,
      full_marks: fullMarks,
      note,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1100 }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative erp-card" style={{ width: '100%', maxWidth: 500, padding: 24, margin: 16, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            <Icon name="fa-calendar-alt" size={16} style={{ color: '#d4af37', marginRight: 8 }} />
            {slot ? 'পরীক্ষার সময়সূচি সম্পাদনা' : 'নতুন পরীক্ষার সময়সূচি যোগ'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Icon name="fa-times" size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Exam Name */}
          <div>
            <label className="erp-label">পরীক্ষার নাম *</label>
            <select className="erp-input" value={examName} onChange={e => setExamName(e.target.value)}>
              {examNames.map(n => <option key={n} value={n}>{n}</option>)}
              <option value="__custom__">➕ নতুন পরীক্ষার নাম...</option>
            </select>
            {examName === '__custom__' && (
              <input
                className="erp-input"
                style={{ marginTop: 8 }}
                placeholder="যেমন: প্রথম সাময়িক পরীক্ষা ২০২৬"
                value={customExamName}
                onChange={e => setCustomExamName(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="erp-label">বিষয় *</label>
            <select className="erp-input" value={subjectName} onChange={e => setSubjectName(e.target.value)}>
              <option value="">— বিষয় নির্বাচন করুন —</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="erp-label">তারিখ *</label>
            <input type="date" className="erp-input" value={examDate} onChange={e => setExamDate(e.target.value)} />
          </div>

          {/* Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="erp-label">শুরু</label>
              <input type="time" className="erp-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="erp-label">শেষ</label>
              <input type="time" className="erp-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Full Marks + Room */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="erp-label">পূর্ণমান</label>
              <input type="number" className="erp-input" value={fullMarks} onChange={e => setFullMarks(Number(e.target.value))} min={0} />
            </div>
            <div>
              <label className="erp-label">রুম / হল</label>
              <input className="erp-input" placeholder="যেমন: হল ১" value={room} onChange={e => setRoom(e.target.value)} />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="erp-label">নোট / বিশেষ নির্দেশনা</label>
            <input className="erp-input" placeholder="ঐচ্ছিক" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="erp-btn erp-btn--ghost" onClick={onClose}>বাতিল</button>
          <button className="erp-btn erp-btn--primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <Icon name="fa-spinner fa-spin" size={14} /> : <Icon name="fa-save" size={14} />}
            {slot ? ' আপডেট করুন' : ' সংরক্ষণ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
