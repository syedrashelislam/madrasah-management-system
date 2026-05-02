import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import { SubjectRow } from '@/hooks/useSubjects';
import { StaffRow } from '@/hooks/useStaff';
import { ClassRoutineRow, DEFAULT_PERIODS } from '@/hooks/useClassRoutines';

interface RoutineSlotDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    period: number;
    start_time: string;
    end_time: string;
    subject_name: string;
    teacher_name: string;
    room: string;
  }) => void;
  slot?: ClassRoutineRow | null;
  day: string;
  subjects: SubjectRow[];
  teachers: StaffRow[];
  loading?: boolean;
}

export default function RoutineSlotDialog({
  open, onClose, onSave, slot, day, subjects, teachers, loading,
}: RoutineSlotDialogProps) {
  const [period, setPeriod] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:45');
  const [subjectName, setSubjectName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [room, setRoom] = useState('');

  useEffect(() => {
    if (slot) {
      setPeriod(slot.period);
      setStartTime(slot.start_time);
      setEndTime(slot.end_time);
      setSubjectName(slot.subject_name);
      setTeacherName(slot.teacher_name);
      setRoom(slot.room || '');
    } else {
      setPeriod(1);
      setStartTime('08:00');
      setEndTime('08:45');
      setSubjectName('');
      setTeacherName('');
      setRoom('');
    }
  }, [slot, open]);

  const handlePeriodChange = (p: number) => {
    setPeriod(p);
    const def = DEFAULT_PERIODS.find(d => d.period === p);
    if (def) { setStartTime(def.start); setEndTime(def.end); }
  };

  const handleSubmit = () => {
    if (!subjectName.trim()) { toast.error('বিষয় নির্বাচন করুন'); return; }
    onSave({ period, start_time: startTime, end_time: endTime, subject_name: subjectName, teacher_name: teacherName, room });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1100 }}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative erp-card" style={{ width: '100%', maxWidth: 460, padding: 24, margin: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            <Icon name="fa-clock" size={16} style={{ color: '#d4af37', marginRight: 8 }} />
            {slot ? 'ক্লাস সম্পাদনা' : 'নতুন ক্লাস যোগ'} — {day}
          </h3>
          <button onClick={onClose} className="erp-btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="fa-times" size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Period */}
          <div>
            <label className="erp-label">পিরিয়ড নম্বর</label>
            <select className="erp-input" value={period} onChange={e => handlePeriodChange(Number(e.target.value))}>
              {DEFAULT_PERIODS.map(p => (
                <option key={p.period} value={p.period}>
                  পিরিয়ড {p.period} ({p.start} - {p.end})
                </option>
              ))}
            </select>
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

          {/* Subject */}
          <div>
            <label className="erp-label">বিষয় *</label>
            <select className="erp-input" value={subjectName} onChange={e => setSubjectName(e.target.value)}>
              <option value="">— বিষয় নির্বাচন করুন —</option>
              {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              <option value="বিরতি">🕐 বিরতি</option>
              <option value="জুহরের নামাজ">🕌 জুহরের নামাজ</option>
              <option value="আসরের নামাজ">🕌 আসরের নামাজ</option>
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="erp-label">শিক্ষক</label>
            <select className="erp-input" value={teacherName} onChange={e => setTeacherName(e.target.value)}>
              <option value="">— শিক্ষক নির্বাচন করুন —</option>
              {teachers.filter(t => t.status === 'active').map(t => (
                <option key={t.id} value={t.name}>{t.name} {t.designation ? `(${t.designation})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Room */}
          <div>
            <label className="erp-label">রুম / কক্ষ</label>
            <input className="erp-input" placeholder="যেমন: রুম ১০১" value={room} onChange={e => setRoom(e.target.value)} />
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
