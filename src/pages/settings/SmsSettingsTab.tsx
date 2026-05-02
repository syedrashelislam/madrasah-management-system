// ============================================================
// SmsSettingsTab.tsx — SMS সেটিংস কম্পোনেন্ট
// Settings.tsx ফাইলে import করে যোগ করুন
// ============================================================
// Settings.tsx এ যোগ করার নিয়ম:
//   1. এই ফাইলটি src/pages/settings/ ফোল্ডারে রাখুন
//   2. Settings.tsx এ import করুন:
//      import SmsSettingsTab from './settings/SmsSettingsTab';
//   3. type SettingsTab এ 'sms' যোগ করুন
//   4. Button ও render যোগ করুন (নিচে দেখুন)
// ============================================================

import React, { useState, useEffect } from 'react';
import { useSettings, useUpdateSetting } from '@/hooks/useSettings';
import { toast } from 'sonner';
import Icon from '@/components/Icon';
import {
  sendSms,
  checkSmsBalance,
  type SmsGateway,
  type SmsConfig,
  smsTemplates,
  type SmsType,
} from '@/lib/smsService';

const SMS_GATEWAYS: Array<{ value: SmsGateway; label: string; desc: string }> = [
  { value: 'greenweb',   label: 'Green Web BD',  desc: 'সবচেয়ে সস্তা, বাংলাদেশে জনপ্রিয়' },
  { value: 'sslwireless',label: 'SSL Wireless',  desc: 'নির্ভরযোগ্য, কর্পোরেট পছন্দ' },
  { value: 'bulksmsbd',  label: 'BulkSMSBD',     desc: 'কম খরচে বাল্ক SMS' },
  { value: 'twilio',     label: 'Twilio',         desc: 'আন্তর্জাতিক, বেশি খরচ' },
];

export default function SmsSettingsTab() {
  const { data: settings = [], isLoading } = useSettings();
  const updateSetting = useUpdateSetting();

  const [config, setConfig] = useState<SmsConfig>({
    gateway: 'greenweb',
    apiKey: '',
    senderId: '',
    accountSid: '',
    authToken: '',
  });
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('আস-সালামু আলাইকুম! এটি একটি পরীক্ষামূলক SMS।');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<SmsType>('fee_reminder');

  useEffect(() => {
    if (settings.length === 0) return;
    const g = (k: string) => settings.find(s => s.key === k)?.value ?? '';
    setConfig({
      gateway: (g('sms_gateway') as SmsGateway) || 'greenweb',
      apiKey: g('sms_api_key'),
      senderId: g('sms_sender_id'),
      accountSid: g('sms_account_sid'),
      authToken: g('sms_auth_token'),
    });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: 'sms_gateway',     value: config.gateway }),
        updateSetting.mutateAsync({ key: 'sms_api_key',     value: config.apiKey }),
        updateSetting.mutateAsync({ key: 'sms_sender_id',   value: config.senderId }),
        updateSetting.mutateAsync({ key: 'sms_account_sid', value: config.accountSid ?? '' }),
        updateSetting.mutateAsync({ key: 'sms_auth_token',  value: config.authToken ?? '' }),
      ]);
      toast.success('SMS সেটিংস সংরক্ষিত হয়েছে');
    } catch {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে');
    }
    setSaving(false);
  };

  const handleTestSms = async () => {
    if (!testPhone) return toast.error('ফোন নম্বর দিন');
    if (!config.apiKey) return toast.error('API কী দিন');
    setSending(true);
    const result = await sendSms(testPhone, testMsg, config, 'general');
    if (result.success) {
      toast.success('পরীক্ষামূলক SMS পাঠানো হয়েছে!');
    } else {
      toast.error(`SMS পাঠানো ব্যর্থ: ${result.error}`);
    }
    setSending(false);
  };

  const handleCheckBalance = async () => {
    if (!config.apiKey) return toast.error('আগে API কী দিন ও সংরক্ষণ করুন');
    setCheckingBalance(true);
    const bal = await checkSmsBalance(config);
    setBalance(bal);
    setCheckingBalance(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
    color: '#fff', fontSize: 13, boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block',
  };
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16,
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>লোড হচ্ছে...</div>;

  return (
    <div>
      {/* Gateway Selection */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
          <Icon name="fa-sms" /> SMS গেটওয়ে নির্বাচন
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 16 }}>
          {SMS_GATEWAYS.map(gw => (
            <button key={gw.value}
              onClick={() => setConfig(c => ({ ...c, gateway: gw.value }))}
              style={{
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${config.gateway === gw.value ? '#d4af37' : 'rgba(255,255,255,0.1)'}`,
                background: config.gateway === gw.value ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)',
                textAlign: 'left', transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: config.gateway === gw.value ? '#d4af37' : '#fff', marginBottom: 3 }}>
                {config.gateway === gw.value && '✓ '}{gw.label}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{gw.desc}</div>
            </button>
          ))}
        </div>

        {/* API Credentials */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>API কী / Token *</label>
            <input type="password" value={config.apiKey}
              onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
              placeholder="আপনার API কী..."
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Sender ID (প্রেরকের নাম)</label>
            <input type="text" value={config.senderId}
              onChange={e => setConfig(c => ({ ...c, senderId: e.target.value }))}
              placeholder="যেমন: MADRASA"
              style={inputStyle} />
          </div>

          {config.gateway === 'twilio' && (
            <>
              <div>
                <label style={labelStyle}>Account SID (Twilio)</label>
                <input type="text" value={config.accountSid ?? ''}
                  onChange={e => setConfig(c => ({ ...c, accountSid: e.target.value }))}
                  placeholder="ACxxxxxxxx..."
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Auth Token (Twilio)</label>
                <input type="password" value={config.authToken ?? ''}
                  onChange={e => setConfig(c => ({ ...c, authToken: e.target.value }))}
                  placeholder="Twilio Auth Token..."
                  style={inputStyle} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-gold" onClick={handleSave} disabled={saving} style={{ fontSize: 13 }}>
            {saving ? <><Icon name="fa-spinner fa-spin" /> সংরক্ষণ হচ্ছে...</> : <><Icon name="fa-save" /> সংরক্ষণ করুন</>}
          </button>
          <button className="btn-outline-gold" onClick={handleCheckBalance} disabled={checkingBalance} style={{ fontSize: 13 }}>
            {checkingBalance ? 'চেক হচ্ছে...' : <><Icon name="fa-wallet" /> ব্যালেন্স দেখুন</>}
          </button>
          {balance && (
            <span style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: 13 }}>
              💰 {balance}
            </span>
          )}
        </div>
      </div>

      {/* Test SMS */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
          <Icon name="fa-paper-plane" /> পরীক্ষামূলক SMS পাঠান
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>ফোন নম্বর</label>
            <input type="tel" value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>বার্তা</label>
            <input type="text" value={testMsg}
              onChange={e => setTestMsg(e.target.value)}
              style={inputStyle} />
          </div>
        </div>
        <button className="btn-gold" onClick={handleTestSms} disabled={sending} style={{ marginTop: 12, fontSize: 13 }}>
          {sending ? <><Icon name="fa-spinner fa-spin" /> পাঠানো হচ্ছে...</> : <><Icon name="fa-paper-plane" /> পরীক্ষামূলক SMS পাঠান</>}
        </button>
      </div>

      {/* SMS Templates */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d4af37', marginBottom: 16 }}>
          <Icon name="fa-file-alt" /> SMS টেমপ্লেট
        </h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {(Object.keys(smsTemplates) as SmsType[]).map(type => (
            <button key={type}
              onClick={() => setActiveTemplate(type)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${activeTemplate === type ? '#d4af37' : 'rgba(255,255,255,0.15)'}`,
                background: activeTemplate === type ? 'rgba(212,175,55,0.2)' : 'transparent',
                color: activeTemplate === type ? '#d4af37' : 'rgba(255,255,255,0.6)',
              }}>
              {type === 'fee_reminder' ? 'বকেয়া ফি'
                : type === 'absent_alert' ? 'অনুপস্থিতি'
                : type === 'exam_result' ? 'পরীক্ষার ফলাফল'
                : type === 'admission' ? 'ভর্তি নিশ্চিতকরণ'
                : type === 'hifz_progress' ? 'হিফজ অগ্রগতি'
                : 'সাধারণ'}
            </button>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 14 }}>
          <p style={{ fontSize: 12, color: '#d4af37', marginBottom: 8 }}>বাংলা টেমপ্লেট:</p>
          <pre style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
            {smsTemplates[activeTemplate].bn}
          </pre>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
          {'⚠️ {student_name}, {amount} ইত্যাদি স্বয়ংক্রিয়ভাবে প্রতিস্থাপিত হয়'}
        </p>
      </div>

      {/* Setup Guide */}
      <div style={{ ...cardStyle, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.06)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', marginBottom: 12 }}>
          <Icon name="fa-info-circle" /> Green Web BD সেটআপ গাইড
        </h3>
        <ol style={{ paddingLeft: 20, color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 2 }}>
          <li><a href="https://greenweb.com.bd" target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>greenweb.com.bd</a> এ রেজিস্ট্রেশন করুন</li>
          <li>SMS ক্রেডিট কিনুন (১ টাকায় প্রায় ১ SMS)</li>
          <li>API Settings থেকে Token কপি করুন</li>
          <li>Sender ID অ্যাপ্রুভ করান (BTRC নিয়ম অনুযায়ী)</li>
          <li>উপরে API কী ও Sender ID বসিয়ে সংরক্ষণ করুন</li>
        </ol>
      </div>
    </div>
  );
}
