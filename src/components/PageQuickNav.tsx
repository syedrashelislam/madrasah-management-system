import { useLocation, useNavigate } from "react-router-dom";

interface QuickNavItem {
  path: string;
  icon: string;
  label: string;
  color: string;
}

const QUICK_NAV: QuickNavItem[] = [
  { path: "/students",           icon: "fa-user-graduate", label: "ছাত্র তালিকা",  color: "#d4af37"  },
  { path: "/students/new",       icon: "fa-user-plus",     label: "নতুন ভর্তি",   color: "#10b981"  },
  { path: "/student-attendance", icon: "fa-clipboard-check",label: "ছাত্র হাজিরা", color: "#818cf8"  },
  { path: "/attendance",         icon: "fa-user-check",    label: "স্টাফ হাজিরা", color: "#f97316"  },
];

export default function PageQuickNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/students/new") return location.pathname === "/students/new" || location.pathname.includes("/edit");
    if (path === "/students") return location.pathname === "/students";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <>
      <div className="pqn-wrap">
        {QUICK_NAV.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              className={`pqn-btn${active ? " pqn-btn--active" : ""}`}
              style={{ "--pqn-color": item.color } as React.CSSProperties}
              onClick={() => navigate(item.path)}
            >
              <i className={`fas ${item.icon} pqn-icon`} />
              <span className="pqn-label">{item.label}</span>
              {active && <span className="pqn-underline" />}
            </button>
          );
        })}
      </div>

      <style>{`
        .pqn-wrap {
          display: flex;
          gap: 6px;
          margin-bottom: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 6px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .pqn-wrap::-webkit-scrollbar { display: none; }

        .pqn-btn {
          flex: 1;
          min-width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          border: none;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .pqn-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .pqn-btn:active { transform: scale(0.94); }

        .pqn-btn--active {
          background: color-mix(in srgb, var(--pqn-color) 12%, transparent);
        }

        .pqn-icon {
          font-size: 18px;
          color: rgba(255,255,255,0.3);
          transition: color 0.2s, transform 0.2s;
        }
        .pqn-btn--active .pqn-icon {
          color: var(--pqn-color);
          transform: scale(1.1);
        }

        .pqn-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          white-space: nowrap;
          transition: color 0.2s;
          font-family: 'Hind Siliguri','Noto Sans Bengali',sans-serif;
        }
        .pqn-btn--active .pqn-label {
          color: var(--pqn-color);
        }

        .pqn-underline {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          border-radius: 2px;
          background: var(--pqn-color);
        }

        @media (min-width: 768px) {
          .pqn-wrap {
            flex-direction: row;
            flex-wrap: nowrap;
          }
          .pqn-btn {
            flex-direction: row;
            gap: 8px;
            padding: 12px 16px;
            min-width: 120px;
          }
          .pqn-icon { font-size: 15px; }
          .pqn-label { font-size: 13px; }
          .pqn-underline {
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 3px;
            transform: none;
            border-radius: 0 0 3px 3px;
          }
        }
      `}</style>
    </>
  );
}
