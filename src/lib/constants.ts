export const MADRASA_NAME = "মাদরাসা ইআরপি প্রো";
export const MADRASA_ADDRESS = "ঢাকা, বাংলাদেশ";

export const CLASS_LIST = [
  { id: 1, name: "নূরানী" },
  { id: 2, name: "প্রি-হিফজ" },
  { id: 3, name: "হিফজ-১" },
  { id: 4, name: "হিফজ-২" },
  { id: 5, name: "হিফজ-৩" },
  { id: 6, name: "শুনানী" },
  { id: 7, name: "প্রি জু-১" },
  { id: 8, name: "প্রি জু-২" },
  { id: 9, name: "জুনিয়র-১" },
  { id: 10, name: "জুনিয়র-২" },
  { id: 11, name: "SSC" },
];

export const MONTHS_BENGALI = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

export const INCOME_CATEGORIES = [
  "মাসিক ফি", "ভর্তি ফি", "পরীক্ষা ফি", "বই বিক্রয়", "দান/অনুদান", "সরকারি অনুদান", "অন্যান্য আয়",
];

export const EXPENSE_CATEGORIES = [
  { group: "শিক্ষক বেতন", items: ["শিক্ষক বেতন", "স্টাফ বেতন", "বোনাস"] },
  { group: "অবকাঠামো", items: ["ভবন মেরামত", "আসবাবপত্র", "বিদ্যুৎ বিল", "পানি বিল", "গ্যাস বিল"] },
  { group: "শিক্ষা উপকরণ", items: ["বই ক্রয়", "স্টেশনারি", "প্রিন্টিং"] },
  { group: "অন্যান্য", items: ["পরিবহন", "খাবার", "অনুষ্ঠান", "বিবিধ খরচ"] },
];

const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return "০";
  return String(num).replace(/[0-9]/g, (d) => bengaliDigits[parseInt(d)]);
}

export function formatTaka(amount: number | string | undefined | null): string {
  const num = Number(amount);
  const safe = isFinite(num) ? num : 0;
  return `৳${toBengaliNumber(safe.toLocaleString("en-IN"))}`;
}

export function isTeacherStaff(role?: string | null, designation?: string | null): boolean {
  const text = `${role || ""} ${designation || ""}`.trim().toLowerCase();
  if (!text) return false;

  return [
    "শিক্ষ",
    "teacher",
    "assistant teacher",
    "head teacher",
    "lecturer",
    "instructor",
    "ustad",
    "mudar",
    "mudarris",
    "মুহাদ্দিস",
    "মুআল্লিম",
    "মুদাররিস",
    "উস্তাদ",
    "প্রভাষক",
  ].some((keyword) => text.includes(keyword));
}
