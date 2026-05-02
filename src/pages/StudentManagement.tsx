import { useState } from 'react';

const students = [
  { roll: '১০১', name: 'আবদুল্লাহ আল মাহমুদ', class: '৫ম', section: 'ক', contact: '০১৭১২৩৪৫৬৭৮', status: 'সক্রিয়' },
  { roll: '১০২', name: 'মুহাম্মদ ইব্রাহীম', class: '৬ষ্ঠ', section: 'খ', contact: '০১৮১২৩৪৫৬৭৮', status: 'সক্রিয়' },
  { roll: '১০৩', name: 'আহমেদ হাসান', class: '৭ম', section: 'ক', contact: '০১৫১২৩৪৫৬৭৮', status: 'সক্রিয়' },
  { roll: '১০৪', name: 'ফাহিম আহমেদ', class: '৮ম', section: 'খ', contact: '০১৬১২৩৪৫৬৭৮', status: 'নিষ্ক্রিয়' },
  { roll: '১০৫', name: 'রাফি ইসলাম', class: '৫ম', section: 'ক', contact: '০১৯১২৩৪৫৬৭৮', status: 'সক্রিয়' },
  { roll: '১০৬', name: 'তানভীর হোসেন', class: '৬ষ্ঠ', section: 'ক', contact: '০১৩১২৩৪৫৬৭৮', status: 'সক্রিয়' },
  { roll: '১০৭', name: 'সাইফুল ইসলাম', class: '৭ম', section: 'খ', contact: '০১৪১২৩৪৫৬৭৮', status: 'সক্রিয়' },
];

const EMPTY_FORM = { name: '', fatherName: '', classVal: '', section: '', roll: '', mobile: '', dob: '', address: '' };

const StudentManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const setField = (f: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }));
  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); };

  const filtered = students.filter(s => {
    const matchSearch = s.name.includes(search) || s.roll.includes(search);
    const matchClass = !classFilter || s.class === classFilter;
    return matchSearch && matchClass;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#d4af37' }}>
            <i className="fas fa-user-graduate" style={{ marginLeft: 8 }} /> ছাত্র ব্যবস্থাপনা
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>সকল ছাত্রের তথ্য দেখুন ও পরিচালনা করুন</p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}>
          <i className="fas fa-user-plus" /> নতুন ছাত্র ভর্তি
        </button>
      </div>

      {/* Filters */}
      <div className="content-box" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 14 }} />
          <input
            className="glass-input"
            style={{ paddingLeft: 40 }}
            placeholder="নাম বা রোল দিয়ে খুঁজুন..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="glass-select" style={{ flex: '0 1 180px' }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">সকল শ্রেণী</option>
          <option value="৫ম">৫ম শ্রেণী</option>
          <option value="৬ষ্ঠ">৬ষ্ঠ শ্রেণী</option>
          <option value="৭ম">৭ম শ্রেণী</option>
          <option value="৮ম">৮ম শ্রেণী</option>
        </select>
        <select className="glass-select" style={{ flex: '0 1 150px' }}>
          <option value="">সকল সেকশন</option>
          <option value="ক">সেকশন ক</option>
          <option value="খ">সেকশন খ</option>
        </select>
      </div>

      {/* Table */}
      <div className="content-box" style={{ overflowX: 'auto', padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>রোল</th>
              <th>নাম</th>
              <th>শ্রেণী</th>
              <th>সেকশন</th>
              <th>যোগাযোগ</th>
              <th>স্ট্যাটাস</th>
              <th style={{ textAlign: 'center' }}>একশন</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700, color: '#d4af37' }}>{s.roll}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fas fa-user" style={{ fontSize: 12, color: '#d4af37' }} />
                    </div>
                    {s.name}
                  </div>
                </td>
                <td>{s.class}</td>
                <td>{s.section}</td>
                <td style={{ direction: 'ltr', textAlign: 'right' }}>{s.contact}</td>
                <td>
                  <span className={s.status === 'সক্রিয়' ? 'badge-success' : 'badge-gold'}>{s.status}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button className="action-btn" title="দেখুন"><i className="fas fa-eye" /></button>
                    <button className="action-btn" title="সম্পাদনা"><i className="fas fa-edit" /></button>
                    <button className="action-btn" title="মুছুন"><i className="fas fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <i className="fas fa-search" style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
            কোনো ছাত্র পাওয়া যায়নি
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#d4af37' }}>
                <i className="fas fa-user-plus" style={{ marginRight: 8 }} /> নতুন ছাত্র ভর্তি
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>ছাত্রের নাম *</label>
                  <input className="glass-input" placeholder="পূর্ণ নাম লিখুন" value={form.name} onChange={setField('name')} autoComplete="off" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>পিতার নাম *</label>
                  <input className="glass-input" placeholder="পিতার নাম লিখুন" value={form.fatherName} onChange={setField('fatherName')} autoComplete="off" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>শ্রেণী *</label>
                  <select className="glass-select" value={form.classVal} onChange={setField('classVal')}>
                    <option value="">নির্বাচন করুন</option>
                    <option>৫ম</option><option>৬ষ্ঠ</option><option>৭ম</option><option>৮ম</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>সেকশন</label>
                  <select className="glass-select" value={form.section} onChange={setField('section')}>
                    <option value="">নির্বাচন করুন</option>
                    <option>ক</option><option>খ</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>রোল নম্বর</label>
                  <input className="glass-input" placeholder="রোল" value={form.roll} onChange={setField('roll')} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>মোবাইল নম্বর *</label>
                  <input className="glass-input" placeholder="০১XXXXXXXXX" value={form.mobile} onChange={setField('mobile')} type="tel" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>জন্ম তারিখ</label>
                  <input className="glass-input" type="date" value={form.dob} onChange={setField('dob')} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block', fontWeight: 600 }}>ঠিকানা</label>
                <input className="glass-input" placeholder="বর্তমান ঠিকানা লিখুন" value={form.address} onChange={setField('address')} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-outline-gold" onClick={closeModal}>বাতিল</button>
                <button className="btn-gold"><i className="fas fa-save" /> সংরক্ষণ করুন</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
