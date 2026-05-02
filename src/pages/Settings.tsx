import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import { useClasses, useAddClass, useUpdateClass, useDeleteClass } from '@/hooks/useClasses';
import { useSubjects, useAddSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { useUserRole, AppRole, ALL_PAGES, PageKey, ROLE_PRESETS, PAGE_GROUPS, TEACHER_PRESETS, TeacherPresetKey } from '@/hooks/useUserRole';
import { useMaxUploadSize } from '@/hooks/useMaxUploadSize';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DataSectionSkeleton from '@/components/DataSectionSkeleton';

type SettingsTab = 'profile' | 'branding' | 'academic' | 'account' | 'users' | 'recycle' | 'api' | 'notifications' | 'student-portal';
const VALID_TABS: SettingsTab[] = ['profile','branding','academic','account','users','recycle','api','notifications','student-portal'];

/* ─── Shared mobile-first styles ─── */
const S = {
  card: {
    background: 'rgba(30,41,59,0.7)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: '20px 16px',
    marginBottom: 16,
  } as React.CSSProperties,
  cardHeader: {
    fontSize: 15, fontWeight: 700, color: '#d4af37',
    display: 'flex', alignItems: 'center', gap: 9,
    marginBottom: 18, paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  } as React.CSSProperties,
  label: {
    fontSize: 12, color: 'rgba(255,255,255,0.55)',
    marginBottom: 6, display: 'block', fontWeight: 600, letterSpacing: 0.3,
  } as React.CSSProperties,
  fieldGap: { display: 'grid', gap: 14 } as React.CSSProperties,
  saveBtn: { width: '100%', marginTop: 6 } as React.CSSProperties,
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 14px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 13,
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 8,
  } as React.CSSProperties,
};

/* ─── Toggle switch component ─── */
function Toggle({ on, onToggle, color = '#d4af37' }: { on: boolean; onToggle: () => void; color?: string }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? color : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'background 0.25s ease',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        left: on ? 25 : 3,
      }} />
    </button>
  );
}

/* ─── Section label row ─── */
function SectionLabel({ icon, label, desc }: { icon: string; label: string; desc?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: 'rgba(212,175,55,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={15} style={{ color: '#d4af37' }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', lineHeight: 1.3 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.4 }}>{desc}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN SETTINGS COMPONENT
════════════════════════════════════════════════ */
const Settings = () => {
  const { isSuperAdmin, isMember } = useUserRole();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SettingsTab | null;
  const initialTab = (tabFromUrl && VALID_TABS.includes(tabFromUrl)) ? tabFromUrl : (isMember ? 'account' : 'profile');
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  type TabDef = { key: SettingsTab; icon: string; label: string; show: boolean };
  const tabs: TabDef[] = [
    { key: 'profile',        icon: 'fa-building',       label: 'প্রোফাইল',     show: !isMember },
    { key: 'branding',       icon: 'fa-palette',         label: 'ব্র্যান্ডিং',  show: !isMember },
    { key: 'academic',       icon: 'fa-graduation-cap',  label: 'একাডেমিক',     show: !isMember },
    { key: 'api',            icon: 'fa-plug',             label: 'API',           show: !isMember },
    { key: 'notifications',  icon: 'fa-bell',             label: 'নোটিফিকেশন',  show: !isMember },
    { key: 'student-portal', icon: 'fa-user-graduate',   label: 'ছাত্র পোর্টাল',show: !isMember },
    { key: 'account',        icon: 'fa-user-circle',      label: 'আমার প্রোফাইল',show: true },
    { key: 'users',          icon: 'fa-users-cog',        label: 'ইউজার',         show: isSuperAdmin },
    { key: 'recycle',        icon: 'fa-trash-restore',    label: 'রিসাইকেল বিন', show: isSuperAdmin },
  ].filter(t => t.show);

  return (
    <div className="settings-page-mobile">
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#d4af37', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="fa-cog" /> সেটিংস
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, marginBottom: 0 }}>প্রতিষ্ঠানের তথ্য ও সিস্টেম সেটিংস</p>
      </div>

      {/* Mobile tab scroller */}
      <div className="settings-tab-scroll">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`settings-tab-btn${activeTab === t.key ? ' settings-tab-btn--active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <span className="settings-tab-ico"><Icon name={t.icon} size={17} /></span>
            <span className="settings-tab-lbl">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="settings-tab-content">
        {activeTab === 'profile'        && !isMember    && <ProfileTab />}
        {activeTab === 'branding'       && !isMember    && <BrandingTab />}
        {activeTab === 'academic'       && !isMember    && <AcademicTab />}
        {activeTab === 'api'            && !isMember    && <ApiSettingsTab />}
        {activeTab === 'notifications'  && !isMember    && <NotificationPreferencesTab />}
        {activeTab === 'student-portal' && !isMember    && <StudentPortalTab />}
        {activeTab === 'account'                        && <AccountTab />}
        {activeTab === 'users'          && isSuperAdmin && <UserManagementTab />}
        {activeTab === 'recycle'        && isSuperAdmin && <RecycleBinTab />}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   PROFILE TAB
════════════════════════════════════════════════ */
function ProfileTab() {
  const { data: settings = [], isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [form, setForm] = useState({ name:'', subtitle:'', address:'', phone:'', email:'', established:'', maxUploadKB:'', footerText:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      setForm({
        name:        settings.find(s => s.key === 'madrasa_name')?.value || '',
        subtitle:    settings.find(s => s.key === 'madrasa_subtitle')?.value || '',
        address:     settings.find(s => s.key === 'madrasa_address')?.value || '',
        phone:       settings.find(s => s.key === 'madrasa_phone')?.value || '',
        email:       settings.find(s => s.key === 'madrasa_email')?.value || '',
        established: settings.find(s => s.key === 'madrasa_established')?.value || '',
        maxUploadKB: settings.find(s => s.key === 'max_upload_size_kb')?.value || '500',
        footerText:  settings.find(s => s.key === 'login_footer_text')?.value || '© ২০২৫ মাদরাসা ERP সিস্টেম',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key:'madrasa_name',       value:form.name }),
        updateSetting.mutateAsync({ key:'madrasa_subtitle',   value:form.subtitle }),
        updateSetting.mutateAsync({ key:'madrasa_address',    value:form.address }),
        updateSetting.mutateAsync({ key:'madrasa_phone',      value:form.phone }),
        updateSetting.mutateAsync({ key:'madrasa_email',      value:form.email }),
        updateSetting.mutateAsync({ key:'madrasa_established',value:form.established }),
        updateSetting.mutateAsync({ key:'max_upload_size_kb', value:form.maxUploadKB }),
        updateSetting.mutateAsync({ key:'login_footer_text',  value:form.footerText }),
      ]);
      toast.success('সংরক্ষণ সফল হয়েছে');
    } catch { toast.error('সংরক্ষণ ব্যর্থ'); }
    setSaving(false);
  };

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={4} columns={1} /></div>;

  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-building" /> প্রতিষ্ঠানের তথ্য</h3>
        <div style={S.fieldGap}>
          <div><label style={S.label}>প্রতিষ্ঠানের নাম</label><input className="glass-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
          <div><label style={S.label}>সাব-টাইটেল</label><input className="glass-input" value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})} /></div>
          <div><label style={S.label}>প্রতিষ্ঠাকাল</label><input className="glass-input" value={form.established} onChange={e=>setForm({...form,established:e.target.value})} /></div>
          <div><label style={S.label}>ঠিকানা</label><input className="glass-input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
          <div><label style={S.label}>যোগাযোগ নম্বর</label><input className="glass-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
          <div><label style={S.label}>ইমেইল</label><input className="glass-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
          <div>
            <label style={S.label}>লগইন পেজের ফুটার টেক্সট <span style={{color:'rgba(255,255,255,0.3)',fontSize:11}}>(লগইন পেজের নিচে দেখা যাবে)</span></label>
            <input className="glass-input" value={form.footerText} onChange={e=>setForm({...form,footerText:e.target.value})} placeholder="© ২০২৫ মাদরাসা ERP সিস্টেম" />
          </div>
          <div><label style={S.label}>সর্বোচ্চ আপলোড সাইজ (KB)</label><input type="number" className="glass-input" value={form.maxUploadKB} onChange={e=>setForm({...form,maxUploadKB:e.target.value})} /></div>
          <button className="btn-gold" style={S.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সংরক্ষণ করুন</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   BRANDING TAB
════════════════════════════════════════════════ */
function BrandingTab() {
  const { data: settings = [], isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { validateFile } = useMaxUploadSize();
  const [form, setForm] = useState({ reportHeader:'', reportFooter:'' });
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      setForm({
        reportHeader: settings.find(s => s.key === 'report_header_text')?.value || '',
        reportFooter: settings.find(s => s.key === 'report_footer_text')?.value || '',
      });
    }
  }, [settings]);

  const logoUrl = settings.find(s => s.key === 'madrasa_logo_url')?.value || '';

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!validateFile(file)) { e.target.value=''; return; }
    setLogoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `logos/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file, { upsert:true });
      if (uploadError) throw uploadError;
      const { data:{ publicUrl } } = supabase.storage.from('uploads').getPublicUrl(filePath);
      await updateSetting.mutateAsync({ key:'madrasa_logo_url', value:publicUrl });
      toast.success('লোগো আপলোড হয়েছে');
    } catch (error:any) { toast.error(error?.message || 'লোগো আপলোড ব্যর্থ'); }
    setLogoUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key:'report_header_text', value:form.reportHeader }),
        updateSetting.mutateAsync({ key:'report_footer_text', value:form.reportFooter }),
      ]);
      toast.success('ব্র্যান্ডিং সেটিংস সংরক্ষিত হয়েছে');
    } catch { toast.error('সংরক্ষণ ব্যর্থ'); }
    setSaving(false);
  };

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={3} columns={1} /></div>;

  return (
    <div>
      {/* Logo upload */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-image" /> প্রতিষ্ঠানের লোগো</h3>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, textAlign:'center' }}>
          <div style={{ width:100, height:100, borderRadius:'50%', border:'3px solid rgba(212,175,55,0.4)', overflow:'hidden', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 6px rgba(212,175,55,0.08)' }}>
            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:44, color:'#d4af37', fontWeight:800 }}>م</span>}
          </div>
          <div style={{ width:'100%' }}>
            <label className="btn-gold" style={{ cursor:'pointer', display:'block', width:'100%', boxSizing:'border-box' }}>
              {logoUploading ? <><Icon name="fa-spinner fa-spin" /> আপলোড হচ্ছে...</> : <><Icon name="fa-upload" /> নতুন লোগো আপলোড</>}
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:'none' }} />
            </label>
            <p style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:8, marginBottom:0 }}>প্রস্তাবিত: ২০০x২০০ পিক্সেল (PNG/JPG)</p>
          </div>
        </div>
      </div>

      {/* Report texts */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-file-alt" /> রিপোর্ট কাস্টমাইজেশন</h3>
        <div style={S.fieldGap}>
          <div>
            <label style={S.label}>রিপোর্টের হেডার টেক্সট (ঐচ্ছিক)</label>
            <textarea className="glass-input" style={{ minHeight:80, resize:'vertical' }} value={form.reportHeader} onChange={e=>setForm({...form,reportHeader:e.target.value})} placeholder="রিপোর্টের উপরে দেখা যাবে" />
          </div>
          <div>
            <label style={S.label}>রিপোর্টের ফুটার টেক্সট (ঐচ্ছিক)</label>
            <textarea className="glass-input" style={{ minHeight:80, resize:'vertical' }} value={form.reportFooter} onChange={e=>setForm({...form,reportFooter:e.target.value})} placeholder="রিপোর্টের একদম নিচে দেখা যাবে" />
          </div>
          <button className="btn-gold" style={S.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সংরক্ষণ করুন</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ACADEMIC TAB
════════════════════════════════════════════════ */
function AcademicTab() {
  const { data: classes=[], isLoading: loadingClasses } = useClasses();
  const addClass=useAddClass(); const updateClass=useUpdateClass(); const deleteClass=useDeleteClass();
  const { data: subjects=[], isLoading: loadingSubjects } = useSubjects();
  const addSubject=useAddSubject(); const updateSubject=useUpdateSubject(); const deleteSubject=useDeleteSubject();
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingClass, setEditingClass] = useState<{id:string;name:string}|null>(null);
  const [editingSubject, setEditingSubject] = useState<{id:string;name:string}|null>(null);

  const handleAddClass = async () => {
    if (!newClassName.trim()) { toast.error('শ্রেণীর নাম লিখুন'); return; }
    try {
      const maxId = classes.reduce((m, c) => Math.max(m, c.class_id), 0);
      await addClass.mutateAsync({ name: newClassName.trim(), class_id: maxId + 1, sort_order: maxId + 1 });
      setNewClassName('');
      toast.success('শ্রেণী যোগ হয়েছে ✓');
    } catch (e: any) { toast.error('শ্রেণী যোগ ব্যর্থ: ' + (e?.message || 'অজানা ত্রুটি')); }
  };
  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) { toast.error('বিষয়ের নাম লিখুন'); return; }
    try {
      const maxOrder = subjects.reduce((m, s) => Math.max(m, s.sort_order), 0);
      await addSubject.mutateAsync({ name: newSubjectName.trim(), sort_order: maxOrder + 1 });
      setNewSubjectName('');
      toast.success('বিষয় যোগ হয়েছে ✓');
    } catch (e: any) { toast.error('বিষয় যোগ ব্যর্থ: ' + (e?.message || 'অজানা ত্রুটি')); }
  };
  const handleSaveClass = async () => {
    if (!editingClass) return;
    try { await updateClass.mutateAsync({ id: editingClass.id, name: editingClass.name }); setEditingClass(null); toast.success('আপডেট হয়েছে'); }
    catch (e: any) { toast.error('আপডেট ব্যর্থ'); }
  };
  const handleSaveSubject = async () => {
    if (!editingSubject) return;
    try { await updateSubject.mutateAsync({ id: editingSubject.id, name: editingSubject.name }); setEditingSubject(null); toast.success('আপডেট হয়েছে'); }
    catch (e: any) { toast.error('আপডেট ব্যর্থ'); }
  };

  return (
    <div>
      {/* Classes */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-chalkboard" /> শ্রেণী ব্যবস্থাপনা</h3>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <input className="glass-input" placeholder="নতুন শ্রেণী যোগ করুন" value={newClassName} onChange={e=>setNewClassName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddClass()} style={{ flex:1 }} />
          <button className="btn-gold" style={{ flexShrink:0, padding:'0 16px' }} onClick={handleAddClass}><Icon name="fa-plus" /></button>
        </div>
        {loadingClasses ? <DataSectionSkeleton rows={3} columns={1} /> :
          classes.map(c=>(
            <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:8 }}>
              {editingClass?.id===c.id
                ? (<><input className="glass-input" value={editingClass.name} onChange={e=>setEditingClass({...editingClass,name:e.target.value})} style={{ flex:1 }} /><button className="action-btn" onClick={handleSaveClass}><Icon name="fa-check" /></button><button className="action-btn" onClick={()=>setEditingClass(null)}><Icon name="fa-times" /></button></>)
                : (<><span style={{ color:'rgba(255,255,255,0.82)', flex:1 }}>{c.name}</span><div style={{ display:'flex', gap:6 }}><button className="action-btn" onClick={()=>setEditingClass({id:c.id,name:c.name})}><Icon name="fa-edit" /></button><button className="action-btn" onClick={()=>{if(confirm('মুছতে চান?')){deleteClass.mutate(c.id);toast.success('মুছে ফেলা হয়েছে');}}}><Icon name="fa-trash" /></button></div></>)
              }
            </div>
          ))}
      </div>

      {/* Subjects */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-book" /> বিষয় ব্যবস্থাপনা</h3>
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <input className="glass-input" placeholder="নতুন বিষয় যোগ করুন" value={newSubjectName} onChange={e=>setNewSubjectName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddSubject()} style={{ flex:1 }} />
          <button className="btn-gold" style={{ flexShrink:0, padding:'0 16px' }} onClick={handleAddSubject}><Icon name="fa-plus" /></button>
        </div>
        {loadingSubjects ? <DataSectionSkeleton rows={3} columns={1} /> :
          subjects.map(s=>(
            <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', gap:8 }}>
              {editingSubject?.id===s.id
                ? (<><input className="glass-input" value={editingSubject.name} onChange={e=>setEditingSubject({...editingSubject,name:e.target.value})} style={{ flex:1 }} /><button className="action-btn" onClick={handleSaveSubject}><Icon name="fa-check" /></button><button className="action-btn" onClick={()=>setEditingSubject(null)}><Icon name="fa-times" /></button></>)
                : (<><span style={{ color:'rgba(255,255,255,0.82)', flex:1 }}>{s.name}</span><div style={{ display:'flex', gap:6 }}><button className="action-btn" onClick={()=>setEditingSubject({id:s.id,name:s.name})}><Icon name="fa-edit" /></button><button className="action-btn" onClick={()=>{if(confirm('মুছতে চান?')){deleteSubject.mutate(s.id);toast.success('মুছে ফেলা হয়েছে');}}}><Icon name="fa-trash" /></button></div></>)
              }
            </div>
          ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   API SETTINGS TAB
════════════════════════════════════════════════ */
function ApiSettingsTab() {
  const { data: settings=[], isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [smsForm, setSmsForm] = useState({ apiUrl:'', apiKey:'', apiSecret:'', senderId:'' });
  const [emailForm, setEmailForm] = useState({ smtpHost:'', smtpPort:'', smtpUsername:'', smtpPassword:'', senderEmail:'', senderName:'' });
  const [saving, setSaving] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testingSms, setTestingSms] = useState(false);

  useEffect(() => {
    if (settings.length > 0) {
      setSmsForm({ apiUrl:settings.find(s=>s.key==='sms_api_url')?.value||'', apiKey:settings.find(s=>s.key==='sms_api_key')?.value||'', apiSecret:settings.find(s=>s.key==='sms_api_secret')?.value||'', senderId:settings.find(s=>s.key==='sms_sender_id')?.value||'' });
      setEmailForm({ smtpHost:settings.find(s=>s.key==='smtp_host')?.value||'', smtpPort:settings.find(s=>s.key==='smtp_port')?.value||'', smtpUsername:settings.find(s=>s.key==='smtp_username')?.value||'', smtpPassword:settings.find(s=>s.key==='smtp_password')?.value||'', senderEmail:settings.find(s=>s.key==='smtp_sender_email')?.value||'', senderName:settings.find(s=>s.key==='smtp_sender_name')?.value||'' });
    }
  }, [settings]);

  const handleTestSms = async () => {
    if (!smsForm.apiUrl || !smsForm.apiKey) { toast.error('SMS API URL এবং API Key দিন'); return; }
    setTestingSms(true);
    try {
      const normalizedPhone = testPhone.replace(/[^0-9]/g,'');
      const bdPhone = normalizedPhone.startsWith('0') ? '88'+normalizedPhone : normalizedPhone.startsWith('88') ? normalizedPhone : '880'+normalizedPhone;
      const payload: Record<string,string> = { api_key:smsForm.apiKey, apikey:smsForm.apiKey, api_secret:smsForm.apiSecret, secretkey:smsForm.apiSecret, senderid:smsForm.senderId||'Madrasa', callerID:smsForm.senderId||'Madrasa', sender_id:smsForm.senderId||'Madrasa', number:bdPhone, toUser:bdPhone, to:bdPhone, contacts:bdPhone, message:'এটি একটি পরীক্ষামূলক SMS।', messageContent:'এটি একটি পরীক্ষামূলক SMS।', msg:'এটি একটি পরীক্ষামূলক SMS।', type:'text' };
      const response = await fetch(smsForm.apiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      if (response.ok) toast.success(`টেস্ট SMS পাঠানো হয়েছে (${testPhone})`);
      else { const text=await response.text().catch(()=>''); toast.error(`SMS ব্যর্থ: HTTP ${response.status} ${text.substring(0,80)}`); }
    } catch (err:any) { toast.error(`SMS ব্যর্থ: ${err?.message||'নেটওয়ার্ক সমস্যা'}`); }
    setTestingSms(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({key:'sms_api_url',value:smsForm.apiUrl}),
        updateSetting.mutateAsync({key:'sms_api_key',value:smsForm.apiKey}),
        updateSetting.mutateAsync({key:'sms_api_secret',value:smsForm.apiSecret}),
        updateSetting.mutateAsync({key:'sms_sender_id',value:smsForm.senderId}),
        updateSetting.mutateAsync({key:'smtp_host',value:emailForm.smtpHost}),
        updateSetting.mutateAsync({key:'smtp_port',value:emailForm.smtpPort}),
        updateSetting.mutateAsync({key:'smtp_username',value:emailForm.smtpUsername}),
        updateSetting.mutateAsync({key:'smtp_password',value:emailForm.smtpPassword}),
        updateSetting.mutateAsync({key:'smtp_sender_email',value:emailForm.senderEmail}),
        updateSetting.mutateAsync({key:'smtp_sender_name',value:emailForm.senderName}),
      ]);
      toast.success('API সেটিংস সংরক্ষণ সফল হয়েছে');
    } catch { toast.error('সংরক্ষণ ব্যর্থ'); }
    setSaving(false);
  };

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={4} columns={1} /></div>;

  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-sms" /> Bulk SMS API</h3>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:14, marginTop:-6 }}>BulkSMSBD, Onnorokom, Elitbuzz ইত্যাদি প্রোভাইডারের API তথ্য দিন।</p>
        <div style={S.fieldGap}>
          <div><label style={S.label}>API URL</label><input className="glass-input" value={smsForm.apiUrl} onChange={e=>setSmsForm({...smsForm,apiUrl:e.target.value})} placeholder="https://api.example.com/sms/send" /></div>
          <div><label style={S.label}>Sender ID</label><input className="glass-input" value={smsForm.senderId} onChange={e=>setSmsForm({...smsForm,senderId:e.target.value})} placeholder="MyMadrasa" /></div>
          <div><label style={S.label}>API Key</label><input className="glass-input" type="password" value={smsForm.apiKey} onChange={e=>setSmsForm({...smsForm,apiKey:e.target.value})} placeholder="আপনার API Key" /></div>
          <div><label style={S.label}>Secret Key</label><input className="glass-input" type="password" value={smsForm.apiSecret} onChange={e=>setSmsForm({...smsForm,apiSecret:e.target.value})} placeholder="আপনার Secret Key" /></div>
          <div>
            <label style={S.label}>টেস্ট SMS নম্বর</label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="glass-input" placeholder="01XXXXXXXXX" value={testPhone} onChange={e=>setTestPhone(e.target.value)} style={{ flex:1 }} />
              <button className="btn-outline-gold" style={{ flexShrink:0, whiteSpace:'nowrap' }} disabled={testingSms||!testPhone.trim()} onClick={handleTestSms}>
                {testingSms ? <Icon name="fa-spinner fa-spin" /> : <><Icon name="fa-paper-plane" /> টেস্ট</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-envelope" /> Email SMTP</h3>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:14, marginTop:-6 }}>Gmail SMTP, SendGrid, Mailgun ইত্যাদি কনফিগার করুন।</p>
        <div style={S.fieldGap}>
          <div><label style={S.label}>SMTP Host</label><input className="glass-input" value={emailForm.smtpHost} onChange={e=>setEmailForm({...emailForm,smtpHost:e.target.value})} placeholder="smtp.gmail.com" /></div>
          <div><label style={S.label}>SMTP Port</label><input className="glass-input" type="number" value={emailForm.smtpPort} onChange={e=>setEmailForm({...emailForm,smtpPort:e.target.value})} placeholder="587" /></div>
          <div><label style={S.label}>SMTP Username</label><input className="glass-input" value={emailForm.smtpUsername} onChange={e=>setEmailForm({...emailForm,smtpUsername:e.target.value})} placeholder="your@email.com" /></div>
          <div><label style={S.label}>SMTP Password</label><input className="glass-input" type="password" value={emailForm.smtpPassword} onChange={e=>setEmailForm({...emailForm,smtpPassword:e.target.value})} placeholder="আপনার SMTP পাসওয়ার্ড" /></div>
          <div><label style={S.label}>Sender Email</label><input className="glass-input" value={emailForm.senderEmail} onChange={e=>setEmailForm({...emailForm,senderEmail:e.target.value})} placeholder="noreply@madrasa.com" /></div>
          <div><label style={S.label}>Sender Name</label><input className="glass-input" value={emailForm.senderName} onChange={e=>setEmailForm({...emailForm,senderName:e.target.value})} placeholder="মাদরাসা ব্যবস্থাপনা" /></div>
        </div>
      </div>

      <button className="btn-gold" style={S.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সকল API সেটিংস সংরক্ষণ করুন</>}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   NOTIFICATION PREFERENCES TAB
════════════════════════════════════════════════ */
function NotificationPreferencesTab() {
  const { data: settings=[], isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ notify_fee_due:'true', notify_attendance:'true', notify_exam:'true', notify_notice:'true', notify_salary:'false', notify_email:'false', notify_sms:'false' });

  useEffect(() => {
    if (settings.length > 0) setPrefs(prev=>({ ...prev, ...Object.fromEntries(Object.keys(prev).map(k=>[k, settings.find(s=>s.key===k)?.value ?? (prev as any)[k]])) }));
  }, [settings]);

  const toggle = (key: keyof typeof prefs) => setPrefs(p=>({ ...p, [key]: p[key]==='true' ? 'false' : 'true' }));

  const handleSave = async () => {
    setSaving(true);
    try { await Promise.all(Object.entries(prefs).map(([key,value])=>updateSetting.mutateAsync({key,value}))); toast.success('নোটিফিকেশন সেটিংস সংরক্ষণ সফল হয়েছে'); }
    catch { toast.error('সংরক্ষণ ব্যর্থ হয়েছে'); }
    setSaving(false);
  };

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={4} columns={1} /></div>;

  const rows: {key:keyof typeof prefs;label:string;desc:string;icon:string}[] = [
    {key:'notify_fee_due',    label:'বকেয়া ফি রিমাইন্ডার',    desc:'মাসিক বকেয়া ফির জন্য অভিভাবকদের নোটিফিকেশন', icon:'fa-money-bill-wave'},
    {key:'notify_attendance', label:'অনুপস্থিত আলার্ট',         desc:'ছাত্র অনুপস্থিত থাকলে অভিভাবককে জানাও',       icon:'fa-clipboard-check'},
    {key:'notify_exam',       label:'পরীক্ষার রিমাইন্ডার',     desc:'পরীক্ষার আগের দিন জানাও',                       icon:'fa-file-alt'},
    {key:'notify_notice',     label:'নোটিশ বোর্ড আপডেট',       desc:'নতুন নোটিশ প্রকাশিত হলে জানাও',                icon:'fa-bullhorn'},
    {key:'notify_salary',     label:'বেতন নোটিফিকেশন',          desc:'স্টাফের বেতন প্রক্রিয়া হলে নোটিফাই করো',      icon:'fa-money-check-alt'},
  ];
  const channels: {key:keyof typeof prefs;label:string;icon:string}[] = [
    {key:'notify_email', label:'ইমেইল নোটিফিকেশন', icon:'fa-envelope'},
    {key:'notify_sms',   label:'SMS নোটিফিকেশন',   icon:'fa-sms'},
  ];

  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-bell" /> নোটিফিকেশন পছন্দ</h3>
        {rows.map(row=>(
          <div key={row.key} style={S.row}>
            <SectionLabel icon={row.icon} label={row.label} desc={row.desc} />
            <Toggle on={prefs[row.key]==='true'} onToggle={()=>toggle(row.key)} />
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-paper-plane" /> নোটিফিকেশন চ্যানেল</h3>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:12, marginTop:-6 }}>API সেটিংসে SMTP/SMS কনফিগার করুন।</p>
        {channels.map(ch=>(
          <div key={ch.key} style={S.row}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Icon name={ch.icon} size={16} style={{ color:'#60a5fa' }} />
              <span style={{ fontSize:14, fontWeight:500 }}>{ch.label}</span>
            </div>
            <Toggle on={prefs[ch.key]==='true'} onToggle={()=>toggle(ch.key)} color="#60a5fa" />
          </div>
        ))}
      </div>

      <button className="btn-gold" style={S.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সংরক্ষণ করুন</>}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   STUDENT PORTAL TAB
════════════════════════════════════════════════ */
function StudentPortalTab() {
  const { data: settings=[], isLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ student_portal_enabled:'true', student_portal_show_results:'true', student_portal_show_attendance:'true', student_portal_show_fee:'true', student_portal_show_routine:'true', student_portal_show_syllabus:'false', student_portal_welcome_msg:'আমাদের মাদ্রাসায় স্বাগতম!' });

  useEffect(() => {
    if (settings.length > 0) setForm(prev=>({ ...prev, ...Object.fromEntries(Object.keys(prev).map(k=>[k, settings.find(s=>s.key===k)?.value??(prev as any)[k]])) }));
  }, [settings]);

  const toggleBool = (key: keyof typeof form) => setForm(p=>({ ...p, [key]: p[key]==='true' ? 'false' : 'true' }));
  const handleSave = async () => {
    setSaving(true);
    try { await Promise.all(Object.entries(form).map(([key,value])=>updateSetting.mutateAsync({key,value}))); toast.success('ছাত্র পোর্টাল সেটিংস সংরক্ষিত হয়েছে'); }
    catch { toast.error('সংরক্ষণ ব্যর্থ'); }
    setSaving(false);
  };

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={4} columns={1} /></div>;

  const toggleRows: {key:keyof typeof form;label:string;icon:string}[] = [
    {key:'student_portal_show_results',    label:'পরীক্ষার ফলাফল',    icon:'fa-scroll'},
    {key:'student_portal_show_attendance', label:'হাজিরা রিপোর্ট',    icon:'fa-calendar-check'},
    {key:'student_portal_show_fee',        label:'ফি বিবরণী',          icon:'fa-hand-holding-usd'},
    {key:'student_portal_show_routine',    label:'ক্লাস রুটিন',        icon:'fa-clock'},
    {key:'student_portal_show_syllabus',   label:'সিলেবাস',             icon:'fa-book-open'},
  ];

  return (
    <div>
      {/* Master switch */}
      <div style={{ ...S.card, border: form.student_portal_enabled==='true' ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#d4af37', margin:'0 0 4px', display:'flex', alignItems:'center', gap:8 }}><Icon name="fa-user-graduate" /> ছাত্র পোর্টাল</h3>
            <p style={{ fontSize:12, color: form.student_portal_enabled==='true' ? '#34d399' : 'rgba(255,255,255,0.4)', margin:0 }}>
              {form.student_portal_enabled==='true' ? '✅ সক্রিয় — ছাত্ররা পোর্টাল ব্যবহার করতে পারছে' : '❌ নিষ্ক্রিয়'}
            </p>
          </div>
          <Toggle on={form.student_portal_enabled==='true'} onToggle={()=>toggleBool('student_portal_enabled')} color="#34d399" />
        </div>
      </div>

      {/* Welcome message */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-comment-alt" /> স্বাগত বার্তা</h3>
        <textarea className="glass-input" rows={3} value={form.student_portal_welcome_msg} onChange={e=>setForm(p=>({...p,student_portal_welcome_msg:e.target.value}))} placeholder="পোর্টালে প্রবেশের পর ছাত্রদের দেখানো বার্তা..." style={{ width:'100%', resize:'vertical', boxSizing:'border-box' }} />
      </div>

      {/* Access toggles */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-lock-open" /> পোর্টালে কী দেখাবে</h3>
        {toggleRows.map(row=>(
          <div key={row.key} style={S.row}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Icon name={row.icon} size={14} style={{ color:'#60a5fa' }} />
              <span style={{ fontSize:14, fontWeight:500 }}>{row.label}</span>
            </div>
            <Toggle on={form[row.key]==='true'} onToggle={()=>toggleBool(row.key)} />
          </div>
        ))}
      </div>

      <button className="btn-gold" style={S.saveBtn} onClick={handleSave} disabled={saving}>
        {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সংরক্ষণ করুন</>}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ACCOUNT TAB
════════════════════════════════════════════════ */
function AccountTab() {
  const { profile, updateProfile } = useUserProfile();
  const [form, setForm] = useState({ display_name:'', phone:'', address:'' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passForm, setPassForm] = useState({ next:'', confirm:'' });

  useEffect(() => {
    if (profile) setForm({ display_name:profile.display_name||'', phone:profile.phone||'', address:profile.address||'' });
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateProfile.mutateAsync(form); toast.success('প্রোফাইল সংরক্ষিত হয়েছে'); }
    catch (e:any) { toast.error(e?.message||'সংরক্ষণ ব্যর্থ'); }
    setSaving(false);
  };

  const handlePassChange = async () => {
    if (!passForm.next||passForm.next!==passForm.confirm) { toast.error('নতুন পাসওয়ার্ড মিলছে না'); return; }
    if (passForm.next.length<6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'); return; }
    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password:passForm.next });
      if (error) throw error;
      toast.success('পাসওয়ার্ড পরিবর্তন সফল হয়েছে');
      setPassForm({ next:'', confirm:'' });
    } catch (e:any) { toast.error(e?.message||'পাসওয়ার্ড পরিবর্তন ব্যর্থ'); }
    setChangingPass(false);
  };

  const initials = (form.display_name||profile?.email||'?').split(/[\s@]/).filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()).join('');

  return (
    <div>
      {/* Avatar header */}
      <div style={{ ...S.card, textAlign:'center' }}>
        <div style={{ width:86, height:86, borderRadius:'50%', background:'rgba(212,175,55,0.12)', border:'3px solid rgba(212,175,55,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:700, color:'#d4af37', margin:'0 auto 14px', boxShadow:'0 0 0 6px rgba(212,175,55,0.07)', overflow:'hidden' }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
        </div>
        <p style={{ fontSize:18, fontWeight:700, margin:'0 0 4px' }}>{form.display_name||'নাম সেট করুন'}</p>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0 }}>{profile?.email}</p>
      </div>

      {/* Profile form */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-user-edit" /> প্রোফাইল তথ্য</h3>
        <div style={S.fieldGap}>
          <div><label style={S.label}>পূর্ণ নাম</label><input className="glass-input" value={form.display_name} onChange={e=>setForm(p=>({...p,display_name:e.target.value}))} placeholder="আপনার নাম" /></div>
          <div><label style={S.label}>মোবাইল নম্বর</label><input className="glass-input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="01XXXXXXXXX" /></div>
          <div><label style={S.label}>ঠিকানা</label><input className="glass-input" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="আপনার ঠিকানা" /></div>
          <button className="btn-gold" style={S.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> প্রোফাইল সংরক্ষণ করুন</>}
          </button>
        </div>
      </div>

      {/* Password */}
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-lock" /> পাসওয়ার্ড পরিবর্তন</h3>
        <div style={S.fieldGap}>
          <div><label style={S.label}>নতুন পাসওয়ার্ড</label><input className="glass-input" type="password" value={passForm.next} onChange={e=>setPassForm(p=>({...p,next:e.target.value}))} placeholder="কমপক্ষে ৬ অক্ষর" /></div>
          <div><label style={S.label}>পাসওয়ার্ড নিশ্চিত করুন</label><input className="glass-input" type="password" value={passForm.confirm} onChange={e=>setPassForm(p=>({...p,confirm:e.target.value}))} placeholder="পুনরায় পাসওয়ার্ড লিখুন" /></div>
          <button className="btn-outline-gold" style={S.saveBtn} onClick={handlePassChange} disabled={changingPass}>
            {changingPass ? <><Icon name="fa-spinner fa-spin" /> পরিবর্তন হচ্ছে...</> : <><Icon name="fa-key" /> পাসওয়ার্ড পরিবর্তন করুন</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   USER MANAGEMENT TAB
════════════════════════════════════════════════ */
function UserManagementTab() {
  const queryClient = useQueryClient();
  // State for page-access editing panel
  const [editingUserId, setEditingUserId] = useState<string|null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const { data: users=[], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, role, allowed_pages, created_at');
      if (error) throw error;
      return data as { user_id:string; role:string; allowed_pages:string|null; created_at:string }[];
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ user_id, role }: {user_id:string;role:AppRole}) => {
      const { error } = await supabase.from('user_roles').update({role}).eq('user_id',user_id);
      if (error) throw error;
    },
    onSuccess: ()=>{ queryClient.invalidateQueries({queryKey:['all-users']}); toast.success('রোল আপডেট সফল হয়েছে'); },
    onError: ()=>toast.error('রোল আপডেট ব্যর্থ হয়েছে'),
  });

  const updatePages = useMutation({
    mutationFn: async ({ user_id, pages }: {user_id:string; pages:string[]}) => {
      const { error } = await supabase.from('user_roles').update({ allowed_pages: pages.join(',') }).eq('user_id', user_id);
      if (error) throw error;
    },
    onSuccess: ()=>{
      queryClient.invalidateQueries({queryKey:['all-users']});
      toast.success('পেজ অ্যাক্সেস আপডেট সফল হয়েছে');
      setEditingUserId(null);
    },
    onError: ()=>toast.error('পেজ অ্যাক্সেস আপডেট ব্যর্থ হয়েছে'),
  });

  const deleteUser = useMutation({
    mutationFn: async (user_id:string) => {
      const { error } = await supabase.from('user_roles').delete().eq('user_id',user_id);
      if (error) throw error;
    },
    onSuccess: ()=>{ queryClient.invalidateQueries({queryKey:['all-users']}); toast.success('ব্যবহারকারী মুছে ফেলা হয়েছে'); },
    onError: ()=>toast.error('মুছে ফেলা ব্যর্থ হয়েছে'),
  });

  const roleColors: Record<string,string> = { super_admin:'#d4af37', admin:'#60a5fa', teacher:'#34d399', member:'#a78bfa' };
  const roleLabels: Record<string,string>  = { super_admin:'সুপার এডমিন', admin:'এডমিন', teacher:'শিক্ষক', member:'সদস্য' };

  // Open page editor for a user
  const openPageEditor = (u: { user_id:string; allowed_pages:string|null; role:string }) => {
    const current = u.allowed_pages ? u.allowed_pages.split(',').map(p=>p.trim()).filter(Boolean) : [];
    setSelectedPages(current);
    setEditingUserId(u.user_id);
  };

  // Toggle a single page
  const togglePage = (key: string) => {
    setSelectedPages(prev => prev.includes(key) ? prev.filter(p=>p!==key) : [...prev, key]);
  };

  // Toggle all pages in a group
  const toggleGroup = (groupPages: readonly string[]) => {
    const allSelected = groupPages.every(p => selectedPages.includes(p));
    if (allSelected) {
      setSelectedPages(prev => prev.filter(p => !groupPages.includes(p)));
    } else {
      setSelectedPages(prev => [...new Set([...prev, ...groupPages])]);
    }
  };

  // Select all / deselect all
  const selectAll = () => setSelectedPages(ALL_PAGES.map(p=>p.key));
  const deselectAll = () => setSelectedPages([]);

  const editingUser = editingUserId ? users.find(u=>u.user_id===editingUserId) : null;

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={5} columns={1} /></div>;

  // ── Page Editor Panel ──
  if (editingUserId && editingUser) {
    return (
      <div>
        {/* Header */}
        <div style={{ ...S.card, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
            <button
              onClick={()=>setEditingUserId(null)}
              style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.13)', borderRadius:9, padding:'6px 12px', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
              <Icon name="fa-arrow-left" size={11} /> ফিরে যান
            </button>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontFamily:'monospace' }}>{editingUser.user_id.slice(0,8)}...</span>
            <span style={{ fontSize:12, fontWeight:700, color: roleColors[editingUser.role]||'#fff', background:'rgba(255,255,255,0.07)', padding:'3px 10px', borderRadius:20 }}>{roleLabels[editingUser.role]||editingUser.role}</span>
          </div>
          <h3 style={{ ...S.cardHeader, marginBottom:0, paddingBottom:0, border:'none', marginTop:10 }}>
            <Icon name="fa-shield-alt" /> পেজ অ্যাক্সেস নির্বাচন করুন
          </h3>
          <p style={{ fontSize:12, color:'rgba(255,255,255,0.42)', margin:'6px 0 0' }}>
            এই ইউজার কোন কোন পেজ দেখতে পারবে তা নির্বাচন করুন।
          </p>
        </div>

        {/* Select All / Deselect All */}
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button onClick={selectAll}
            style={{ flex:1, background:'rgba(212,175,55,0.13)', border:'1px solid rgba(212,175,55,0.3)', borderRadius:10, padding:'9px 0', color:'#d4af37', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <Icon name="fa-check-double" size={12} /> সব সিলেক্ট
          </button>
          <button onClick={deselectAll}
            style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'9px 0', color:'rgba(255,255,255,0.6)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            <Icon name="fa-times" size={12} /> সব বাদ
          </button>
        </div>

        {/* Page Groups */}
        {PAGE_GROUPS.map(group => {
          const groupPageKeys = group.pages as readonly string[];
          const allGroupSelected = groupPageKeys.every(p=>selectedPages.includes(p));
          const someGroupSelected = groupPageKeys.some(p=>selectedPages.includes(p));
          return (
            <div key={group.label} style={{ ...S.card, padding:'14px 14px', marginBottom:10 }}>
              {/* Group header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>{group.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color: allGroupSelected ? '#d4af37' : someGroupSelected ? '#fbbf24' : 'rgba(255,255,255,0.8)' }}>{group.label}</span>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.06)', padding:'2px 7px', borderRadius:10 }}>
                    {groupPageKeys.filter(p=>selectedPages.includes(p)).length}/{groupPageKeys.length}
                  </span>
                </div>
                <button
                  onClick={()=>toggleGroup(groupPageKeys)}
                  style={{ fontSize:11, padding:'5px 11px', borderRadius:8, cursor:'pointer', fontWeight:600,
                    background: allGroupSelected ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.06)',
                    border: allGroupSelected ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.1)',
                    color: allGroupSelected ? '#d4af37' : 'rgba(255,255,255,0.55)' }}>
                  {allGroupSelected ? 'সব বাদ' : 'সব নিন'}
                </button>
              </div>
              {/* Individual pages */}
              <div style={{ display:'grid', gap:6 }}>
                {groupPageKeys.map(pageKey => {
                  const pageInfo = ALL_PAGES.find(p=>p.key===pageKey);
                  if (!pageInfo) return null;
                  const isChecked = selectedPages.includes(pageKey);
                  return (
                    <div key={pageKey}
                      onClick={()=>togglePage(pageKey)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:10, cursor:'pointer',
                        background: isChecked ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(255,255,255,0.06)',
                        transition:'all 0.15s' }}>
                      {/* Checkbox */}
                      <div style={{ width:18, height:18, borderRadius:5, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                        background: isChecked ? '#d4af37' : 'rgba(255,255,255,0.08)',
                        border: isChecked ? '2px solid #d4af37' : '2px solid rgba(255,255,255,0.2)',
                        transition:'all 0.15s' }}>
                        {isChecked && <Icon name="fa-check" size={9} style={{ color:'#000' }} />}
                      </div>
                      <span style={{ fontSize:13, color: isChecked ? '#fff' : 'rgba(255,255,255,0.65)', fontWeight: isChecked ? 600 : 400 }}>
                        {pageInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Save Bar */}
        <div style={{ position:'sticky', bottom:16, padding:'0 0 8px' }}>
          <div style={{ background:'rgba(15,23,42,0.96)', border:'1px solid rgba(212,175,55,0.25)', borderRadius:14, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, backdropFilter:'blur(12px)' }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)', flex:1 }}>
              {selectedPages.length} টি পেজ সিলেক্ট করা হয়েছে
            </span>
            <button onClick={()=>setEditingUserId(null)}
              style={{ padding:'9px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.6)', fontSize:13, cursor:'pointer' }}>
              বাতিল
            </button>
            <button onClick={()=>updatePages.mutate({ user_id:editingUserId, pages:selectedPages })}
              disabled={updatePages.isPending}
              style={{ padding:'9px 20px', borderRadius:10, border:'none', background:'#d4af37', color:'#000', fontSize:13, fontWeight:700, cursor:'pointer', opacity: updatePages.isPending ? 0.7 : 1 }}>
              {updatePages.isPending ? '...' : '✓ সেভ করুন'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── User List ──
  return (
    <div>
      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-users-cog" /> ব্যবহারকারী তালিকা ({users.length} জন)</h3>
        {users.length===0 && (
          <div style={{ textAlign:'center', padding:40, color:'rgba(255,255,255,0.35)' }}>
            <Icon name="fa-users-slash" size={28} style={{ display:'block', margin:'0 auto 10px', opacity:0.4 }} />
            <p>কোনো ব্যবহারকারী পাওয়া যায়নি</p>
          </div>
        )}
        {users.map(u=>{
          const currentPages = u.allowed_pages ? u.allowed_pages.split(',').map(p=>p.trim()).filter(Boolean) : [];
          return (
            <div key={u.user_id} style={{ padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              {/* Row 1: ID + Date */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                <span style={{ fontFamily:'monospace', fontSize:12, color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', padding:'3px 8px', borderRadius:6 }}>
                  {u.user_id.slice(0,8)}...
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD') : '—'}
                </span>
              </div>
              {/* Row 2: Role + Delete */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <select value={u.role} onChange={e=>updateRole.mutate({user_id:u.user_id,role:e.target.value as AppRole})}
                  style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:9, color:roleColors[u.role]||'#fff', padding:'8px 10px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  {(['super_admin','admin','teacher','member'] as AppRole[]).map(r=>(
                    <option key={r} value={r} style={{ background:'#1E293B', color:roleColors[r] }}>{roleLabels[r]}</option>
                  ))}
                </select>
                <button className="btn-outline-gold" style={{ flexShrink:0, fontSize:12, padding:'8px 12px', color:'#f87171', borderColor:'rgba(248,113,113,0.35)' }}
                  onClick={()=>{ if(window.confirm('এই ব্যবহারকারীকে মুছে ফেলবেন?')) deleteUser.mutate(u.user_id); }}>
                  <Icon name="fa-trash" size={11} />
                </button>
              </div>
              {/* Row 3: Page Access Button */}
              <button
                onClick={()=>openPageEditor(u)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid rgba(212,175,55,0.25)', background:'rgba(212,175,55,0.07)', color:'#d4af37', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Icon name="fa-shield-alt" size={12} />
                  পেজ অ্যাক্সেস সেট করুন
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.08)', padding:'2px 8px', borderRadius:8 }}>
                  {currentPages.length} টি পেজ
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   RECYCLE BIN TAB
════════════════════════════════════════════════ */
function RecycleBinTab() {
  const queryClient = useQueryClient();

  const { data: deletedStudents=[], isLoading } = useQuery({
    queryKey: ['deleted-students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('id, name, class_id, admission_date, deleted_at').not('deleted_at','is',null).order('deleted_at',{ascending:false});
      if (error) throw error;
      return data as { id:string; name:string; class_id:string|null; admission_date:string|null; deleted_at:string }[];
    },
  });

  const restoreStudent = useMutation({
    mutationFn: async (id:string) => { const { error } = await supabase.from('students').update({deleted_at:null}).eq('id',id); if(error) throw error; },
    onSuccess: ()=>{ queryClient.invalidateQueries({queryKey:['deleted-students']}); queryClient.invalidateQueries({queryKey:['students']}); toast.success('পুনরুদ্ধার করা হয়েছে'); },
    onError: ()=>toast.error('পুনরুদ্ধার ব্যর্থ হয়েছে'),
  });

  const permanentDelete = useMutation({
    mutationFn: async (id:string) => { const { error } = await supabase.from('students').delete().eq('id',id); if(error) throw error; },
    onSuccess: ()=>{ queryClient.invalidateQueries({queryKey:['deleted-students']}); toast.success('স্থায়ীভাবে মুছে ফেলা হয়েছে'); },
    onError: ()=>toast.error('মুছে ফেলা ব্যর্থ হয়েছে'),
  });

  if (isLoading) return <div style={S.card}><DataSectionSkeleton rows={4} columns={1} /></div>;

  return (
    <div>
      <div style={{ ...S.card, background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.18)', display:'flex', alignItems:'flex-start', gap:10 }}>
        <Icon name="fa-exclamation-triangle" size={15} style={{ color:'#fbbf24', flexShrink:0, marginTop:2 }} />
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', margin:0, lineHeight:1.5 }}>রিসাইকেল বিনে থাকা আইটেম স্থায়ীভাবে মুছে গেলে পুনরুদ্ধার করা সম্ভব হবে না।</p>
      </div>

      <div style={S.card}>
        <h3 style={S.cardHeader}><Icon name="fa-user-graduate" /> মুছে ফেলা ছাত্র ({deletedStudents.length} জন)</h3>
        {deletedStudents.length===0 ? (
          <div style={{ padding:'30px 0', textAlign:'center', color:'rgba(255,255,255,0.3)' }}>
            <Icon name="fa-trash-alt" size={28} style={{ display:'block', margin:'0 auto 10px', opacity:0.35 }} />
            <p style={{ fontSize:14 }}>রিসাইকেল বিন খালি</p>
          </div>
        ) : deletedStudents.map(s=>(
          <div key={s.id} style={{ padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontWeight:600, fontSize:14 }}>{s.name}</span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{s.deleted_at ? new Date(s.deleted_at).toLocaleDateString('bn-BD') : '—'}</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-outline-gold" style={{ flex:1, fontSize:12 }} onClick={()=>restoreStudent.mutate(s.id)}>
                <Icon name="fa-undo" size={11} /> পুনরুদ্ধার
              </button>
              <button className="btn-outline-gold" style={{ flex:1, fontSize:12, color:'#f87171', borderColor:'rgba(248,113,113,0.35)' }}
                onClick={()=>{ if(window.confirm(`"${s.name}" কে স্থায়ীভাবে মুছে দেবেন?`)) permanentDelete.mutate(s.id); }}>
                <Icon name="fa-trash" size={11} /> স্থায়ী মুছুন
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Settings;
