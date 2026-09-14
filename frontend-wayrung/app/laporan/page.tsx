"use client";

import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Bell,
  Download,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useLaporan";
import { ReportRange } from "@/types/laporan";
import Image from "next/image";

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatCompactRupiah(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return "Rp " + (n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "jt";
  }
  if (Math.abs(n) >= 1_000) {
    return "Rp " + (n / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "rb";
  }
  return formatRupiah(n);
}

function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const RANGE_OPTIONS: { label: string; value: ReportRange }[] = [
  { label: "Hari ini", value: "today" },
  { label: "Minggu ini", value: "week" },
  { label: "Bulan ini", value: "month" },
];

const RANGE_COMPARE_LABEL: Record<ReportRange, string> = {
  today: "vs kemarin",
  week: "vs minggu lalu",
  month: "vs bulan lalu",
};

// ─── Sub-komponen: Stat mini card ─────────────────────────────────────────────

function MiniCard({
  label,
  value,
  changePercent,
  compareLabel,
}: {
  label: string;
  value: string;
  changePercent?: number;
  compareLabel: string;
}) {
  const isUp = (changePercent ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-[#ECEAF4] p-[18px]">
      <div className="text-[12px] font-semibold text-[#6B667E]">{label}</div>
      <div className="mt-1.5 text-[21px] font-extrabold">{value}</div>
      {changePercent !== undefined && (
        <span
          className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${isUp ? "text-emerald-600" : "text-red-600"
            }`}
        >
          {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {formatPercent(changePercent)} {compareLabel}
        </span>
      )}
    </div>
  );
}

// ─── Sub-komponen: Bar chart pemasukan vs pengeluaran ─────────────────────────

function SalesBarChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.income, d.expense)));

  return (
    <div className="mb-5 rounded-2xl border border-[#ECEAF4] p-[22px] pb-4">
      <h3 className="mb-4 text-[15px] font-extrabold">Pemasukan vs pengeluaran</h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[13px] font-semibold text-[#6B667E]">
          Belum ada data untuk periode ini
        </div>
      ) : (
        <div className="flex h-[180px] items-end gap-3.5">
          {data.map((d, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-full w-full flex-col justify-end gap-[3px]">
                <div
                  className="w-full rounded-t-[6px] rounded-b-[3px] bg-gradient-to-b from-[#7959FF] to-[#5F3FE0]"
                  style={{ height: `${(d.income / maxValue) * 100}%` }}
                />
                <div
                  className="w-full rounded-t-[6px] rounded-b-[3px] border border-[#E7E1FF] bg-[#F1EDFF]"
                  style={{ height: `${(d.expense / maxValue) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#6B667E]">{d.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3.5 flex gap-4.5">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B667E]">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px] bg-[#7959FF]" />
          Pemasukan
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B667E]">
          <i className="inline-block h-2.5 w-2.5 rounded-[3px] border border-[#E7E1FF] bg-[#F1EDFF]" />
          Pengeluaran
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const initials = user?.name ? getInitials(user.name) : "—";

  const {
    range,
    setRange,
    summary,
    salesChart,
    topProducts,
    paymentMethods,
    loading,
    error,
    refetch,
  } = useReports();

  const compareLabel = RANGE_COMPARE_LABEL[range];

  const handleDownloadReport = () => {
    alert(
      isOwner
        ? "Mengunduh Laporan Keuangan Lengkap (PDF)..."
        : "Mengunduh Laporan Setoran Shift Kasir (PDF)..."
    );
  };

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
          <header className="flex items-center justify-between gap-5 px-5 py-4 md:px-8 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Laporan</h1>
              <p className="mt-0.5 text-[13px] font-medium/70">
                Ringkasan performa toko              </p>
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

            {/* Page heading + CTA */}
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  {isOwner ? "Laporan Bisnis" : "Laporan Shift Kasir"}
                </h2>
                <p className="mt-1 text-[13.5px] text-[#6B667E]">
                  {isOwner
                    ? "Ringkasan performa dan keuangan toko"
                    : `Ringkasan transaksi atas nama ${user?.name || "Kasir"}`}
                </p>
              </div>
              <button
                onClick={handleDownloadReport}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-[#ECEAF4] px-4 py-2.5 text-[13.5px] font-bold hover:border-[#C7C2DA] bg-white text-[#1B1730] shadow-sm transition-colors"
              >
                <Download size={15} />
                {isOwner ? "Unduh laporan toko" : "Unduh laporan shift"}
              </button>
            </div>

            {/* Alert Mode Read-Only Khusus Kasir */}
            {!isOwner && (
              <div className="mb-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-[#5F3FE0]">
                <ShieldCheck size={20} className="shrink-0 text-[#7959FF]" />
                <div className="text-[13px] font-semibold">
                  <span>Mode Read-Only Kasir:</span> Anda melihat ringkasan hasil penjualan & setoran kasir. Data laba kotor dan pengeluaran toko disembunyikan.
                </div>
              </div>
            )}

            {/* Selector Rentang Waktu (Hanya Tampil untuk Owner) */}
            {isOwner && (
              <div className="mb-5 inline-flex gap-0.5 rounded-[11px] border border-[#ECEAF4] p-[3px]">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRange(opt.value)}
                    className={`cursor-pointer rounded-[8px] px-3.5 py-2 text-[13px] font-bold transition-colors ${range === opt.value ? "bg-[#7959FF] text-white" : "text-[#6B667E]"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ECEAF4] py-20 text-[#6B667E]">
                <Loader2 size={22} className="animate-spin text-[#7959FF]" />
                <span className="text-[13px] font-semibold">Memuat laporan...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ECEAF4] py-20 text-center">
                <AlertCircle size={22} className="text-red-500" />
                <span className="text-[13px] font-semibold text-[#6B667E]">{error}</span>
                <button
                  onClick={refetch}
                  className="rounded-lg border border-[#ECEAF4] px-3.5 py-2 text-[12.5px] font-bold hover:bg-slate-50 transition-colors"
                >
                  Coba lagi
                </button>
              </div>
            ) : (
              <>
                {/* Stat Grid */}
                <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
                  <MiniCard
                    label={isOwner ? "Total pemasukan" : "Total omzet shift ini"}
                    value={formatCompactRupiah(summary.total_income)}
                    changePercent={isOwner ? summary.income_change_percent : undefined}
                    compareLabel={compareLabel}
                  />

                  {isOwner ? (
                    <MiniCard
                      label="Total pengeluaran"
                      value={formatCompactRupiah(summary.total_expense)}
                      changePercent={summary.expense_change_percent}
                      compareLabel={compareLabel}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#ECEAF4] p-[18px] bg-slate-50/50 flex flex-col justify-between">
                      <div className="text-[12px] font-semibold text-[#6B667E]">Pengeluaran toko</div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
                        <Lock size={14} /> Owner Only
                      </div>
                      <span className="mt-1.5 text-[11px] font-semibold text-slate-400">Dirahasiakan</span>
                    </div>
                  )}

                  {isOwner ? (
                    <MiniCard
                      label="Laba kotor"
                      value={formatCompactRupiah(summary.gross_profit)}
                      changePercent={summary.profit_change_percent}
                      compareLabel={compareLabel}
                    />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#ECEAF4] p-[18px] bg-slate-50/50 flex flex-col justify-between">
                      <div className="text-[12px] font-semibold text-[#6B667E]">Margin laba</div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[13px] font-bold text-slate-400">
                        <Lock size={14} /> Owner Only
                      </div>
                      <span className="mt-1.5 text-[11px] font-semibold text-slate-400">Dirahasiakan</span>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#ECEAF4] p-[18px]">
                    <div className="text-[12px] font-semibold text-[#6B667E]">Total transaksi</div>
                    <div className="mt-1.5 text-[21px] font-extrabold">{summary.transaction_count}</div>
                    {isOwner ? (
                      <span
                        className={`mt-1.5 inline-block text-[11px] font-bold ${summary.transaction_count_diff >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                      >
                        {summary.transaction_count_diff >= 0 ? "+" : ""}
                        {summary.transaction_count_diff} transaksi {compareLabel}
                      </span>
                    ) : (
                      <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#6B667E]">
                        Diproses shift ini
                      </span>
                    )}
                  </div>
                </div>

                {/* Grafik Pemasukan vs Pengeluaran (Owner Only) */}
                {isOwner && <SalesBarChart data={salesChart} />}

                {/* Split: produk terlaris & metode pembayaran (Owner & Kasir) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-[#ECEAF4]">
                    <div className="px-5 pb-2 pt-[18px]">
                      <h3 className="text-[15px] font-extrabold">Produk terlaris</h3>
                    </div>
                    {topProducts.length === 0 ? (
                      <div className="px-5 py-8 text-center text-[13px] font-semibold text-[#6B667E]">
                        Belum ada data penjualan
                      </div>
                    ) : (
                      <table className="w-full">
                        <tbody>
                          {topProducts.map((p) => (
                            <tr key={p.product_id} className="border-t border-[#ECEAF4] first:border-0">
                              <td className="px-5 py-3 text-[13.5px] font-bold">{p.product_name}</td>
                              <td className="px-5 py-3 text-right text-[12.5px] text-[#6B667E]">
                                {p.quantity_sold} terjual
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#ECEAF4]">
                    <div className="px-5 pb-2 pt-[18px]">
                      <h3 className="text-[15px] font-extrabold">Metode pembayaran</h3>
                    </div>
                    {paymentMethods.length === 0 ? (
                      <div className="px-5 py-8 text-center text-[13px] font-semibold text-[#6B667E]">
                        Belum ada data transaksi
                      </div>
                    ) : (
                      <table className="w-full">
                        <tbody>
                          {paymentMethods.map((pm) => (
                            <tr key={pm.payment_method} className="border-t border-[#ECEAF4] first:border-0">
                              <td className="px-5 py-3 text-[13.5px] font-bold">{pm.payment_method}</td>
                              <td className="px-5 py-3 text-right text-[12.5px] text-[#6B667E]">
                                {pm.percentage.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[#ECEAF4] bg-white px-2 pb-2.5 pt-2.5 md:hidden">
        {navItems.slice(0, 4).map(({ label, icon: Icon, href }) => {
          const active = label === "Laporan";
          return (
            <a
              key={label}
              href={href}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold ${active ? "text-[#7959FF]" : "text-[#6B667E]"
                }`}
            >
              <Icon size={20} />
              {label}
            </a>
          );
        })}
        <a href="#" className="flex flex-col items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold text-[#6B667E]">
          <User size={20} />
          Akun
        </a>
      </nav>
    </div>
  );
}