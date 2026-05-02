/**
 * Offline Biometric Sync Service
 *
 * IndexedDB-backed queue for biometric punch logs. When the network is
 * unavailable, logs are stored locally and auto-uploaded once connectivity
 * returns. Uses raw IndexedDB — no external dependencies.
 */

import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingBiometricLog {
  localId: string;
  deviceId: string;
  zkUserId: string;
  punchTime: string;
  punchState: number;
  queuedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DB_NAME = "biometric_offline_db";
const STORE_NAME = "pending_logs";
const DB_VERSION = 1;

/** Generate a random ID, preferring crypto.randomUUID when available. */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// OfflineBiometricSync class
// ---------------------------------------------------------------------------

export class OfflineBiometricSync {
  private db: IDBDatabase | null = null;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private onlineHandler: (() => void) | null = null;

  // ---- Initialization ----------------------------------------------------

  /** Open (or create) the IndexedDB database and object store. */
  async init(): Promise<void> {
    if (this.db) return; // already initialised

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "localId" });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.registerOnlineListener();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ---- CRUD on the local queue -------------------------------------------

  /** Queue a biometric punch log for later upload. */
  async addPendingLog(log: {
    deviceId: string;
    zkUserId: string;
    punchTime: string;
    punchState: number;
  }): Promise<PendingBiometricLog> {
    const entry: PendingBiometricLog = {
      localId: generateId(),
      ...log,
      queuedAt: new Date().toISOString(),
    };
    await this.txWrite((store) => store.add(entry));
    return entry;
  }

  /** Return every pending log still in the local queue. */
  async getPendingLogs(): Promise<PendingBiometricLog[]> {
    return new Promise((resolve, reject) => {
      const store = this.readStore();
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as PendingBiometricLog[]);
      request.onerror = () => reject(request.error);
    });
  }

  /** Return the number of pending logs. */
  async getPendingCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.readStore();
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /** Remove a single log by its localId (after successful upload). */
  async removePendingLog(localId: string): Promise<void> {
    await this.txWrite((store) => store.delete(localId));
  }

  /** Remove every pending log from the store. */
  async clearAll(): Promise<void> {
    await this.txWrite((store) => store.clear());
  }

  // ---- Sync to Supabase --------------------------------------------------

  /**
   * Attempt to upload all pending logs to Supabase `biometric_logs`.
   * Successfully uploaded entries are removed from IndexedDB.
   */
  async syncPendingLogs(): Promise<{ uploaded: number; failed: number }> {
    const logs = await this.getPendingLogs();
    if (logs.length === 0) return { uploaded: 0, failed: 0 };

    let uploaded = 0;
    let failed = 0;

    for (const log of logs) {
      try {
        const { error } = await supabase.from("biometric_logs").insert({
          device_id: log.deviceId,
          zk_user_id: log.zkUserId,
          punch_time: log.punchTime,
          punch_state: log.punchState,
          synced_to_attendance: false,
        });

        if (error) {
          // Duplicate entry (unique constraint) — treat as success so we
          // don't keep retrying the same row forever.
          if (error.code === "23505") {
            await this.removePendingLog(log.localId);
            uploaded++;
          } else {
            failed++;
          }
        } else {
          await this.removePendingLog(log.localId);
          uploaded++;
        }
      } catch {
        // Network / unexpected error — keep in queue
        failed++;
      }
    }

    return { uploaded, failed };
  }

  // ---- Auto-sync timer ---------------------------------------------------

  /** Start a recurring timer that syncs when the browser is online. */
  startAutoSync(intervalMs: number = 30_000): void {
    this.stopAutoSync(); // prevent duplicate timers
    this.autoSyncTimer = setInterval(async () => {
      if (this.isOnline()) {
        await this.syncPendingLogs();
      }
    }, intervalMs);
  }

  /** Stop the recurring sync timer. */
  stopAutoSync(): void {
    if (this.autoSyncTimer !== null) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  // ---- Connectivity helpers ----------------------------------------------

  /** Returns `true` when the browser reports an active network connection. */
  isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  // ---- Internal helpers --------------------------------------------------

  /** Listen for the browser "online" event and trigger an immediate sync. */
  private registerOnlineListener(): void {
    if (this.onlineHandler || typeof window === "undefined") return;

    this.onlineHandler = () => {
      // Fire-and-forget; errors are silently caught in syncPendingLogs
      this.syncPendingLogs();
    };
    window.addEventListener("online", this.onlineHandler);
  }

  /** Get a readonly object store for reads. */
  private readStore(): IDBObjectStore {
    if (!this.db) throw new Error("OfflineBiometricSync: call init() first");
    return this.db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
  }

  /** Execute a write operation inside a readwrite transaction. */
  private txWrite(fn: (store: IDBObjectStore) => IDBRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("OfflineBiometricSync: call init() first"));
        return;
      }
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      fn(store);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const offlineSync = new OfflineBiometricSync();
