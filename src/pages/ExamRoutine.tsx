import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/Icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useExamRoutines, useExamNames, useAddExamRoutine,
  useUpdateExamRoutine, useDeleteExamRoutine, ExamRoutineRow,
} from '@/hooks/useExamRoutines';
import ExamRoutineTable from './exam-routine/ExamRoutineTable';
import ExamRoutineDialog from './exam-routine/ExamRoutineDialog';

const EXAM_LINKS = [
  { path: '/exams',               icon: 'fa-edit',           label: 'নম্বর এন্ট্রি',   color: '#d4af37' },
  { path: '/teacher-grade-entry', icon: 'fa-pen-fancy',      label: 'গ্রেড এন্ট্রি',   color: '#3b82f6' },
  { path: '/exam-routine',        icon: 'fa-calendar-alt',   label: 'পরীক্ষার রুটিন',  color: '#10b981' },
  { path: '/admit-card',          icon: 'fa-address-card',   label: 'অ্যাডমিট কার্ড',  color: '#f59e0b' },
  { path: '/marksheet',           icon: 'fa-scroll',         label: 'মার্কশিট',        color: '#8b5cf6' },
];

const ExamRoutine = () => {
  const { canWrite } = useUserRole();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: allExamNames = [] } = useExamNames();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<ExamRoutineRow | null>(null);

  const classId = selectedClassId ?? (classes.length > 0 ? classes[0].class_id : null);
  const selectedClass = classes.find(c => c.class_id === classId);

  const { data: routines = [], isLoading: routinesLoading } = useExamRoutines(classId ?? undefined, selectedExam || undefined);
  const addMutation = useAddExamRoutine();
  const updateMutation = useUpdateExamRoutine();
  const deleteMutation = useDeleteExamRoutine();

  const classExamNames = useMemo(() => {
    if (!classId) return [];
    return [...new Set(routines.map(r => r.exam_name))].sort();
  }, [routines, classId]);

  const mergedExamNames = useMemo(() => {
    return [...new Set([...allExamNames, ...classExamNames])].sort();
  }, [allExamNames, classExamNames]);

  const stats = useMemo(() => {
    const totalExams = routines.length;
    const uniqueSubjects = new Set(routines.map(r => r.subject_name)).size;
    const uniqueDates = new Set(routines.map(r => r.exam_date)).size;
    const totalMarks = routines.reduce((s, r) => s + r.full_marks, 0);
    const upcoming = routines.filter(r => {
      const d = new Date(r.exam_date + 'T00:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return d >= today;
    }).length;
    return { totalExams, uniqueSubjects, uniqueDates, totalMarks, upcoming };
  }, [routines]);

  const handleAdd = () => { setEditRow(null); setDialogOpen(true); };
  const handleEdit = (row: ExamRoutineRow) => { setEditRow(row); setDialogOpen(true); };

  const handleDelete = (id: string) => {
    if (!confirm('এই পরীক্ষার সময়সূচিটি মুছে ফেলতে চান?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('মুছে ফেলা হয়েছে'),
      onError: () => toast.error('মুছতে ব্যর্থ'),
    });
  };

  const handleSave = (data: Omit<ExamRoutineRow, 'id' | 'created_at' | 'updated_at' | 'class_id' | 'class_name'>) => {
    if (!classId || !selectedClass) return;
    if (editRow) {
      updateMutation.mutate({ id: editRow.id, ...data }, {
        onSuccess: () => { toast.success('আপডেট হয়েছে'); setDialogOpen(false); },
        onError: () => toast.error('আপডেট ব্যর্থ'),
      });
    } else {
      const exists = routines.find(r =>
        r.exam_name === data.exam_name && r.subject_name === data.subject_name && r.exam_date === data.exam_date
      );
      if (exists) { toast.error('এই পরীক্ষায় এই বিষয় এই তারিখে ইতিমধ্যে আছে'); return; }
      addMutation.mutate({ class_id: classId, class_name: selectedClass.name, ...data }, {
        onSuccess: () => { toast.success('নতুন সময়সূচি যোগ হয়েছে'); setDialogOpen(false); },
        onError: () => toast.error('যোগ করতে ব্যর্থ'),
      });
    }
  };

  const handlePrint = () => {
    if (!selectedClass || routines.length === 0) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const examTitle = selectedExam || 'সকল পরীক্ষা';
    const sorted = [...routines].sort((a, b) => a.exam_date.localeCompare(b.exam_date) || a.start_time.localeCompare(b.start_time));
    const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const fmtDate = (ds: string) => {
      try { const d = new Date(ds + 'T00:00:00'); return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} (${days[d.getDay()]})`; }
      catch { return ds; }
    };
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>পরীক্ষার রুটিন - ${selectedClass.name}</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Noto Sans Bengali',sans-serif;}
    body{padding:24px;}h2{text-align:center;margin-bottom:4px;font-size:20px;}
    .sub{text-align:center;color:#666;margin-bottom:16px;font-size:13px;}
    table{width:100%;border-collapse:collapse;font-size:13px;}
    th,td{border:1px solid #ccc;padding:8px 10px;}
    th{background:#f5f0e0;font-weight:700;text-align:center;}td{text-align:center;}
    .subject{font-weight:700;text-align:left;}.date{text-align:left;font-weight:600;}
    @media print{body{padding:10px;}}</style></head><body>
    <h2>পরীক্ষার রুটিন — ${selectedClass.name}</h2>
    <p class="sub">${examTitle}</p>
    <table><thead><tr><th>#</th><th style="text-align:left">তারিখ</th><th style="text-align:left">বিষয়</th><th>সময়</th><th>পূর্ণমান</th><th>রুম</th></tr></thead><tbody>`);
    sorted.forEach((r, i) => {
      printWin.document.write(`<tr><td>${i + 1}</td><td class="date">${fmtDate(r.exam_date)}</td>
        <td class="subject">${r.subject_name}${r.note ? ` <small style="color:#888">(${r.note})</small>` : ''}</td>
        <td>${r.start_time} — ${r.end_time}</td><td>${r.full_marks}</td><td>${r.room || '—'}</td></tr>`);
    });
    printWin.document.write('</tbody></table></body></html>');
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header exam-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="fa-calendar-alt" size={22} style={{ color: '#d4af37' }} />
            পরীক্ষার রুটিন
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            পরীক্ষার তারিখ ও সময়সূচি তৈরি ও পরিচালনা করুন
          </p>
        </div>
        <div className="exam-page-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {classId && routines.length > 0 && (
            <button className="erp-btn erp-btn--ghost" onClick={handlePrint}>
              <Icon name="fa-print" size={14} /> প্রিন্ট
            </button>
          )}
          {canWrite && classId && (
            <button className="erp-btn erp-btn--primary" onClick={handleAdd}>
              <Icon name="fa-plus" size={14} /> নতুন সময়সূচি
            </button>
          )}
        </div>
      </div>

      {/* পরীক্ষা মডিউল দ্রুত নেভিগেশন */}
      <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(16,185,129,0.6)', marginBottom: 10, letterSpacing: 1 }}>
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

      {/* Class Selector */}
      <div className="erp-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            <Icon name="fa-chalkboard" size={14} style={{ marginRight: 6, color: '#d4af37' }} />
            ক্লাস নির্বাচন:
          </label>
          {classesLoading ? <Skeleton className="h-9 w-48" /> : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {classes.map(c => (
                <button key={c.class_id}
                  onClick={() => { setSelectedClassId(c.class_id); setSelectedExam(''); }}
                  className="erp-btn"
                  style={{
                    fontSize: 13, padding: '6px 14px', borderRadius: 20,
                    background: classId === c.class_id ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: classId === c.class_id ? '#fff' : 'var(--text-primary)',
                    border: classId === c.class_id ? '2px solid var(--accent)' : '2px solid var(--border)',
                    fontWeight: classId === c.class_id ? 700 : 500, transition: 'all 0.2s',
                  }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {classExamNames.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <Icon name="fa-filter" size={12} style={{ marginRight: 4 }} /> পরীক্ষা ফিল্টার:
            </label>
            <button onClick={() => setSelectedExam('')} className="erp-btn"
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 16, background: !selectedExam ? '#3b82f6' : 'var(--bg-secondary)', color: !selectedExam ? '#fff' : 'var(--text-secondary)', border: !selectedExam ? '1.5px solid #3b82f6' : '1.5px solid var(--border)', fontWeight: !selectedExam ? 700 : 500 }}>
              সব
            </button>
            {classExamNames.map(name => (
              <button key={name} onClick={() => setSelectedExam(name)} className="erp-btn"
                style={{ fontSize: 12, padding: '4px 12px', borderRadius: 16, background: selectedExam === name ? '#3b82f6' : 'var(--bg-secondary)', color: selectedExam === name ? '#fff' : 'var(--text-secondary)', border: selectedExam === name ? '1.5px solid #3b82f6' : '1.5px solid var(--border)', fontWeight: selectedExam === name ? 700 : 500 }}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {classId && !routinesLoading && routines.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { icon: 'fa-calendar-alt', color: '#d4af37', val: stats.totalExams, label: 'মোট পরীক্ষা' },
            { icon: 'fa-book', color: '#3b82f6', val: stats.uniqueSubjects, label: 'বিষয়' },
            { icon: 'fa-calendar-check', color: '#10b981', val: stats.uniqueDates, label: 'পরীক্ষার দিন' },
            { icon: 'fa-clock', color: '#f59e0b', val: stats.upcoming, label: 'আসন্ন' },
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

      {/* Table / Empty states */}
      {!classId ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-calendar-alt" size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>পরীক্ষার রুটিন দেখতে একটি ক্লাস নির্বাচন করুন</p>
        </div>
      ) : routinesLoading ? (
        <div className="erp-card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </div>
      ) : routines.length === 0 ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-calendar" size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
            {selectedExam ? `"${selectedExam}" পরীক্ষার জন্য কোনো সময়সূচি পাওয়া যায়নি` : 'এই ক্লাসে কোনো রুটিন নেই'}
          </p>
          {canWrite && (
            <button className="erp-btn erp-btn--primary" style={{ marginTop: 14 }} onClick={handleAdd}>
              <Icon name="fa-plus" size={14} /> নতুন সময়সূচি যোগ করুন
            </button>
          )}
        </div>
      ) : (
        <div className="erp-card" style={{ padding: 12, overflow: 'hidden' }}>
          {selectedExam && (
            <div style={{ padding: '8px 12px', marginBottom: 8, background: 'var(--bg-secondary)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="fa-file-alt" size={14} style={{ color: '#d4af37' }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{selectedExam}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— {selectedClass?.name}</span>
            </div>
          )}
          <ExamRoutineTable routines={routines} onEdit={handleEdit} onDelete={handleDelete} canWrite={canWrite} />
        </div>
      )}

      <ExamRoutineDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        slot={editRow}
        subjects={subjects}
        examNames={mergedExamNames}
        loading={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default ExamRoutine;
