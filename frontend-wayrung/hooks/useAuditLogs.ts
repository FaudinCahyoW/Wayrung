"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { AuditLog } from "@/types/settings";

interface GetEnvelope<T> {
  data: T;
}

// enabled: cuma fetch kalau true — dipakai supaya request ke endpoint
// ownerOnly ini nggak ditembak percuma waktu yang login kasir / tab
// "Log aktivitas" belum pernah dibuka.
export function useAuditLogs(enabled: boolean) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<GetEnvelope<AuditLog[]>>("/audit-logs");
      setLogs(res.data.data ?? []);
      setFetched(true);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Gagal memuat log aktivitas"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled && !fetched) {
      fetchLogs();
    }
  }, [enabled, fetched, fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}