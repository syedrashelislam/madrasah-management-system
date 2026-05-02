import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/Icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClasses } from '@/hooks/useClasses';
import { useExams, useAllExamSubjects, useMarkEntries } from '@/hooks/useExams';
import { useStudents } from '@/hooks/useStudents';
import { useUserRole } from '@/hooks/useUserRole';
import { useInstitutionInfo } from '@/hooks/useInstitutionInfo';
import { useStoredResults, useCalculateAndSaveResults, type StoredResultRow } from '@/hooks/useStudentResults';
import { getGrade, generateMarksheetPDF, getStudentResult, type SubjectResult, type StudentResult } from './exam/examUtils';
import { toBengaliNumber } from '@/lib/constants';

const EXAM_LINKS = [
  { path: '/exams',               icon: 'fa-edit',           label: 'নম্বর এন্ট্রি',   color: '#d4af37' },
  { path: '/teacher-grade-entry', icon: 'fa-pen-fancy',      label: 'গ্রেড এন্ট্রি',   color: '#3b82f6' },
  { path: '/exam-routine',        icon: 'fa-calendar-alt',   label: 'পরীক্ষার রুটিন',  color: '#10b981' },
  { path: '/admit-card',          icon: 'fa-address-card',   label: 'অ্যাডমিট কার্ড',  color: '#f59e0b' },
  { path: '/marksheet',           icon: 'fa-scroll',         label: 'মার্কশিট',        color: '#8b5cf6' },
];

function parseSubjectDetails(json: string): SubjectResult[] {
  try { return JSON.parse(json) as SubjectResult[]; }
  catch { return []; }
}

function gradeColor(grade: string): string {
  if (grade === 'A+') return '#d4af37';
  if (grade === 'A') return '#10b981';
  if (grade === 'A-') return '#22c55e';
  if (grade === 'B') return '#3b82f6';
  if (grade === 'C') return '#f59e0b';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
}

export default function Marksheet() {
  const { canWrite } = useUserRole();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const { data: exams = [], isLoading: examsLoading } = useExams();
  const { data: allSubjects = [] } = useAllExamSubjects();
  const { data: students = [] } = useStudents();
  const institution = useInstitutionInfo();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [viewRow, setViewRow] = useState<StoredResultRow | null>(null);

  const classId = selectedClassId ?? (classes.length > 0 ? classes[0].class_id : null);
  const classExams = useMemo(() => exams.filter(e => classId && e.classId === classId), [exams, classId]);
  const examId = selectedExamId || (classExams.length > 0 ? classExams[0].id : '');
  const selectedExam = exams.find(e => e.id === examId);

  const { data: storedResults = [], isLoading: resultsLoading } = useStoredResults(examId || undefined);
  const { data: marks = [] } = useMarkEntries(examId);
  const calculateMutation = useCalculateAndSaveResults();

  const stats = useMemo(() => {
    if (storedResults.length === 0) return null;
    const total = storedResults.length;
    const passed = storedResults.filter(r => r.passed === 1).length;
    const failed = total - passed;
    const avgPercent = total > 0 ? Math.round(storedResults.reduce((s, r) => s + r.overall_percent, 0) / total) : 0;
    const highest = total > 0 ? Math.max(...storedResults.map(r => r.overall_percent)) : 0;
    const gradeDistribution: Record<string, number> = {};
    storedResults.forEach(r => { gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1; });
    return { total, passed, failed, avgPercent, highest: Math.round(highest), gradeDistribution, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 };
  }, [storedResults]);

  const handleCalculate = () => {
    if (!selectedExam) return;
    calculateMutation.mutate(
      { exam: selectedExam, examSubjects: allSubjects, marks, students },
      {
        onSuccess: (data) => toast.success(`${data.count} জন শিক্ষার্থীর ফলাফল গণনা ও সংরক্ষণ হয়েছে`),
        onError: (e: any) => toast.error(e.message || 'ফলাফল গণনায় ত্রুটি'),
      }
    );
  };

  const handlePrintMarksheet = (row: StoredResultRow) => {
    if (!selectedExam) return;
    const subjects = parseSubjectDetails(row.subject_details);
    const result: StudentResult = {
      studentId: row.student_id, studentName: row.student_name, roll: row.roll,
      subjectResults: subjects, totalObtained: row.total_obtained, totalFull: row.total_full,
      overallPercent: row.overall_percent, grade: row.grade, gpa: row.gpa, passed: row.passed === 1,
    };
    generateMarksheetPDF(result, selectedExam, institution);
  };

  const handlePrintAll = () => {
    if (!selectedExam || storedResults.length === 0) return;
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ফলাফল — ${selectedExam.name}</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;font-family:'Noto Sans Bengali',sans-serif;}
    body{padding:24px;}h2{text-align:center;margin-bottom:4px;font-size:18px;}
    .sub{text-align:center;color:#666;margin-bottom:16px;font-size:12px;}
    table{width:100%;border-collapse:collapse;font-size:12px;}
    th,td{border:1px solid #ccc;padding:6px 8px;text-align:center;}
    th{background:#f5f0e0;font-weight:700;}.pass{color:#16a34a;font-weight:700;}.fail{color:#dc2626;font-weight:700;}
    .name{text-align:left;font-weight:600;}@media print{body{padding:10px;}}</style></head><body>
    <h2>${institution.name}</h2><p class="sub">${institution.address}</p>
    <h2 style="font-size:15px;margin-bottom:12px">${selectedExam.name} — ${selectedExam.className} — ফলাফল</h2>
    <table><thead><tr><th>#</th><th style="text-align:left">নাম</th><th>রোল</th><th>প্রাপ্ত</th><th>পূর্ণমান</th><th>শতকরা</th><th>গ্রেড</th><th>জিপিএ</th><th>ফলাফল</th></tr></thead><tbody>`);
    storedResults.forEach((r, i) => {
      printWin.document.write(`<tr><td>${i + 1}</td><td class="name">${r.student_name}</td><td>${r.roll}</td><td>${r.total_obtained}</td><td>${r.total_full}</td><td>${Math.round(r.overall_percent)}%</td><td>${r.grade}</td><td>${r.gpa}</td><td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'পাশ' : 'ফেল'}</td></tr>`);
    });
    printWin.document.write(`</tbody></table><div style="margin-top:16px;font-size:11px;color:#888;text-align:center">মোট: ${storedResults.length} | পাশ: ${stats?.passed || 0} | ফেল: ${stats?.failed || 0} | পাশের হার: ${stats?.passRate || 0}%</div></body></html>`);
    printWin.document.close();
    setTimeout(() => printWin.print(), 500);
  };

  const viewSubjects = viewRow ? parseSubjectDetails(viewRow.subject_details) : [];

  return (
    <div>
      {/* Header */}
      <div className="page-header exam-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="fa-scroll" size={22} style={{ color: '#8b5cf6' }} />
            মার্কশিট ও ফলাফল
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            পরীক্ষার ফলাফল গণনা, সংরক্ষণ ও মার্কশিট প্রিন্ট করুন
          </p>
        </div>
        <div className="exam-page-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {storedResults.length > 0 && (
            <button className="erp-btn erp-btn--ghost" onClick={handlePrintAll}>
              <Icon name="fa-print" size={14} /> সকলের ফলাফল
            </button>
          )}
          {canWrite && examId && marks.length > 0 && (
            <button className="erp-btn erp-btn--primary" onClick={handleCalculate} disabled={calculateMutation.isPending}>
              {calculateMutation.isPending ? <Icon name="fa-spinner fa-spin" size={14} /> : <Icon name="fa-calculator" size={14} />}
              {' '}ফলাফল গণনা
            </button>
          )}
        </div>
      </div>

      {/* পরীক্ষা মডিউল দ্রুত নেভিগেশন */}
      <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 14, padding: '12px 14px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(139,92,246,0.6)', marginBottom: 10, letterSpacing: 1 }}>
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

      {/* Selectors */}
      <div className="erp-card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            <Icon name="fa-chalkboard" size={14} style={{ marginRight: 6, color: '#d4af37' }} /> ক্লাস:
          </label>
          {classesLoading ? <Skeleton className="h-9 w-48" /> : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {classes.map(c => (
                <button key={c.class_id} onClick={() => { setSelectedClassId(c.class_id); setSelectedExamId(''); }} className="erp-btn"
                  style={{ fontSize: 13, padding: '6px 14px', borderRadius: 20, background: classId === c.class_id ? 'var(--accent)' : 'var(--bg-secondary)', color: classId === c.class_id ? '#fff' : 'var(--text-primary)', border: classId === c.class_id ? '2px solid var(--accent)' : '2px solid var(--border)', fontWeight: classId === c.class_id ? 700 : 500, transition: 'all 0.2s' }}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {classExams.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <Icon name="fa-file-alt" size={12} style={{ marginRight: 4 }} /> পরীক্ষা:
            </label>
            {classExams.map(e => (
              <button key={e.id} onClick={() => setSelectedExamId(e.id)} className="erp-btn"
                style={{ fontSize: 12, padding: '4px 12px', borderRadius: 16, background: examId === e.id ? '#8b5cf6' : 'var(--bg-secondary)', color: examId === e.id ? '#fff' : 'var(--text-secondary)', border: examId === e.id ? '1.5px solid #8b5cf6' : '1.5px solid var(--border)', fontWeight: examId === e.id ? 700 : 500 }}>
                {e.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { icon: 'fa-users', color: '#d4af37', value: stats.total, label: 'মোট পরীক্ষার্থী' },
            { icon: 'fa-check-circle', color: '#10b981', value: stats.passed, label: 'পাশ' },
            { icon: 'fa-times-circle', color: '#ef4444', value: stats.failed, label: 'ফেল' },
            { icon: 'fa-chart-line', color: '#3b82f6', value: `${stats.avgPercent}%`, label: 'গড় শতকরা' },
            { icon: 'fa-trophy', color: '#f59e0b', value: `${stats.highest}%`, label: 'সর্বোচ্চ' },
            { icon: 'fa-chart-pie', color: '#8b5cf6', value: `${stats.passRate}%`, label: 'পাশের হার' },
          ].map((s, i) => (
            <div key={i} className="erp-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.icon} size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{typeof s.value === 'number' ? toBengaliNumber(s.value) : s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade distribution */}
      {stats && Object.keys(stats.gradeDistribution).length > 0 && (
        <div className="erp-card" style={{ padding: '14px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            <Icon name="fa-chart-bar" size={13} style={{ color: '#8b5cf6', marginRight: 6 }} /> গ্রেড বিতরণ
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['A+', 'A', 'A-', 'B', 'C', 'D', 'F'].filter(g => stats.gradeDistribution[g]).map(g => (
              <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${gradeColor(g)}14`, padding: '6px 14px', borderRadius: 12, border: `1.5px solid ${gradeColor(g)}30` }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: gradeColor(g) }}>{g}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{toBengaliNumber(stats.gradeDistribution[g])}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!classId || !examId ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-scroll" size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>ক্লাস ও পরীক্ষা নির্বাচন করুন</p>
        </div>
      ) : resultsLoading || examsLoading ? (
        <div className="erp-card" style={{ padding: 20 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" style={{ marginBottom: 8 }} />)}
        </div>
      ) : storedResults.length === 0 ? (
        <div className="erp-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Icon name="fa-calculator" size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 14 }}>এই পরীক্ষার ফলাফল এখনো গণনা হয়নি</p>
          {canWrite && marks.length > 0 && (
            <button className="erp-btn erp-btn--primary" style={{ marginTop: 14 }} onClick={handleCalculate} disabled={calculateMutation.isPending}>
              <Icon name="fa-calculator" size={14} /> এখনই ফলাফল গণনা করুন
            </button>
          )}
          {marks.length === 0 && <p style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>প্রথমে নম্বর এন্ট্রি করুন</p>}
        </div>
      ) : (
        <div className="erp-card" style={{ padding: 12, overflow: 'hidden' }}>
          {/* Mobile card view */}
          <div className="student-cards">
            {storedResults.map((r, idx) => {
              const gc = gradeColor(r.grade);
              return (
                <div key={r.id} className="erp-result-card">
                  <div className="erp-result-card__row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      {idx < 3 && r.passed === 1 && <span style={{ fontSize: 16 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>}
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.student_name}</div>
                    </div>
                    <span style={{ background: `${gc}18`, color: gc, fontSize: 13, fontWeight: 800, padding: '3px 10px', borderRadius: 10, border: `1.5px solid ${gc}30`, flexShrink: 0 }}>{r.grade}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap', marginTop: 4 }}>
                    <span>রোল: <strong style={{ color: 'var(--text-primary)' }}>{r.roll}</strong></span>
                    <span>নম্বর: <strong style={{ color: 'var(--text-primary)' }}>{r.total_obtained}/{r.total_full}</strong></span>
                    <span>শতকরা: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(r.overall_percent)}%</strong></span>
                    <span>জিপিএ: <strong style={{ color: gc }}>{r.gpa}</strong></span>
                    <span style={{ color: r.passed ? '#10b981' : '#ef4444', fontWeight: 700 }}>{r.passed ? '✓ পাশ' : '✗ ফেল'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => setViewRow(r)} className="erp-btn erp-btn--ghost" style={{ flex: 1, fontSize: 12, padding: '5px 8px', justifyContent: 'center' }}>
                      <Icon name="fa-eye" size={12} /> বিস্তারিত
                    </button>
                    <button onClick={() => handlePrintMarksheet(r)} className="erp-btn erp-btn--ghost" style={{ flex: 1, fontSize: 12, padding: '5px 8px', justifyContent: 'center' }}>
                      <Icon name="fa-print" size={12} /> মার্কশিট
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="student-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="erp-table" style={{ minWidth: 720, borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['#', 'নাম', 'রোল', 'প্রাপ্ত', 'পূর্ণমান', 'শতকরা', 'গ্রেড', 'জিপিএ', 'ফলাফল', 'অ্যাকশন'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 10px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '2px solid var(--border)', textAlign: i === 1 ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storedResults.map((r, idx) => {
                  const gc = gradeColor(r.grade);
                  return (
                    <tr key={r.id} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.03))')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {idx < 3 && r.passed === 1 && <span style={{ marginRight: 4 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>}
                        {r.student_name}
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13 }}>{r.roll}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 600, fontSize: 13 }}>{r.total_obtained}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>{r.total_full}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{Math.round(r.overall_percent)}%</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        <span style={{ background: `${gc}18`, color: gc, fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 10, border: `1.5px solid ${gc}30` }}>{r.grade}</span>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 600, fontSize: 13, color: gc }}>{r.gpa}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: r.passed ? '#10b98118' : '#ef444418', color: r.passed ? '#10b981' : '#ef4444' }}>
                          {r.passed ? 'পাশ' : 'ফেল'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => setViewRow(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')} title="বিস্তারিত">
                            <Icon name="fa-eye" size={14} />
                          </button>
                          <button onClick={() => handlePrintMarksheet(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4, borderRadius: 4 }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#d4af37')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')} title="মার্কশিট প্রিন্ট">
                            <Icon name="fa-print" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewRow} onOpenChange={() => setViewRow(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="fa-scroll" size={16} style={{ color: '#8b5cf6' }} /> বিস্তারিত মার্কশিট
            </DialogTitle>
          </DialogHeader>
          {viewRow && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{viewRow.student_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>রোল: {viewRow.roll} | {viewRow.class_name} | {viewRow.exam_name}</div>
                </div>
                <button className="erp-btn erp-btn--ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handlePrintMarksheet(viewRow)}>
                  <Icon name="fa-print" size={12} /> প্রিন্ট
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="erp-table" style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 340 }}>
                  <thead>
                    <tr>
                      {['বিষয়', 'প্রাপ্ত', 'পূর্ণমান', 'পাশ নম্বর', 'গ্রেড', 'ফলাফল'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, borderBottom: '2px solid var(--border)', textAlign: h === 'বিষয়' ? 'left' : 'center' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewSubjects.map(sr => (
                      <tr key={sr.subject}>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>{sr.subject}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, fontSize: 13, color: sr.passed ? 'var(--text-primary)' : '#ef4444' }}>{sr.obtained}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>{sr.fullMarks}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{sr.passMarks}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                          <span style={{ color: gradeColor(sr.grade), fontWeight: 800, fontSize: 13 }}>{sr.grade}</span>
                        </td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontWeight: 700, color: sr.passed ? '#10b981' : '#ef4444', fontSize: 12 }}>
                          {sr.passed ? 'পাশ' : 'ফেল'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>মোট নম্বর:</span> <strong>{viewRow.total_obtained}/{viewRow.total_full}</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>শতকরা:</span> <strong>{Math.round(viewRow.overall_percent)}%</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>গ্রেড:</span> <strong style={{ color: gradeColor(viewRow.grade) }}>{viewRow.grade} ({viewRow.gpa})</strong></div>
                <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-secondary)' }}>ফলাফল:</span> <strong style={{ color: viewRow.passed ? '#10b981' : '#ef4444' }}>{viewRow.passed ? 'পাশ' : 'ফেল'}</strong></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
