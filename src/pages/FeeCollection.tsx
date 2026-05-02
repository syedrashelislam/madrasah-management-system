import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "@/components/Icon";
import FeeCollectionTab from "./fee/FeeCollectionTab";
import FeeTransactionsTab from "./fee/FeeTransactionsTab";
import FeeDueListTab from "./fee/FeeDueListTab";
import FeeStructureTab from "./fee/FeeStructureTab";
import PaymentReminderTab from "./fee/PaymentReminderTab";
import MonthlyFeeReportTab from "./fee/MonthlyFeeReportTab";

const TABS = [
  { id: "collection", label: "আদায়", icon: "fa-hand-holding-usd" },
  { id: "transactions", label: "লেনদেন", icon: "fa-exchange-alt" },
  { id: "due", label: "বকেয়া তালিকা", icon: "fa-exclamation-circle" },
  { id: "reminder", label: "রিমাইন্ডার", icon: "fa-bell" },
  { id: "structure", label: "ফি কাঠামো", icon: "fa-list-alt" },
  { id: "monthly-report", label: "মাসিক রিপোর্ট", icon: "fa-chart-bar" },
];

export default function FeeManagement() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = TABS.some(t => t.id === tabFromUrl) ? tabFromUrl! : "collection";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tabFromUrl && TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  return (
    <div>
      <div className="page-header">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#d4af37" }}>
          <Icon name="fa-hand-holding-usd" style={{ marginLeft: 8 }} /> ফি ব্যবস্থাপনা
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4 }}>
          ছাত্রদের ফি আদায়, বকেয়া ও ফি কাঠামো ব্যবস্থাপনা
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? "btn-gold" : "btn-outline-gold"}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "collection" && <FeeCollectionTab />}
      {activeTab === "transactions" && <FeeTransactionsTab />}
      {activeTab === "due" && <FeeDueListTab />}
      {activeTab === "reminder" && <PaymentReminderTab />}
      {activeTab === "structure" && <FeeStructureTab />}
      {activeTab === "monthly-report" && <MonthlyFeeReportTab />}
    </div>
  );
}
