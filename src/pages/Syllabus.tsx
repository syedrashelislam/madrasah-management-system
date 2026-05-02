import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useSyllabus, useAddSyllabus, useUpdateSyllabus, useDeleteSyllabus,
  type SyllabusRow,
} from '@/hooks/useSyllabus';
import SyllabusDialog from './syllabus/SyllabusDialog';
import SyllabusTable from './syllabus/SyllabusTable';

const NEXT_STATUS: Record<string, SyllabusRow['status']> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

const Syllabus = () => {
  const { canWrite } = useUserRole();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<SyllabusRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const classId = selectedClassId ?? (classes.length > 0 ? classes[0].class_id : null);
  const selectedClass = classes.find(c => c.class_id === classId);

  const { data: syllabi = [], isLoading: syllabiLoading } = useSyllabus(
    classId ?? undefined,
    selectedSubject || undefined,
  );

  const addMutation = useAddSyllabus();
  const updateMutation = useUpdateSyllabus();
  const deleteMutation = useDeleteSyllabus();

  // Stats
  const stats = useMemo(() => {
    const total = syllabi.length;
    const completed = syllabi.filter(s => s.status === 'completed').length;
    const inProgress = syllabi.filter(s => s.status === 'in_progress').length;
    const pending = syllabi.filter(s => s.status === 'pending').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, progress };
  }, [syllabi]);

  // Filtered list
  const filtered = useMemo(() => {
    if (!searchTerm) return syllabi;
    const q = searchTerm.toLowerCase();
    return syllabi.filter(s =>
      s.chapter_title.toLowerCase().includes(q) ||
      s.topics.toLowerCase().includes(q) ||
      s.notes.toLowerCase().includes(q)
    );
  }, [syllabi, searchTerm]);

  // Unique subjects from data for quick filter
  const subjectsInSyllabus = useMemo(() => {
    const set = new Set(syllabi.map(s => s.subject_name).filter(Boolean));
    return Array.from(set);
  }, [syllabi]);

  const handleAdd = () => {
    setEditRow(null);
    setDialogOpen(true);
  };

  const handleEdit = (row: SyllabusRow) => {
    setEditRow(row);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('এই অধ্যায়টি মুছে ফেলতে চান?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('অধ্যায় মুছে ফেলা হয়েছে'),
      onError: () => toast.error('মুছতে ব্যর্থ হয়েছে'),
    });
  };

  const handleToggleStatus = (row: SyllabusRow) => {
    const nextStatus = NEXT_STATUS[row.status];
    updateMutation.mutate({ id: row.id, status: nextStatus }, {
      onSuccess: () => toast.success('স্ট্যাটাস আপডেট হয়েছে'),
      onError: () => toast.error('আপডেট ব্যর্থ'),
    });
  };

  const handleSave = (data: {
    chapter_no: number; chapter_title: string;
    topics: string; status: SyllabusRow['status']; notes: string;
  }) => {
    if (!classId || !selectedClass) return;
    const subName = selectedSubject || (subjects.length > 0 ? subjects[0].name : '');

    if (editRow) {
      updateMutation.mutate({ id: editRow.id, ...data }, {
        onSuccess: () => { toast.success('অধ্যায় আপডেট হয়েছে'); setDialogOpen(false); },
        onError: () => toast.error('আপডেট ব্যর্থ হয়েছে'),
      });
    } else {
      addMutation.mutate({
        class_id: classId,
        class_name: selectedClass.name,
        subject_name: subName,
        ...data,
      } as any, {
        onSuccess: () => { toast.success('নতুন অধ্যায় যোগ হয়েছে'); setDialogOpen(false); },
        onError: () => toast.error('যোগ করতে ব্যর্থ হয়েছে'),
      });
    }
  };

  const handlePrint = () => {
    if (!selectedClass) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const subjectLabel = selectedSubject || 'সকল বিষয়';
    const rows = filtered.sort((a, b) => a.chapter_no - b.chapter_no);

    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>সিলেবাস - ${selectedClass.name}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Noto Sans Bengali', sans-serif; }
      body { padding: 24px; }
      h2 { text-align: center; margin-bottom: 4px; font-size: 20px; }
      .sub { text-align: center; color: #666; margin-bottom: 16px; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 12px; }
      th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f5f0e0; font-weight: 700; text-align: center; }
      .ch-no { font-weight: 700; text-align: center; color: #d4af37; }
      .topics { font-size: 11px; color: #555; }
      .topics ul { padding-left: 16px; margin: 0; }
      .status { text-align: center; font-size: 11px; font-weight: 600; }
      .status-completed { color: #10b981; }
      .status-in_progress { color: #3b82f6; }
      .status-pending { color: #f59e0b; }
      .progress-bar { margin: 12px auto; width: 300px; background: #eee; border-radius: 8px; height: 8px; }
      .progress-fill { height: 100%; border-radius: 8px; background: #10b981; }
      @media print { body { padding: 12px; } }
    </style></head><body>
    <h2>সিলেবাস — ${selectedClass.name}</h2>
    <p class="sub">বিষয়: ${subjectLabel} | সম্পন্ন: ${stats.completed}/${stats.total} (${stats.progress}%)</p>
    <div class="progress-bar"><div class="progress-fill" style="width:${stats.progress}%"></div></div>
    <table><thead><tr>
      <th style="width:60px">ক্রম</th>
      <th>অধ্যায়</th>
      <th>টপিকসমূহ</th>
      <th style="width:80px">স্ট্যাটাস</th>
      <th>নোট</th>
    </tr></thead><tbody>`);

    rows.forEach(r => {
      const topicsHtml = r.topics
        ? '<ul>' + r.topics.split('\n').filter(Boolean).map(t => `<li>${t}</li>`).join('') + '</ul>'
        : '—';
      const statusLabel = r.status === 'completed' ? 'সম্পন্ন' : r.status === 'in_progress' ? 'চলমান' : 'অপেক্ষমান';
      printWin.document.write(`<tr>
        <td class="ch-no">${r.chapter_no}</td>
        <td style="font-weight:600">${r.chapter_title}</td>
        <td class="topics">${topicsHtml}</td>
        <td class="status status-${r.status}">${statusLabel}</td>
        <td style="font-size:11px;color:#666">${r.notes || '—'}</td>
      </tr>`);
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
            <Icon name="fa-book-reader" size={22} style={{ color: '#d4af37' }} />
            সিলেবাস
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            ক্লাস ও বিষয়ভিত্তিক সিলেবাস তৈরি ও অগ্রগতি ট্র্যাক করুন
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {classId && syllabi.length > 0 && (
            <button className="erp-btn erp-btn--ghost" onClick={handlePrint} title="প্রিন্ট করুন">
              <Icon name="fa-print" size={14} /> প্রিন্ট
            </button>
          )}
          {canWrite && classId && subjects.length > 0 && (
            <button className="erp-btn erp-btn--primary" onClick={handleAdd}>
              <Icon name="fa-plus" size={14} /> অধ্যায় যোগ করুন
            </button>
          )}
        </div>
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
                  onClick={() => { setSelectedClassId(c.class_id); setSelectedSubject(''); setSearchTerm(''); }}
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

      {/* Subject Filter */}
      {classId && (
        <div className="erp-card" style={{ padding: '12px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              <Icon name="fa-book" size={13} style={{ marginRight: 6, color: '#3b82f6' }} />
              বিষয় ফিল্টার:
            </label>
            {subjectsLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedSubject('')}
                  className="erp-btn"
                  style={{
                    fontSize: 12, padding: '4px 12px', borderRadius: 16,
                    background: !selectedSubject ? '#3b82f6' : 'var(--bg-secondary)',
                    color: !selectedSubject ? '#fff' : 'var(--text-secondary)',
                    border: !selectedSubject ? '2px solid #3b82f6' : '2px solid var(--border)',
                    fontWeight: !selectedSubject ? 700 : 500,
                    transition: 'all 0.2s',
                  }}
                >
                  সকল
                </button>
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSubject(s.name)}
                    className="erp-btn"
                    style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 16,
                      background: selectedSubject === s.name ? '#3b82f6' : 'var(--bg-secondary)',
                      color: selectedSubject === s.name ? '#fff' : 'var(--text-secondary)',
                      border: selectedSubject === s.name ? '2px solid #3b82f6' : '2px solid var(--border)',
                      fontWeight: selectedSubject === s.name ? 700 : 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats + Progress */}
      {classId && !syllabiLoading && syllabi.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#d4af3718', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="fa-list" size={16} style={{ color: '#d4af37' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>মোট অধ্যায়</div>
              </div>
            </div>
            <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10b98118', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="fa-check-circle" size={16} style={{ color: '#10b981' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.completed}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>সম্পন্ন</div>
              </div>
            </div>
            <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#3b82f618', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="fa-spinner" size={16} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.inProgress}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>চলমান</div>
              </div>
            </div>
            <div className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f59e0b18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="fa-clock" size={16} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{stats.pending}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>অপেক্ষমান</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="erp-card" style={{ padding: '14px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                <Icon name="fa-chart-line" size={13} style={{ marginRight: 6, color: '#10b981' }} />
                সিলেবাস অগ্রগতি
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: stats.progress === 100 ? '#10b981' : 'var(--text-primary)' }}>
                {stats.progress}%
              </span>
            </div>
            <div style={{ width: '100%', height: 10, borderRadius: 5, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
              <div style={{
                width: `${stats.progress}%`, height: '100%', borderRadius: 5,
                background: stats.progress === 100
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </>
      )}

      {/* Search */}
      {classId && syllabi.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 360 }}>
            <Icon name="fa-search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="erp-input"
              placeholder="অধ্যায় বা টপিক খুঁজুন..."
              style={{ width: '100%', paddingLeft: 36, padding: '8px 12px 8px 36px', fontSize: 13 }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {!classId ? (
        <div className="erp-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Icon name="fa-book-reader" size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>সিলেবাস দেখতে উপরে থেকে একটি ক্লাস নির্বাচন করুন</p>
        </div>
      ) : syllabiLoading ? (
        <div className="erp-card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        </div>
      ) : filtered.length === 0 && syllabi.length === 0 ? (
        <div className="erp-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Icon name="fa-book-reader" size={40} style={{ color: 'var(--accent)', opacity: 0.4 }} />
          <h3 style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {selectedSubject ? `"${selectedSubject}" বিষয়ে এখনো কোনো সিলেবাস নেই` : 'এই ক্লাসের জন্য এখনো কোনো সিলেবাস যোগ হয়নি'}
          </h3>
          {canWrite && (
            <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 13 }}>
              উপরের "অধ্যায় যোগ করুন" বাটনে ক্লিক করে প্রথম অধ্যায় যোগ করুন
            </p>
          )}
        </div>
      ) : filtered.length === 0 && searchTerm ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-search" size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>
            "{searchTerm}" এর জন্য কোনো ফলাফল পাওয়া যায়নি
          </p>
        </div>
      ) : (
        <div className="erp-card" style={{ padding: 0, overflow: 'hidden' }}>
          <SyllabusTable
            items={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            canWrite={canWrite}
          />
        </div>
      )}

      {/* Dialog */}
      <SyllabusDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        editRow={editRow}
        loading={addMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default Syllabus;
