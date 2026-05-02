// ============================================================
// i18n.ts — Bangla/English Translation System
// ফাইলটি src/lib/ ফোল্ডারে রাখুন
// ============================================================

export type Language = 'bn' | 'en';

export const translations = {
  // ── Navigation ──────────────────────────────────────────
  nav: {
    dashboard:         { bn: 'ড্যাশবোর্ড',           en: 'Dashboard' },
    students:          { bn: 'ছাত্র ব্যবস্থাপনা',     en: 'Students' },
    attendance:        { bn: 'উপস্থিতি',               en: 'Attendance' },
    studentAttendance: { bn: 'ছাত্র উপস্থিতি',         en: 'Student Attendance' },
    fees:              { bn: 'ফি ব্যবস্থাপনা',         en: 'Fee Management' },
    income:            { bn: 'আয়',                    en: 'Income' },
    expense:           { bn: 'ব্যয়',                   en: 'Expense' },
    salary:            { bn: 'বেতন',                   en: 'Salary' },
    cashbook:          { bn: 'ক্যাশবুক',               en: 'Cashbook' },
    exams:             { bn: 'পরীক্ষা',                en: 'Exams' },
    library:           { bn: 'লাইব্রেরি',              en: 'Library' },
    notices:           { bn: 'নোটিশ বোর্ড',            en: 'Notice Board' },
    reports:           { bn: 'রিপোর্ট',                en: 'Reports' },
    settings:          { bn: 'সেটিংস',                 en: 'Settings' },
    hostel:            { bn: 'হোস্টেল',                en: 'Hostel' },
    inventory:         { bn: 'ইনভেন্টরি',              en: 'Inventory' },
    hifzTracking:      { bn: 'হিফজ ট্র্যাকিং',        en: 'Hifz Tracking' },
    classRoutine:      { bn: 'ক্লাস রুটিন',            en: 'Class Routine' },
    syllabus:          { bn: 'সিলেবাস',                en: 'Syllabus' },
    assignments:       { bn: 'অ্যাসাইনমেন্ট',          en: 'Assignments' },
    idCard:            { bn: 'পরিচয় পত্র',             en: 'ID Card' },
    whatsapp:          { bn: 'হোয়াটসঅ্যাপ',           en: 'WhatsApp' },
    biometric:         { bn: 'বায়োমেট্রিক',            en: 'Biometric' },
  },

  // ── Common / Shared ──────────────────────────────────────
  common: {
    save:         { bn: 'সংরক্ষণ করুন',  en: 'Save' },
    cancel:       { bn: 'বাতিল',          en: 'Cancel' },
    delete:       { bn: 'মুছুন',          en: 'Delete' },
    edit:         { bn: 'সম্পাদনা',       en: 'Edit' },
    add:          { bn: 'যোগ করুন',       en: 'Add' },
    search:       { bn: 'অনুসন্ধান',      en: 'Search' },
    filter:       { bn: 'ফিল্টার',        en: 'Filter' },
    export:       { bn: 'রফতানি',         en: 'Export' },
    print:        { bn: 'প্রিন্ট',        en: 'Print' },
    loading:      { bn: 'লোড হচ্ছে...',   en: 'Loading...' },
    noData:       { bn: 'কোনো তথ্য নেই', en: 'No data found' },
    confirm:      { bn: 'নিশ্চিত করুন',  en: 'Confirm' },
    yes:          { bn: 'হ্যাঁ',          en: 'Yes' },
    no:           { bn: 'না',             en: 'No' },
    status:       { bn: 'অবস্থা',         en: 'Status' },
    action:       { bn: 'কার্যক্রম',      en: 'Action' },
    date:         { bn: 'তারিখ',          en: 'Date' },
    name:         { bn: 'নাম',            en: 'Name' },
    phone:        { bn: 'ফোন',            en: 'Phone' },
    email:        { bn: 'ইমেইল',          en: 'Email' },
    address:      { bn: 'ঠিকানা',         en: 'Address' },
    class:        { bn: 'শ্রেণী',          en: 'Class' },
    section:      { bn: 'শাখা',           en: 'Section' },
    roll:         { bn: 'রোল',            en: 'Roll' },
    total:        { bn: 'মোট',            en: 'Total' },
    amount:       { bn: 'পরিমাণ',         en: 'Amount' },
    submit:       { bn: 'জমা দিন',        en: 'Submit' },
    close:        { bn: 'বন্ধ করুন',      en: 'Close' },
    view:         { bn: 'দেখুন',          en: 'View' },
    download:     { bn: 'ডাউনলোড',        en: 'Download' },
    active:       { bn: 'সক্রিয়',         en: 'Active' },
    inactive:     { bn: 'নিষ্ক্রিয়',      en: 'Inactive' },
    all:          { bn: 'সকল',            en: 'All' },
    select:       { bn: 'নির্বাচন করুন', en: 'Select' },
    male:         { bn: 'পুরুষ',          en: 'Male' },
    female:       { bn: 'মহিলা',          en: 'Female' },
    present:      { bn: 'উপস্থিত',        en: 'Present' },
    absent:       { bn: 'অনুপস্থিত',      en: 'Absent' },
    late:         { bn: 'দেরিতে',         en: 'Late' },
  },

  // ── Dashboard ────────────────────────────────────────────
  dashboard: {
    title:          { bn: 'ড্যাশবোর্ড',          en: 'Dashboard' },
    totalStudents:  { bn: 'মোট ছাত্র',            en: 'Total Students' },
    totalStaff:     { bn: 'মোট কর্মী',            en: 'Total Staff' },
    monthlyIncome:  { bn: 'মাসিক আয়',             en: 'Monthly Income' },
    monthlyExpense: { bn: 'মাসিক ব্যয়',            en: 'Monthly Expense' },
    feeDue:         { bn: 'বকেয়া ফি',              en: 'Fee Due' },
    todayAttend:    { bn: 'আজকের উপস্থিতি',        en: "Today's Attendance" },
    recentActivity: { bn: 'সাম্প্রতিক কার্যক্রম', en: 'Recent Activity' },
    quickActions:   { bn: 'দ্রুত কার্যক্রম',       en: 'Quick Actions' },
  },

  // ── Students ─────────────────────────────────────────────
  students: {
    title:          { bn: 'ছাত্র তালিকা',      en: 'Student List' },
    addNew:         { bn: 'নতুন ছাত্র যোগ করুন', en: 'Add New Student' },
    studentId:      { bn: 'ছাত্র আইডি',         en: 'Student ID' },
    fatherName:     { bn: 'পিতার নাম',           en: "Father's Name" },
    motherName:     { bn: 'মাতার নাম',            en: "Mother's Name" },
    dob:            { bn: 'জন্ম তারিখ',          en: 'Date of Birth' },
    bloodGroup:     { bn: 'রক্তের গ্রুপ',         en: 'Blood Group' },
    religion:       { bn: 'ধর্ম',                en: 'Religion' },
    admissionDate:  { bn: 'ভর্তির তারিখ',         en: 'Admission Date' },
    admissionNo:    { bn: 'ভর্তি নম্বর',           en: 'Admission No' },
    guardianName:   { bn: 'অভিভাবকের নাম',         en: "Guardian's Name" },
    guardianPhone:  { bn: 'অভিভাবকের ফোন',         en: "Guardian's Phone" },
    monthlyFee:     { bn: 'মাসিক বেতন',           en: 'Monthly Fee' },
    profile:        { bn: 'ছাত্র প্রোফাইল',       en: 'Student Profile' },
    edit:           { bn: 'তথ্য সম্পাদনা',         en: 'Edit Info' },
    searchPlaceholder: { bn: 'নাম, আইডি বা রোল দিয়ে খুঁজুন', en: 'Search by name, ID or roll' },
  },

  // ── Fees ─────────────────────────────────────────────────
  fees: {
    title:        { bn: 'ফি ব্যবস্থাপনা',   en: 'Fee Management' },
    collect:      { bn: 'ফি সংগ্রহ',         en: 'Collect Fee' },
    structure:    { bn: 'ফি কাঠামো',          en: 'Fee Structure' },
    due:          { bn: 'বকেয়া তালিকা',      en: 'Due List' },
    transactions: { bn: 'লেনদেন',             en: 'Transactions' },
    receipt:      { bn: 'রসিদ',               en: 'Receipt' },
    month:        { bn: 'মাস',                en: 'Month' },
    year:         { bn: 'বছর',                en: 'Year' },
    paid:         { bn: 'পরিশোধিত',           en: 'Paid' },
    unpaid:       { bn: 'অপরিশোধিত',          en: 'Unpaid' },
    partial:      { bn: 'আংশিক',              en: 'Partial' },
    discount:     { bn: 'ছাড়',               en: 'Discount' },
    fine:         { bn: 'জরিমানা',             en: 'Fine' },
    paymentDate:  { bn: 'পেমেন্টের তারিখ',    en: 'Payment Date' },
    collectedBy:  { bn: 'সংগ্রহকারী',          en: 'Collected By' },
    reminder:     { bn: 'রিমাইন্ডার',          en: 'Reminder' },
  },

  // ── Attendance ───────────────────────────────────────────
  attendance: {
    title:       { bn: 'উপস্থিতি',        en: 'Attendance' },
    mark:        { bn: 'উপস্থিতি নিন',    en: 'Mark Attendance' },
    history:     { bn: 'উপস্থিতির ইতিহাস', en: 'Attendance History' },
    calendar:    { bn: 'ক্যালেন্ডার',      en: 'Calendar' },
    report:      { bn: 'উপস্থিতি রিপোর্ট', en: 'Attendance Report' },
    percentage:  { bn: 'উপস্থিতির হার',    en: 'Attendance %' },
    workingDays: { bn: 'কার্যদিবস',        en: 'Working Days' },
  },

  // ── Exams ────────────────────────────────────────────────
  exams: {
    title:       { bn: 'পরীক্ষা ব্যবস্থাপনা', en: 'Exam Management' },
    create:      { bn: 'পরীক্ষা তৈরি',         en: 'Create Exam' },
    markEntry:   { bn: 'নম্বর এন্ট্রি',         en: 'Mark Entry' },
    results:     { bn: 'ফলাফল',                en: 'Results' },
    meritList:   { bn: 'মেধা তালিকা',           en: 'Merit List' },
    admitCard:   { bn: 'প্রবেশপত্র',            en: 'Admit Card' },
    marksheet:   { bn: 'মার্কশিট',              en: 'Marksheet' },
    routine:     { bn: 'পরীক্ষার রুটিন',         en: 'Exam Routine' },
    subject:     { bn: 'বিষয়',                 en: 'Subject' },
    fullMarks:   { bn: 'পূর্ণমান',              en: 'Full Marks' },
    passMarks:   { bn: 'পাশ মার্ক',             en: 'Pass Marks' },
    obtained:    { bn: 'প্রাপ্ত নম্বর',          en: 'Obtained Marks' },
    grade:       { bn: 'গ্রেড',                 en: 'Grade' },
    position:    { bn: 'অবস্থান',               en: 'Position' },
    pass:        { bn: 'পাশ',                   en: 'Pass' },
    fail:        { bn: 'ফেল',                   en: 'Fail' },
  },

  // ── Hifz Tracking ────────────────────────────────────────
  hifz: {
    title:          { bn: 'হিফজ ট্র্যাকিং',          en: 'Hifz Tracking' },
    subtitle:       { bn: 'কুরআন মুখস্থ অগ্রগতি পর্যবেক্ষণ', en: 'Quran Memorization Progress' },
    student:        { bn: 'ছাত্র',                    en: 'Student' },
    surah:          { bn: 'সূরা',                     en: 'Surah' },
    para:           { bn: 'পারা',                     en: 'Para' },
    page:           { bn: 'পৃষ্ঠা',                   en: 'Page' },
    startPage:      { bn: 'শুরুর পৃষ্ঠা',             en: 'Start Page' },
    endPage:        { bn: 'শেষ পৃষ্ঠা',               en: 'End Page' },
    memorized:      { bn: 'মুখস্থ করেছে',             en: 'Memorized' },
    revision:       { bn: 'পুনরাবৃত্তি',               en: 'Revision' },
    testDate:       { bn: 'পরীক্ষার তারিখ',            en: 'Test Date' },
    teacher:        { bn: 'শিক্ষক',                   en: 'Teacher' },
    quality:        { bn: 'মান',                       en: 'Quality' },
    excellent:      { bn: 'চমৎকার',                   en: 'Excellent' },
    good:           { bn: 'ভালো',                     en: 'Good' },
    average:        { bn: 'মাঝারি',                   en: 'Average' },
    needsWork:      { bn: 'উন্নতি দরকার',              en: 'Needs Work' },
    totalPages:     { bn: 'মোট পৃষ্ঠা (কুরআন: ৬০৪)', en: 'Total Pages (Quran: 604)' },
    completionPct:  { bn: 'সম্পন্নের হার',             en: 'Completion %' },
    addProgress:    { bn: 'অগ্রগতি যোগ করুন',         en: 'Add Progress' },
    progressReport: { bn: 'অগ্রগতি রিপোর্ট',           en: 'Progress Report' },
    hifzComplete:   { bn: 'হিফজ সম্পন্ন!',            en: 'Hifz Complete!' },
    notes:          { bn: 'মন্তব্য',                  en: 'Notes' },
    pagesMemorized: { bn: 'মুখস্থকৃত পৃষ্ঠা সংখ্যা',  en: 'Pages Memorized' },
    assignTeacher:  { bn: 'শিক্ষক নিয়োগ',             en: 'Assign Teacher' },
    dailyTarget:    { bn: 'দৈনিক লক্ষ্য (পৃষ্ঠা)',    en: 'Daily Target (pages)' },
    lastRevision:   { bn: 'সর্বশেষ পুনরাবৃত্তি',       en: 'Last Revision' },
  },

  // ── SMS ──────────────────────────────────────────────────
  sms: {
    title:        { bn: 'SMS সেটিংস',             en: 'SMS Settings' },
    gateway:      { bn: 'SMS গেটওয়ে',             en: 'SMS Gateway' },
    apiKey:       { bn: 'API কী',                  en: 'API Key' },
    senderId:     { bn: 'প্রেরকের আইডি',           en: 'Sender ID' },
    testSms:      { bn: 'পরীক্ষামূলক SMS পাঠান',   en: 'Send Test SMS' },
    balance:      { bn: 'ব্যালেন্স',               en: 'Balance' },
    checkBalance: { bn: 'ব্যালেন্স দেখুন',          en: 'Check Balance' },
    template:     { bn: 'SMS টেমপ্লেট',            en: 'SMS Template' },
    feeReminder:  { bn: 'বকেয়া ফি রিমাইন্ডার',     en: 'Fee Due Reminder' },
    attendance:   { bn: 'অনুপস্থিতি সতর্কতা',      en: 'Absent Alert' },
    examResult:   { bn: 'পরীক্ষার ফলাফল',           en: 'Exam Result' },
    sendSms:      { bn: 'SMS পাঠান',               en: 'Send SMS' },
    recipient:    { bn: 'প্রাপক',                  en: 'Recipient' },
    message:      { bn: 'বার্তা',                  en: 'Message' },
    sent:         { bn: 'পাঠানো হয়েছে',            en: 'Sent' },
    failed:       { bn: 'ব্যর্থ',                  en: 'Failed' },
    history:      { bn: 'SMS ইতিহাস',              en: 'SMS History' },
  },

  // ── Settings ─────────────────────────────────────────────
  settings: {
    title:          { bn: 'সেটিংস',                en: 'Settings' },
    profile:        { bn: 'প্রতিষ্ঠানের প্রোফাইল',  en: 'Institution Profile' },
    branding:       { bn: 'ব্র্যান্ডিং',            en: 'Branding' },
    academic:       { bn: 'একাডেমিক',               en: 'Academic' },
    notifications:  { bn: 'নোটিফিকেশন',             en: 'Notifications' },
    theme:          { bn: 'থিম',                    en: 'Theme' },
    account:        { bn: 'আমার প্রোফাইল',           en: 'My Profile' },
    users:          { bn: 'ইউজার ব্যবস্থাপনা',       en: 'User Management' },
    language:       { bn: 'ভাষা',                   en: 'Language' },
    selectLanguage: { bn: 'ভাষা নির্বাচন করুন',      en: 'Select Language' },
    bangla:         { bn: 'বাংলা',                  en: 'Bangla' },
    english:        { bn: 'English',                en: 'English' },
  },

  // ── Salary ───────────────────────────────────────────────
  salary: {
    title:     { bn: 'বেতন ব্যবস্থাপনা', en: 'Salary Management' },
    staff:     { bn: 'কর্মী',            en: 'Staff' },
    basic:     { bn: 'মূল বেতন',         en: 'Basic Salary' },
    allowance: { bn: 'ভাতা',             en: 'Allowance' },
    deduction: { bn: 'কর্তন',            en: 'Deduction' },
    netSalary: { bn: 'নিট বেতন',          en: 'Net Salary' },
    month:     { bn: 'মাস',              en: 'Month' },
    pay:       { bn: 'বেতন দিন',          en: 'Pay Salary' },
    slip:      { bn: 'বেতন স্লিপ',        en: 'Salary Slip' },
    advance:   { bn: 'অগ্রিম',            en: 'Advance' },
    leave:     { bn: 'ছুটি',              en: 'Leave' },
  },

  // ── Library ──────────────────────────────────────────────
  library: {
    title:       { bn: 'লাইব্রেরি',      en: 'Library' },
    books:       { bn: 'বই তালিকা',      en: 'Book List' },
    issue:       { bn: 'বই ইস্যু',       en: 'Issue Book' },
    return:      { bn: 'বই ফেরত',        en: 'Return Book' },
    history:     { bn: 'ধার ইতিহাস',     en: 'Borrow History' },
    bookName:    { bn: 'বইয়ের নাম',       en: 'Book Name' },
    author:      { bn: 'লেখক',           en: 'Author' },
    isbn:        { bn: 'ISBN',           en: 'ISBN' },
    category:    { bn: 'বিভাগ',          en: 'Category' },
    available:   { bn: 'পাওয়া যাচ্ছে',   en: 'Available' },
    issued:      { bn: 'ইস্যুকৃত',       en: 'Issued' },
    dueDate:     { bn: 'ফেরতের তারিখ',   en: 'Due Date' },
    overdue:     { bn: 'মেয়াদোত্তীর্ণ', en: 'Overdue' },
  },
} as const;

// ── Helper Function ──────────────────────────────────────────
export type TranslationKey = keyof typeof translations;

export function t(
  section: TranslationKey,
  key: string,
  lang: Language
): string {
  const sec = translations[section] as Record<string, { bn: string; en: string }>;
  return sec?.[key]?.[lang] ?? key;
}

// ── Month Names ──────────────────────────────────────────────
export const monthNames = {
  bn: ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

// ── Number Conversion (Bangla digits) ────────────────────────
export function toBanglaNumber(num: number | string): string {
  const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/[0-9]/g, d => banglaDigits[parseInt(d)]);
}

export function toEnglishNumber(num: string): string {
  const map: Record<string, string> = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
  return num.replace(/[০-৯]/g, d => map[d] || d);
}

// ── Surah Names (for Hifz module) ────────────────────────────
export const surahNames = [
  { number: 1,  bn: 'আল-ফাতিহা',      en: 'Al-Fatiha',      pages: 1  },
  { number: 2,  bn: 'আল-বাকারা',       en: 'Al-Baqara',      pages: 49 },
  { number: 3,  bn: 'আল-ইমরান',        en: 'Al-Imran',       pages: 30 },
  { number: 4,  bn: 'আন-নিসা',         en: 'An-Nisa',        pages: 29 },
  { number: 5,  bn: 'আল-মায়েদা',       en: 'Al-Maida',       pages: 24 },
  { number: 6,  bn: 'আল-আনআম',         en: 'Al-Anam',        pages: 29 },
  { number: 7,  bn: 'আল-আরাফ',         en: 'Al-Araf',        pages: 31 },
  { number: 8,  bn: 'আল-আনফাল',        en: 'Al-Anfal',       pages: 10 },
  { number: 9,  bn: 'আত-তাওবা',        en: 'At-Tawba',       pages: 23 },
  { number: 10, bn: 'ইউনুস',           en: 'Yunus',          pages: 18 },
  { number: 11, bn: 'হুদ',             en: 'Hud',            pages: 19 },
  { number: 12, bn: 'ইউসুফ',           en: 'Yusuf',          pages: 17 },
  { number: 13, bn: 'আর-রাদ',          en: 'Ar-Rad',         pages: 8  },
  { number: 14, bn: 'ইব্রাহিম',        en: 'Ibrahim',        pages: 8  },
  { number: 15, bn: 'আল-হিজর',         en: 'Al-Hijr',        pages: 7  },
  { number: 16, bn: 'আন-নাহল',         en: 'An-Nahl',        pages: 16 },
  { number: 17, bn: 'আল-ইসরা',         en: 'Al-Isra',        pages: 15 },
  { number: 18, bn: 'আল-কাহফ',         en: 'Al-Kahf',        pages: 12 },
  { number: 19, bn: 'মারইয়াম',         en: 'Maryam',         pages: 8  },
  { number: 20, bn: 'তোয়া-হা',         en: 'Ta-Ha',          pages: 13 },
  { number: 21, bn: 'আল-আম্বিয়া',      en: 'Al-Anbiya',      pages: 12 },
  { number: 22, bn: 'আল-হজ্জ',         en: 'Al-Hajj',        pages: 13 },
  { number: 23, bn: 'আল-মুমিনুন',      en: 'Al-Muminun',     pages: 12 },
  { number: 24, bn: 'আন-নূর',          en: 'An-Nur',         pages: 12 },
  { number: 25, bn: 'আল-ফুরকান',       en: 'Al-Furqan',      pages: 9  },
  { number: 26, bn: 'আশ-শুআরা',        en: 'Ash-Shuara',     pages: 12 },
  { number: 27, bn: 'আন-নামল',         en: 'An-Naml',        pages: 11 },
  { number: 28, bn: 'আল-কাসাস',        en: 'Al-Qasas',       pages: 13 },
  { number: 29, bn: 'আল-আনকাবুত',      en: 'Al-Ankabut',     pages: 10 },
  { number: 30, bn: 'আর-রুম',          en: 'Ar-Rum',         pages: 9  },
  { number: 36, bn: 'ইয়া-সীন',         en: 'Ya-Sin',         pages: 7  },
  { number: 44, bn: 'আদ-দুখান',        en: 'Ad-Dukhan',      pages: 4  },
  { number: 55, bn: 'আর-রাহমান',       en: 'Ar-Rahman',      pages: 4  },
  { number: 56, bn: 'আল-ওয়াকিয়া',     en: 'Al-Waqia',       pages: 5  },
  { number: 67, bn: 'আল-মুলক',         en: 'Al-Mulk',        pages: 3  },
  { number: 78, bn: 'আন-নাবা',         en: 'An-Naba',        pages: 2  },
  { number: 99, bn: 'আয-যিলযাল',       en: 'Az-Zalzala',     pages: 1  },
  { number: 112,bn: 'আল-ইখলাস',        en: 'Al-Ikhlas',      pages: 1  },
  { number: 113,bn: 'আল-ফালাক',        en: 'Al-Falaq',       pages: 1  },
  { number: 114,bn: 'আন-নাস',          en: 'An-Nas',         pages: 1  },
];
