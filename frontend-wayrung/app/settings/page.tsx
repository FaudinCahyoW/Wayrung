"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  User,
  Loader2,
  AlertCircle,
  LogOut,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import Image from "next/image";
// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: SettingsIcon, href: "/settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return "—";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatTanggalWaktu(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

// Bentuk pasti response /audit-logs belum dikonfirmasi — fallback ke
// beberapa kemungkinan nama field.
function getLogUserName(log: { user_name?: string; user?: { name: string } }): string {
  return log.user_name ?? log.user?.name ?? "—";
}

const ACTION_BADGE: Record<string, string> = {
  create: "bg-blue-50 text-blue-600",
  update: "bg-amber-50 text-amber-600",
  delete: "bg-red-50 text-red-600",
  login: "bg-emerald-50 text-emerald-600",
};

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    create: "Buat",
    update: "Ubah",
    delete: "Hapus",
    login: "Login",
  };
  return map[action] ?? action;
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`cursor-pointer relative h-6 w-[42px] flex-shrink-0 rounded-full transition-colors ${checked ? "bg-[#7959FF]" : "bg-[#ECEAF4]"
        }`}
    >
      <span
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all ${checked ? "left-[21px]" : "left-[3px]"
          }`}
      />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PengaturanPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isOwner = user?.role === "owner";
  const initials = getInitials(user?.name);

  const [activeTab, setActiveTab] = useState<"profil" | "notifikasi" | "log">("profil");

  const { settings, loading: settingsLoading, error: settingsError, saving, updateSettings } =
    useSettings();
  const { logs, loading: logsLoading, error: logsError } = useAuditLogs(
    isOwner && activeTab === "log"
  );

  // Form lokal untuk tab Notifikasi (diisi dari settings setelah ke-fetch)
  const [form, setForm] = useState<{
    low_stock_notification: boolean;
    low_stock_threshold: number;
    transaction_notification: boolean;
  } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // Sinkronkan form lokal begitu data settings dari API datang / berubah
  if (settings && !form) {
    setForm({
      low_stock_notification: settings.low_stock_notification,
      low_stock_threshold: settings.low_stock_threshold,
      transaction_notification: settings.transaction_notification,
    });
  }

  async function handleSaveSettings() {
    if (!form) return;
    setSaveMsg(null);
    setSaveErr(null);
    try {
      await updateSettings(form);
      setSaveMsg("Pengaturan berhasil disimpan.");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err: any) {
      setSaveErr(err.response?.data?.error || err.message || "Gagal menyimpan pengaturan.");
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-white text-[#1B1730] font-sans">
      <div className="grid grid-cols-1 md:grid-cols-[232px_1fr]">

        {/* ══ Sidebar ══════════════════════════════════════════════════════ */}
        <aside className="hidden md:flex flex-col sticky top-0 h-screen bg-[#7959FF] text-white px-5 py-7">
                  <div className="flex items-center gap-2.5 pb-8 font-extrabold text-lg tracking-tight justify-center">
                    <Image
                      src="/wayrung_logo.png"
                      alt="Wayrung Logo"
                      width={70}
                      height={70}
                      className="rounded-full object-cover"
                    />
                  </div>
        
                  <nav className="flex flex-1 flex-col gap-1">
                    {navItems.map(({ label, icon: Icon, href }) => {
                      const active = label === "Beranda";
                      return (
                        <a
                          key={label}
                          href={href}
                          className={`flex items-center gap-3 rounded-[11px] px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors ${active
                            ? "bg-white text-[#5F3FE0]"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                          <Icon size={19} />
                          {label}
                        </a>
                      );
                    })}
                  </nav>
        
                  <div className="flex items-center gap-2.5 border-t border-white/15 pt-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-[13px] font-bold">
                      {initials}
                    </div>
                    <div className="leading-tight">
                      <b className="block text-[13.5px]">{user?.name ?? "—"}</b>
                      <span className="text-[12px] text-white/65 capitalize">{user?.role ?? ""}</span>
                    </div>
                  </div>
                </aside>

        {/* ══ Main ═════════════════════════════════════════════════════════ */}
        <div className="flex flex-col min-h-screen">

          {/* Topbar */}
          <header className="flex items-center justify-between gap-5 px-5 py-4 md:px-8 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]">            <div>
            <h1 className="text-xl font-extrabold tracking-tight">Pengaturan</h1>
            <p className="mt-0.5 text-[13px] font-medium/70">
              Kelola profil, notifikasi, dan aktivitas akun
            </p>
          </div>
            <div className="flex items-center gap-2.5">
              <a href="/notifikasi">
                <button className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-white/15">
                  <Bell size={18} />
                  <span className="absolute right-[7px] top-[6px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[#7959FF] bg-[#FF6B57]" />
                </button>
              </a>
              <a href="/settings">
                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-[#AE22D2] text-[13px] font-bold text-white">
                  {initials}
                </div>
              </a>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-5 pb-28 pt-6 md:px-8 md:pb-10">

            <div className="mb-5">
              <h2 className="text-[22px] font-extrabold tracking-tight">Pengaturan</h2>
              <p className="mt-1 text-[13.5px] text-[#6B667E]">
                Kelola profil, notifikasi, dan aktivitas akun
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-0 border-b border-[#ECEAF4]">
              {(
                [
                  { key: "profil", label: "Profil" },
                  { key: "notifikasi", label: "Notifikasi" },
                  ...(isOwner ? [{ key: "log" as const, label: "Log aktivitas" }] : []),
                ] as { key: "profil" | "notifikasi" | "log"; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer relative mr-6 pb-3 pt-2 text-[14px] font-bold transition-colors ${activeTab === tab.key ? "text-[#5F3FE0]" : "text-[#6B667E]"
                    }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded bg-[#7959FF]" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab: Profil ────────────────────────────────────────── */}
            {activeTab === "profil" && (
              <div className="max-w-xl space-y-4">
                <div className="rounded-2xl border border-[#ECEAF4] p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-2xl bg-[#F2EFFF] text-[20px] font-extrabold text-[#5F3FE0]">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[16px] font-extrabold">{user?.name ?? "—"}</div>
                      <div className="text-[12.5px] text-[#6B667E]">{user?.email ?? "—"}</div>
                      <span className="mt-1.5 inline-block rounded-full bg-[#E8F0FD] px-2.5 py-1 text-[11px] font-bold capitalize text-[#2563C9]">
                        {user?.role === "owner" ? "Pemilik toko" : "Kasir"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#ECEAF4] p-6">
                  <h3 className="text-[15px] font-extrabold">Informasi akun</h3>
                  <p className="mt-1 text-[12.5px] text-[#6B667E]">
                    Data ini digunakan untuk login dan komunikasi terkait toko.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-[#6B667E]">
                        Nama lengkap
                      </label>
                      <input
                        disabled
                        value={user?.name ?? ""}
                        className="w-full cursor-not-allowed rounded-[11px] border border-[#ECEAF4] bg-[#FAFAFA] px-3.5 py-2.5 text-[13.5px] text-[#6B667E]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-bold text-[#6B667E]">
                        Email
                      </label>
                      <input
                        disabled
                        value={user?.email ?? ""}
                        className="w-full cursor-not-allowed rounded-[11px] border border-[#ECEAF4] bg-[#FAFAFA] px-3.5 py-2.5 text-[13.5px] text-[#6B667E]"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-[11.5px] text-[#6B667E]">
                    Belum bisa diubah sendiri dari sini — hubungi admin sistem kalau perlu perbarui data.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-[13.5px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Keluar dari akun
                </button>
              </div>
            )}

            {/* ── Tab: Notifikasi ────────────────────────────────────── */}
            {activeTab === "notifikasi" && (
              <div className="max-w-xl">
                {settingsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ECEAF4] py-16 text-[#6B667E]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px] font-semibold">Memuat pengaturan...</span>
                  </div>
                ) : settingsError ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ECEAF4] py-16 text-center">
                    <AlertCircle size={20} className="text-red-500" />
                    <span className="text-[13px] font-semibold text-[#6B667E]">{settingsError}</span>
                  </div>
                ) : form ? (
                  <div className="rounded-2xl border border-[#ECEAF4] p-6">
                    <h3 className="text-[15px] font-extrabold">Preferensi notifikasi</h3>
                    <p className="mt-1 text-[12.5px] text-[#6B667E]">
                      Atur kapan sistem mengirimkan notifikasi kepada kamu.
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#ECEAF4] py-4">
                      <div>
                        <div className="text-[13.5px] font-bold">Notifikasi stok menipis</div>
                        <div className="mt-0.5 text-[12px] text-[#6B667E]">
                          Kirim notifikasi saat stok produk mencapai ambang batas
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={form.low_stock_notification}
                        onChange={(v) => setForm({ ...form, low_stock_notification: v })}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-[#ECEAF4] py-4">
                      <div>
                        <div className="text-[13.5px] font-bold">Ambang batas stok menipis</div>
                        <div className="mt-0.5 text-[12px] text-[#6B667E]">
                          Notifikasi terkirim saat stok sama atau di bawah angka ini
                        </div>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={form.low_stock_threshold}
                        onChange={(e) =>
                          setForm({ ...form, low_stock_threshold: Number(e.target.value) })
                        }
                        className="w-20 rounded-[9px] border border-[#ECEAF4] px-3 py-2 text-center text-[13.5px] font-bold outline-none focus:border-[#7959FF]"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-[#ECEAF4] py-4">
                      <div>
                        <div className="text-[13.5px] font-bold">Notifikasi transaksi</div>
                        <div className="mt-0.5 text-[12px] text-[#6B667E]">
                          Kirim notifikasi setiap ada transaksi baru tercatat
                        </div>
                      </div>
                      <ToggleSwitch
                        checked={form.transaction_notification}
                        onChange={(v) => setForm({ ...form, transaction_notification: v })}
                      />
                    </div>

                    {saveErr && (
                      <p className="mt-3 rounded-[10px] bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-600">
                        {saveErr}
                      </p>
                    )}

                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-[#7959FF] px-5 py-2.5 text-[13.5px] font-bold text-white shadow-[0_10px_20px_-8px_rgba(121,89,255,0.55)] disabled:opacity-60 transition-colors hover:bg-[#5F3FE0]"
                      >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Menyimpan..." : "Simpan pengaturan"}
                      </button>
                      {saveMsg && (
                        <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-emerald-600">
                          <Check size={14} />
                          {saveMsg}
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Tab: Log aktivitas (owner only) ────────────────────── */}
            {activeTab === "log" && isOwner && (
              <div className="overflow-hidden rounded-2xl border border-[#ECEAF4]">
                {logsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#6B667E]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px] font-semibold">Memuat log aktivitas...</span>
                  </div>
                ) : logsError ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <AlertCircle size={20} className="text-red-500" />
                    <span className="text-[13px] font-semibold text-[#6B667E]">{logsError}</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="py-16 text-center text-[13px] font-semibold text-[#6B667E]">
                    Belum ada aktivitas tercatat.
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#FAFAFD]">
                        {["Waktu", "Pengguna", "Aksi", "Detail"].map((h) => (
                          <th
                            key={h}
                            className="border-b border-[#ECEAF4] px-5 py-3.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-[#6B667E]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-[#ECEAF4] last:border-0 hover:bg-[#FBFAFF]">
                          <td className="px-5 py-3.5 text-[13px] text-[#6B667E]">
                            {formatTanggalWaktu(log.created_at)}
                          </td>
                          <td className="px-5 py-3.5 text-[13.5px] font-bold">{getLogUserName(log)}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold ${ACTION_BADGE[log.action] ?? "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {actionLabel(log.action)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[13px]">{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[#ECEAF4] bg-white px-2 pb-2.5 pt-2.5 md:hidden">
        {navItems.slice(0, 4).map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            className="flex flex-col items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold text-[#6B667E]"
          >
            <Icon size={20} />
            {label}
          </a>
        ))}
        <a
          href="/pengaturan"
          className="flex flex-col items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold text-[#7959FF]"
        >
          <User size={20} />
          Akun
        </a>
      </nav>
    </div>
  );
}