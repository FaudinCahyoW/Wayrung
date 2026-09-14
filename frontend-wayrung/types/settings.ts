// ============================================================
// Types untuk domain Pengaturan (settings) & Log Aktivitas (audit_logs)
// ============================================================

export interface Settings {
  id: number;
  user_id: number;
  low_stock_notification: boolean;
  low_stock_threshold: number;
  transaction_notification: boolean;
  created_at: string;
  updated_at: string;
}

// Sesuai dto.UpdateSettingsRequest di backend — SEMUA field wajib diisi
// (binding:"required"), bukan partial update.
export interface UpdateSettingsRequest {
  low_stock_notification: boolean;
  low_stock_threshold: number;
  transaction_notification: boolean;
}

// Bentuk pasti response GET /audit-logs belum dikonfirmasi dari backend,
// jadi field user_name & user dibuat opsional — komponen yang pakai ini
// fallback ke salah satu yang tersedia (lihat helper getLogUserName di page).
export interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  user?: { id: number; name: string };
  action: string;
  entity_type: string;
  entity_id: number;
  description: string;
  created_at: string;
}