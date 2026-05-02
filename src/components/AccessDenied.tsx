import { useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="glass-card p-8 sm:p-12 max-w-md w-full text-center" style={{ animation: "fadeInUp 0.4s ease forwards" }}>
        {/* Icon container */}
        <div
          className="mx-auto mb-6 flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "rgba(212, 175, 55, 0.1)",
            border: "1px solid rgba(212, 175, 55, 0.2)",
          }}
        >
          <Lock size={36} style={{ color: "#d4af37" }} />
        </div>

        {/* Title */}
        <h2
          className="text-xl sm:text-2xl font-bold mb-3"
          style={{
            background: "linear-gradient(90deg, #ffffff 0%, #d4af37 40%, #f3d776 60%, #ffffff 100%)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          প্রবেশ নিষিদ্ধ
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base mb-8" style={{ color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.8 }}>
          আপনার এই পৃষ্ঠায় প্রবেশের অনুমতি নেই।
          <br />
          অনুগ্রহ করে প্রশাসকের সাথে যোগাযোগ করুন।
        </p>

        {/* Back to dashboard button */}
        <button
          onClick={() => navigate("/")}
          className="btn-gold"
          style={{ fontSize: 14, padding: "12px 28px" }}
        >
          <ArrowLeft size={16} />
          ড্যাশবোর্ডে ফিরে যান
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
