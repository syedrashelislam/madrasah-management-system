import Icon from '@/components/Icon';

const Inventory = () => {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="fa-boxes" size={22} style={{ color: '#d4af37' }} />
          ইনভেন্টরি
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>প্রতিষ্ঠানের কেনাকাটা ও জিনিসপত্রের মজুদ</p>
      </div>

      <div className="erp-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <Icon name="fa-boxes" size={48} style={{ color: 'var(--accent)', opacity: 0.5 }} />
        <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
          শীঘ্রই আসছে
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          এই ফিচারটি খুব শীঘ্রই যুক্ত হবে। অনুগ্রহ করে অপেক্ষা করুন।
        </p>
      </div>
    </div>
  );
};

export default Inventory;
