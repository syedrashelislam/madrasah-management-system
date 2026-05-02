import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useStaff } from '@/hooks/useStaff';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useClassRoutines, useAddClassRoutine, useUpdateClassRoutine,
  useDeleteClassRoutine, DEFAULT_PERIODS, ClassRoutineRow,
} from '@/hooks/useClassRoutines';
import RoutineGrid from './class-routine/RoutineGrid';
import RoutineSlotDialog from './class-routine/RoutineSlotDialog';

const ClassRoutine = () => {
  const { canWrite } = useUserRole();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: staff = [] } = useStaff();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSlot, setEditSlot] = useState<ClassRoutineRow | null>(null);
  const [dialogDay, setDialogDay] = useState('');
  const [dialogPeriod, setDialogPeriod] = useState(1);

  // Auto-select first class
  const classId = selectedClassId ?? (classes.length > 0 ? classes[0].class_id : null);
  const selectedClass = classes.find(c => c.class_id === classId);

  const { data: routines = [], isLoading: routinesLoading } = useClassRoutines(classId ?? undefined);
  const addMutation = useAddClassRoutine();
  const updateMutation = useUpdateClassRoutine();
  const deleteMutation = useDeleteClassRoutine();

  // Stats
  const stats = useMemo(() => {
    const totalSlots = routines.length;
    const uniqueSubjects = new Set(routines.map(r => r.subject_name).filter(s => !['বিরতি', 'জুহরের নামাজ', 'আসরের নামাজ'].includes(s))).size;
    const uniqueTeachers = new Set(routines.map(r => r.teacher_name).filter(Boolean)).size;
    return { totalSlots, uniqueSubjects, uniqueTeachers };
  }, [routines]);

  const handleAddSlot = (day: string, period: number) => {
    setEditSlot(null);
    setDialogDay(day);
    setDialogPeriod(period);
    setDialogOpen(true);
  };

  const handleEditSlot = (slot: ClassRoutineRow) => {
    setEditSlot(slot);
    setDialogDay(slot.day);
    setDialogPeriod(slot.period);
    setDialogOpen(true);
  };

  const handleDeleteSlot = (id: string) => {
    if (!confirm('এই ক্লাস স্লটটি মুছে ফেলতে চান?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('স্লট মুছে ফেলা হয়েছে'),
      onError: () => toast.error('মুছতে ব্যর্থ হয়েছে'),
    });
  };

  const handleSaveSlot = (data: {
    period: number; start_time: string; end_time: string;
    subject_name: string; teacher_name: string; room: string;
  }) => {
    if (!classId || !selectedClass) return;

    if (editSlot) {
      updateMutation.mutate({ id: editSlot.id, ...data }, {
        onSuccess: () => { toast.success('ক্লাস আপডেট হয়েছে'); setDialogOpen(false); },
        onError: () => toast.error('আপডেট ব্যর্থ হয়েছে'),
      });
    } else {
      // Check duplicate
      const exists = routines.find(r => r.day === dialogDay && r.period === data.period);
      if (exists) {
        toast.error(`${dialogDay} পিরিয়ড ${data.period} এ ইতিমধ্যে ক্লাস আছে`);
        return;
      }
      addMutation.mutate({
        class_id: classId,
        class_name: selectedClass.name,
        day: dialogDay,
        ...data,
      }, {
        onSuccess: () => { toast.success('নতুন ক্লাস যোগ হয়েছে'); setDialogOpen(false); },
        onError: () => toast.error('যোগ করতে ব্যর্থ হয়েছে'),
      });
    }
  };

  const handlePrint = () => {
    if (!selectedClass) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const rows = routines.sort((a, b) => a.period - b.period);
    const days = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার'];
    const periods = DEFAULT_PERIODS.slice(0, 7);

    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ক্লাস রুটিন - ${selectedClass.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; }
      body { padding: 20px; }
      h2 { text-align: center; margin-bottom: 4px; font-size: 20px; }
      .sub { text-align: center; color: #666; margin-bottom: 16px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px 4px; text-align: center; }
      th { background: #f5f0e0; font-weight: 700; }
      .day-cell { font-weight: 700; background: #faf8f0; width: 80px; }
      .break { background: #fef3cd; font-style: italic; }
      .subject { font-weight: 600; }
      .teacher { font-size: 10px; color: #555; }
      @media print { body { padding: 10px; } }
    </style></head><body>
    <h2>ক্লাস রুটিন — ${selectedClass.name}</h2>
    <p class="sub">সাপ্তাহিক ক্লাস শিডিউল</p>
    <table><thead><tr><th>বার</th>${periods.map(p => `<th>পিরিয়ড ${p.period}<br><small>${p.start}-${p.end}</small></th>`).join('')}</tr></thead><tbody>`);

    days.forEach(day => {
      printWin.document.write(`<tr><td class="day-cell">${day}</td>`);
      periods.forEach(p => {
        const slot = rows.find(r => r.day === day && r.period === p.period);
        if (slot) {
          const isBreak = ['বিরতি', 'জুহরের নামাজ', 'আসরের নামাজ'].includes(slot.subject_name);
          printWin.document.write(`<td class="${isBreak ? 'break' : ''}"><span class="subject">${slot.subject_name}</span>${slot.teacher_name ? `<br><span class="teacher">${slot.teacher_name}</span>` : ''}</td>`);
        } else {
          printWin.document.write('<td>—</td>');
        }
      });
      printWin.document.write('</tr>');
    });

    printWin.document.write('</tbody></table></body></html>');
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="fa-clock" size={22} style={{ color: '#d4af37' }} />
            ক্লাস রুটিন
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            প্রতিদিনের ক্লাস শিডিউল দেখুন ও তৈরি করুন
          </p>
        </div>
        {classId && routines.length > 0 && (
          <button className="erp-btn erp-btn--ghost" onClick={handlePrint} title="প্রিন্ট করুন">
            <Icon name="fa-print" size={14} /> প্রিন্ট
          </button>
        )}
      </div>

      {/* Class Selector */}
      <div className="erp-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            <Icon name="fa-chalkboard" size={14} style={{ marginRight: 6, color: '#d4af37' }} />
            ক্লাস নির্বাচন:
          </label>
          {classesLoading ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {classes.map(c => (
                <button
                  key={c.class_id}
                  onClick={() => setSelectedClassId(c.class_id)}
                  className="erp-btn"
                  style={{
                    fontSize: 13, padding: '6px 14px', borderRadius: 20,
                    background: classId === c.class_id ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: classId === c.class_id ? '#fff' : 'var(--text-primary)',
                    border: classId === c.class_id ? '2px solid var(--accent)' : '2px solid var(--border)',
                    fontWeight: classId === c.class_id ? 700 : 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {classId && !routinesLoading && routines.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#d4af3718', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="fa-clock" size={16} style={{ color: '#d4af37' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.totalSlots}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>মোট ক্লাস</div>
            </div>
          </div>
          <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="fa-book" size={16} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.uniqueSubjects}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>বিষয়</div>
            </div>
          </div>
          <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10b98118', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="fa-user-tie" size={16} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.uniqueTeachers}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>শিক্ষক</div>
            </div>
          </div>
        </div>
      )}

      {/* Routine Grid */}
      {!classId ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-chalkboard" size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>ক্লাস রুটিন দেখতে উপরে থেকে একটি ক্লাস নির্বাচন করুন</p>
        </div>
      ) : routinesLoading ? (
        <div className="erp-card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </div>
      ) : (
        <div className="erp-card" style={{ padding: 12, overflow: 'hidden' }}>
          <RoutineGrid
            routines={routines}
            onEditSlot={handleEditSlot}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
            canWrite={canWrite}
          />
          {routines.length === 0 && (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <Icon name="fa-calendar" size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
              <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
                এই ক্লাসের জন্য এখনো কোনো রুটিন তৈরি হয়নি
              </p>
              {canWrite && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  টেবিলের <strong>+</strong> বাটনে ক্লিক করে নতুন ক্লাস যোগ করুন
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Slot Dialog */}
      <RoutineSlotDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSlot}
        slot={editSlot}
        day={dialogDay}
        subjects={subjects}
        teachers={staff}
        loading={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default ClassRoutine;
