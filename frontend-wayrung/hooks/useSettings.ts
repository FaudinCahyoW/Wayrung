"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Settings, UpdateSettingsRequest } from "@/types/settings";

// GET /settings -> { data: SettingsResponse }  (tidak ada "message")
interface GetEnvelope<T> {
  data: T;
}
// PUT /settings -> { message: string, data: SettingsResponse }
interface UpdateEnvelope<T> {
  message: string;
  data: T;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<GetEnvelope<Settings>>("/settings");
      setSettings(res.data.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Gagal memuat pengaturan"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function updateSettings(payload: UpdateSettingsRequest) {
    setSaving(true);
    try {
      const res = await api.put<UpdateEnvelope<Settings>>("/settings", payload);
      setSettings(res.data.data);
      return res.data.data;
    } finally {
      setSaving(false);
    }
  }

  return { settings, loading, error, saving, updateSettings, refetch: fetchSettings };
}