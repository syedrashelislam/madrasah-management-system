import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/Icon";
import { toBengaliNumber } from "@/lib/constants";
import { offlineSync } from "@/lib/offlineBiometricSync";

export default function OfflineSyncStatus() {
  const [online, setOnline] = useState(offlineSync.isOnline());
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setOnline(offlineSync.isOnline());
      setPending(await offlineSync.getPendingCount());
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);

    const goOnline = () => { setOnline(true); refresh(); };
    const goOffline = () => { setOnline(false); refresh(); };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      clearInterval(id);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [refresh]);

  // Nothing to show when online with no pending logs
  if (online && pending === 0) return null;

  const isOffline = !online;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2
        rounded-full px-3 py-1.5 text-[12px] font-medium text-white
        bg-black/70 backdrop-blur-md border border-white/10
        shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {/* Status dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
            isOffline ? "bg-red-400" : "bg-amber-400"
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            isOffline ? "bg-red-500" : "bg-amber-500"
          }`}
        />
      </span>

      {/* Icon */}
      {isOffline ? (
        <Icon name="fa-wifi-off" size={12} className="text-red-400" />
      ) : (
        <Icon name="fa-sync" size={12} className="text-amber-400 animate-spin" />
      )}

      {/* Label */}
      {isOffline ? (
        <span>
          অফলাইন
          {pending > 0 && (
            <span className="ml-1 text-white/70">
              · বাকি {toBengaliNumber(pending)}
            </span>
          )}
        </span>
      ) : (
        <span>সিঙ্ক বাকি: {toBengaliNumber(pending)}</span>
      )}
    </div>
  );
}
