"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Image from "next/image";

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

// ─── Tipe data lokal ──────────────────────────────────────────────────────────
// Didefinisikan lokal (bukan import dari types/) supaya halaman ini tidak
// gantung ke bentuk pasti types/transaction.ts / types/product.ts yang mungkin
// sudah kamu ubah sendiri — cukup field yang benar-benar dipakai di sini saja.

interface TxDetailRow {
  product_name: string;
  quantity: number;
}

interface TxRow {
  id: number;
  type: "sale" | "purchase";
  total_amount: number;
  payment_method: string;
  note?: string;
  transaction_date: string;
  user_name?: string;
  details: TxDetailRow[];
}

interface ProductRow {
  id: number;
  name: string;
  sku: string;
  stock: number;
  purchase_price: number;
  selling_price: number;
}

interface DashboardSummary {
  incomeToday: number;
  expenseToday: number;
  transactionCountToday: number;
  stockValue: number;
  activeProducts: number;
  lowStockCount: number;
}

const DEFAULT_SUMMARY: DashboardSummary = {
  incomeToday: 0,
  expenseToday: 0,
  transactionCountToday: 0,
  stockValue: 0,
  activeProducts: 0,
  lowStockCount: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatCompactRp(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return "Rp " + (n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + "jt";
  }
  return formatRp(n);
}

function getInitials(name?: string): string {
  if (!name) return "—";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function getIndonesianDate(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTxTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function buildTxTitle(tx: TxRow): string {
  if (!tx.details || tx.details.length === 0) return tx.type === "sale" ? "Penjualan" : "Pembelian stok";
  const parts = tx.details.slice(0, 2).map((d) => `${d.product_name} ×${d.quantity}`);
  const rest = tx.details.length > 2 ? `, +${tx.details.length - 2} lainnya` : "";
  const prefix = tx.type === "sale" ? "Penjualan — " : "Pembelian stok — ";
  return prefix + parts.join(", ") + rest;
}

type StockStatus = "Kritis" | "Menipis" | "Aman";
function getStockStatus(stock: number): StockStatus {
  if (stock <= 5) return "Kritis";
  if (stock <= 10) return "Menipis";
  return "Aman";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const initials = getInitials(user?.name);
  const firstName = user?.name?.split(" ")[0] ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>(DEFAULT_SUMMARY);
  const [recentTx, setRecentTx] = useState<TxRow[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [txRes, prodRes] = await Promise.all([
          api.get("/transactions"),
          // limit besar supaya bisa hitung nilai stok & cari yang paling menipis
          // dari (hampir) semua produk, bukan cuma 1 halaman pagination
          api.get("/products", { params: { limit: 200, sort: "stock" } }),
        ]);
        if (cancelled) return;

        const allTx: TxRow[] = txRes.data?.data ?? [];
        const allProducts: ProductRow[] = prodRes.data?.data ?? [];
        const productTotalData: number | undefined = prodRes.data?.meta?.total_data;

        // Transaksi hari ini (transaction_date format ISO, ambil 10 karakter tanggalnya)
        const todayStr = new Date().toISOString().slice(0, 10);
        const todaysTx = allTx.filter((t) => t.transaction_date?.slice(0, 10) === todayStr);
        const incomeToday = todaysTx
          .filter((t) => t.type === "sale")
          .reduce((sum, t) => sum + t.total_amount, 0);
        const expenseToday = todaysTx
          .filter((t) => t.type === "purchase")
          .reduce((sum, t) => sum + t.total_amount, 0);

        // 4 transaksi terbaru (urut tanggal terbaru dulu)
        const sortedTx = [...allTx].sort(
          (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        );
        setRecentTx(sortedTx.slice(0, 4));

        // Nilai stok (berdasar harga beli) & produk stok menipis
        const stockValue = allProducts.reduce((sum, p) => sum + p.purchase_price * p.stock, 0);
        const lowStock = allProducts
          .filter((p) => p.stock <= 10)
          .sort((a, b) => a.stock - b.stock);
        setLowStockProducts(lowStock.slice(0, 4));

        setSummary({
          incomeToday,
          expenseToday,
          transactionCountToday: todaysTx.length,
          stockValue,
          activeProducts: productTotalData ?? allProducts.length,
          lowStockCount: lowStock.length,
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || "Gagal memuat data dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
              <h1 className="text-xl font-extrabold tracking-tight">Dashboard</h1>
              <p className="mt-0.5 text-[13px] font-medium/70">
                Ringkasan toko hari ini
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

            {/* Greeting */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
                </h2>
                <p className="mt-1 text-[13.5px] text-[#6B667E] capitalize">{getIndonesianDate()}</p>
              </div>
              <a
                href="/transaksi"
                className="hidden md:inline-flex items-center gap-2 rounded-xl bg-[#7959FF] px-[18px] py-[11px] text-[13.5px] font-bold text-white shadow-[0_10px_20px_-8px_rgba(121,89,255,0.55)] hover:bg-[#5F3FE0] transition-colors"
              >
                <Plus size={16} strokeWidth={2.6} />
                Transaksi baru
              </a>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ECEAF4] py-20 text-[#6B667E]">
                <Loader2 size={22} className="animate-spin" />
                <span className="text-[13px] font-semibold">Memuat data toko...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#ECEAF4] py-20 text-center">
                <AlertCircle size={22} className="text-red-500" />
                <span className="text-[13px] font-semibold text-[#6B667E]">{error}</span>
              </div>
            ) : (
              <>
                {/* Hero stat */}
                <div className="relative mb-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#7959FF] to-[#5F3FE0] p-6 text-white md:p-7">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/[0.08]" />
                  <div className="pointer-events-none absolute bottom-[-90px] right-16 h-40 w-40 rounded-full bg-white/[0.06]" />

                  <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
                    <div>
                      <div className="text-[13px] font-semibold text-white/70">Pendapatan hari ini</div>
                      <div className="mt-1.5 text-[38px] font-extrabold tracking-tight">
                        {formatRp(summary.incomeToday)}
                      </div>
                    </div>

                    <div className="flex gap-7">
                      <div>
                        <div className="text-[12px] font-semibold text-white/65">Transaksi hari ini</div>
                        <div className="mt-1 text-[18px] font-extrabold">{summary.transactionCountToday}</div>
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-white/65">Nilai stok</div>
                        <div className="mt-1 text-[18px] font-extrabold">{formatCompactRp(summary.stockValue)}</div>
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-white/65">Produk aktif</div>
                        <div className="mt-1 text-[18px] font-extrabold">{summary.activeProducts}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex flex-col gap-2.5 rounded-2xl border border-[#ECEAF4] p-[18px] bg-gradient-to-r from-[#FF007A] via-[#9B00E8] to-[#2E3192]">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-emerald-100 text-emerald-600">
                      <TrendingUp size={17} />
                    </div>
                    <div className="text-[23px] font-extrabold tracking-tight text-white">{formatRp(summary.incomeToday)}</div>
                    <div className="text-[12.5px] font-semibold text-[#6B667E]-50">Pemasukan hari ini</div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-2xl border border-[#ECEAF4] p-[18px] bg-gradient-to-r from-[#2B1BFF] via-[#007BFF] to-[#00D4FF]">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-red-100 text-red-600">
                      <TrendingDown size={17} />
                    </div>
                    <div className="text-[23px] font-extrabold tracking-tight text-white">{formatRp(summary.expenseToday)}</div>
                    <div className="text-[12.5px] font-semibold text-[#6B667E]-10">Pengeluaran hari ini</div>
                  </div>

                  <div className="flex flex-col gap-2.5 rounded-2xl border border-[#ECEAF4] p-[18px] bg-gradient-to-r from-[#FF4E00] via-[#FF007A] to-[#FF2A85]">
                    <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-amber-100 text-amber-600">
                      <AlertTriangle size={17} />
                    </div>
                    <div className="text-[23px] font-extrabold tracking-tight text-white">Stok menipis</div>
                    <div className="text-[12.5px] font-semibold text-[#6B667E]-20">
                      {summary.lowStockCount} produk perlu diisi ulang
                    </div>
                  </div>
                </div>

                {/* Split panels */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
                  {/* Transaksi terbaru */}
                  <div className="overflow-hidden rounded-2xl border border-[#ECEAF4]">
                    <div className="flex items-center justify-between px-5 pb-3.5 pt-[18px]">
                      <h3 className="text-[15px] font-extrabold">Transaksi terbaru</h3>
                      <a href="/transaksi" className="text-[12.5px] font-bold text-[#7959FF]">
                        Lihat semua
                      </a>
                    </div>

                    {recentTx.length === 0 ? (
                      <div className="px-5 py-8 text-center text-[13px] font-semibold text-[#6B667E]">
                        Belum ada transaksi.
                      </div>
                    ) : (
                      recentTx.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-3 border-t border-[#ECEAF4] px-5 py-3">
                          <div
                            className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] ${tx.type === "sale"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                              }`}
                          >
                            {tx.type === "sale" ? <ArrowDownToLine size={17} /> : <ArrowUpFromLine size={17} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-bold">{buildTxTitle(tx)}</div>
                            <div className="mt-0.5 text-[11.5px] text-[#6B667E]">
                              {tx.payment_method} · {formatTxTime(tx.transaction_date)}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div
                              className={`text-[13.5px] font-extrabold ${tx.type === "sale" ? "text-emerald-600" : "text-red-600"
                                }`}
                            >
                              {tx.type === "sale" ? "+" : "-"}
                              {formatRp(tx.total_amount)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    <a
                      href="/transaksi"
                      className="block border-t border-[#ECEAF4] py-3.5 text-center text-[13px] font-bold text-[#7959FF]"
                    >
                      + Catat transaksi baru
                    </a>
                  </div>

                  {/* Stok menipis */}
                  <div className="overflow-hidden rounded-2xl border border-[#ECEAF4]">
                    <div className="flex items-center justify-between px-5 pb-3.5 pt-[18px]">
                      <h3 className="text-[15px] font-extrabold">Stok menipis</h3>
                      <a href="/produk" className="text-[12.5px] font-bold text-[#7959FF]">
                        Kelola produk
                      </a>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="px-5 py-8 text-center text-[13px] font-semibold text-[#6B667E]">
                        Semua stok aman.
                      </div>
                    ) : (
                      lowStockProducts.map((p) => {
                        const status = getStockStatus(p.stock);
                        return (
                          <div key={p.id} className="flex items-center gap-3 border-t border-[#ECEAF4] px-5 py-3.5">
                            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#F2EFFF] text-[14px] font-extrabold text-[#5F3FE0]">
                              {getInitials(p.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13.5px] font-bold">{p.name}</div>
                              <div className="mt-0.5 text-[11px] text-[#6B667E]">
                                SKU {p.sku} · sisa {p.stock}
                              </div>
                            </div>
                            <span
                              className={`flex-shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-extrabold ${status === "Kritis"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-600"
                                }`}
                            >
                              {status}
                            </span>
                          </div>
                        );
                      })
                    )}

                    <a
                      href="/produk"
                      className="block border-t border-[#ECEAF4] py-3.5 text-center text-[13px] font-bold text-[#7959FF]"
                    >
                      Lihat semua stok menipis
                    </a>
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
          const active = label === "Beranda";
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

      {/* Mobile FAB */}
      <a
        href="/transaksi"
        className="fixed bottom-[64px] right-5 z-[21] flex h-14 w-14 items-center justify-center rounded-full bg-[#7959FF] text-white shadow-[0_14px_24px_-8px_rgba(121,89,255,0.6)] md:hidden hover:bg-[#5F3FE0] transition-colors"
      >
        <Plus size={24} strokeWidth={2.6} />
      </a>
    </div>
  );
}