"use client";

import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Bell,
  Plus,
  Search,
  ChevronDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import {
  TransactionType,
  TransactionItemForm,
  CreateTransactionPayload,
  ProductOption,
  TRANSACTION_TYPE_LABEL,
} from "@/types/transaction";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/transaksi" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function buildDescription(details: { product_name: string; quantity: number }[]) {
  if (!details || details.length === 0) return "—";
  const parts = details
    .slice(0, 2)
    .map((d) => `${d.product_name} ×${d.quantity}`);
  const rest = details.length > 2 ? `, +${details.length - 2} lainnya` : "";
  return parts.join(", ") + rest;
}

const PAYMENT_METHODS = ["Semua metode", "Tunai", "Transfer bank", "QRIS", "Lainnya"];

// ─── Modal Transaksi Baru ─────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (payload: CreateTransactionPayload) => Promise<any>;
  fetchProducts: () => Promise<ProductOption[]>;
}

function ModalTransaksiBaru({ onClose, onSubmit, fetchProducts }: ModalProps) {
  const [txType, setTxType] = useState<TransactionType>("sale");
  const [paymentMethod, setPaymentMethod] = useState<string>("Tunai");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<TransactionItemForm[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch products on open
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setLoadingProducts(false));
  }, [fetchProducts]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  function addItem(p: ProductOption) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === p.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: p.id,
          product_name: p.name,
          selling_price: p.selling_price,
          purchase_price: p.purchase_price,
          quantity: 1,
        },
      ];
    });
    setProductSearch("");
    setShowDropdown(false);
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function updateQty(productId: number, qty: number) {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: qty } : i))
    );
  }

  const previewTotal = items.reduce((sum, i) => {
    const price = txType === "sale" ? i.selling_price : i.purchase_price;
    return sum + price * i.quantity;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (items.length === 0) {
      setFormError("Tambahkan minimal satu produk.");
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({
        type: txType,
        payment_method: paymentMethod as CreateTransactionPayload["payment_method"],
        note: note || undefined,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan transaksi.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[520px] rounded-[20px] bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#ECEAF4] flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#1B1730]">Transaksi Baru</h2>
            <p className="text-[12.5px] text-[#6B667E] mt-0.5">Catat penjualan atau pembelian stok</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2EFFF] text-[#7959FF] hover:bg-[#E7E1FF] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Toggle Tipe */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-2">
              Tipe Transaksi
            </label>
            <div className="flex gap-2">
              {(["sale", "purchase"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTxType(t)}
                  className={`flex-1 py-2.5 rounded-[11px] text-[13.5px] font-bold border transition-all ${txType === t
                    ? t === "sale"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-red-50 border-red-300 text-red-700"
                    : "bg-white border-[#ECEAF4] text-[#6B667E] hover:border-[#C7C2DA]"
                    }`}
                >
                  {t === "sale" ? "Penjualan" : "Pembelian"}
                </button>
              ))}
            </div>
          </div>

          {/* Cari Produk */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-2">
              Produk
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 rounded-[11px] border border-[#ECEAF4] bg-white px-3.5 py-2.5 focus-within:border-[#7959FF] transition-colors">
                <Search size={14} className="text-[#C7C2DA] flex-shrink-0" />
                <input
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Cari nama produk..."
                  className="flex-1 text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none bg-transparent"
                />
              </div>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1.5 rounded-[13px] border border-[#ECEAF4] bg-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.14)] z-20 max-h-48 overflow-y-auto">
                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-[#6B667E] text-[13px]">
                      <Loader2 size={15} className="animate-spin" /> Memuat produk...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <p className="py-4 text-center text-[13px] text-[#6B667E]">Produk tidak ditemukan</p>
                  ) : (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem(p)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F7F5FF] transition-colors border-b border-[#F5F4FA] last:border-0"
                      >
                        <div>
                          <div className="text-[13.5px] font-bold text-[#1B1730]">{p.name}</div>
                          <div className="text-[11.5px] text-[#6B667E]">
                            {p.sku} · stok {p.stock}
                          </div>
                        </div>
                        <span className="text-[12.5px] font-bold text-[#7959FF] flex-shrink-0">
                          {formatRp(txType === "sale" ? p.selling_price : p.purchase_price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Daftar item */}
          {items.length > 0 && (
            <div className="rounded-[13px] border border-[#ECEAF4] overflow-hidden">
              {items.map((item, idx) => {
                const price = txType === "sale" ? item.selling_price : item.purchase_price;
                return (
                  <div
                    key={item.product_id}
                    className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? "border-t border-[#ECEAF4]" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#1B1730] truncate">
                        {item.product_name}
                      </div>
                      <div className="text-[11.5px] text-[#6B667E]">
                        {formatRp(price)} / unit
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-[#F2EFFF] text-[#7959FF] font-bold text-lg leading-none flex items-center justify-center hover:bg-[#E7E1FF] transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.product_id, Number(e.target.value))}
                        className="w-12 text-center text-[13.5px] font-bold border border-[#ECEAF4] rounded-lg py-1 outline-none focus:border-[#7959FF]"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-[#F2EFFF] text-[#7959FF] font-bold text-lg leading-none flex items-center justify-center hover:bg-[#E7E1FF] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-[13px] font-extrabold text-[#1B1730] w-24 text-right flex-shrink-0">
                      {formatRp(price * item.quantity)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="text-[#C7C2DA] hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
              {/* Preview total */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#FAFAFA] border-t border-[#ECEAF4]">
                <span className="text-[12.5px] font-bold text-[#6B667E]">Total Estimasi</span>
                <span className="text-[15px] font-extrabold text-[#1B1730]">
                  {formatRp(previewTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Metode Bayar */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-2">
              Metode Pembayaran
            </label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full appearance-none rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 text-[13.5px] font-semibold text-[#1B1730] bg-white outline-none focus:border-[#7959FF] transition-colors pr-10 cursor-pointer"
              >
                {["Tunai", "Transfer bank", "QRIS", "Lainnya"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B667E]" />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-2">
              Catatan <span className="text-[#C7C2DA] normal-case font-normal">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan transaksi..."
              rows={2}
              className="w-full rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none focus:border-[#7959FF] transition-colors resize-none"
            />
          </div>

          {formError && (
            <p className="rounded-[10px] bg-red-50 text-red-600 text-[13px] font-semibold px-4 py-2.5">
              {formError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pt-4 pb-5 border-t border-[#ECEAF4] flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-[#ECEAF4] py-2.5 text-[13.5px] font-bold text-[#6B667E] hover:border-[#C7C2DA] hover:text-[#1B1730] transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-[11px] bg-[#7959FF] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#5F3FE0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransaksiPage() {
  const { user } = useAuth();
  const {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    pageSize,
    totalPenjualan,
    totalPembelian,
    saldoBersih,
    createTransaction,
    fetchProducts,
    refetch,
  } = useTransactions();

  const [showModal, setShowModal] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const methodRef = useRef<HTMLDivElement>(null);

  // Initials avatar dari nama user
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  // Close method dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (methodRef.current && !methodRef.current.contains(e.target as Node)) {
        setMethodOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Pagination pages array
  function getPageNumbers() {
    const delta = 1;
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (
        (i === currentPage - delta - 1 && i > 1) ||
        (i === currentPage + delta + 1 && i < totalPages)
      ) {
        pages.push("...");
      }
    }
    return pages;
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
          <header className="flex items-center justify-between gap-5 px-5 py-4 md:px-8 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]">

            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Transaksi</h1>
              <p className="mt-0.5 text-[13px] font-medium/70">
                Riwayat penjualan & pembelian stok
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-white/15">
                <Bell size={18} />
                <span className="absolute right-[7px] top-[6px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[#7959FF] bg-[#FF6B57]" />
              </button>
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
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-tight">Transaksi</h2>
                <p className="mt-1 text-[13.5px] text-[#6B667E]">
                  Riwayat penjualan &amp; pembelian stok
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="hidden md:inline-flex items-center gap-2 rounded-xl bg-[#7959FF] px-[18px] py-[11px] text-[13.5px] font-bold text-white shadow-[0_10px_20px_-8px_rgba(121,89,255,0.55)] hover:bg-[#5F3FE0] transition-colors"
              >
                <Plus size={16} strokeWidth={2.6} />
                Transaksi baru
              </button>
            </div>

            {/* Summary strip */}
            <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                {
                  label: "Total Penjualan",
                  value: formatRp(totalPenjualan),
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  icon: ArrowDownToLine,
                  bgFill: "bg-gradient-to-r from-[#FFE600] via-[#FFA800] to-[#FF8A00]",
                },
                {
                  label: "Total Pembelian",
                  value: formatRp(totalPembelian),
                  color: "text-red-300",
                  bg: "bg-red-50",
                  icon: ArrowUpFromLine,
                  bgFill: "bg-gradient-to-r from-[#FF007A] via-[#9B00E8] to-[#2E3192]"
                },
                {
                  label: "Saldo Bersih",
                  value: formatRp(Math.abs(saldoBersih)),
                  color: saldoBersih >= 0 ? "text-[#7959FF]" : "text-red-600",
                  bg: "bg-[#F2EFFF]",
                  icon: saldoBersih >= 0 ? ArrowDownToLine : ArrowUpFromLine,
                  prefix: saldoBersih >= 0 ? "+" : "−",
                  bgFill: "bg-gradient-to-r from-[#FF4E00] via-[#FF007A] to-[#FF2A85]"
                },
              ].map(({ label, value, color, bg, icon: Icon, prefix, bgFill, }) => (
                <div key={label} className={`flex items-center gap-3.5 rounded-2xl border border-[#ECEAF4] p-[18px] ${bgFill}`}>
                  <div className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] ${bg} ${color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-wh">{label}</div>
                    <div className={`text-[18px] font-extrabold tracking-tight ${color}`}>
                      {prefix}{value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {/* Tab pills */}
              <div className="flex items-center gap-1 rounded-[11px] border border-[#ECEAF4] p-1 bg-white">
                {(["semua", "sale", "purchase"] as const).map((t) => {
                  const label = t === "semua" ? "Semua" : TRANSACTION_TYPE_LABEL[t];
                  const active = filters.type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilters({ ...filters, type: t })}
                      className={`cursor-pointer rounded-[8px] px-3.5 py-1.5 text-[13px] font-bold transition-all ${active
                        ? "bg-[#7959FF] text-white shadow-sm"
                        : "text-[#6B667E] hover:text-[#1B1730]"
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="flex flex-1 min-w-[180px] max-w-[340px] items-center gap-2 rounded-[11px] border border-[#ECEAF4] bg-white px-3.5 py-2.5 focus-within:border-[#7959FF] transition-colors">
                <Search size={14} className="text-[#C7C2DA] flex-shrink-0" />
                <input
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Cari transaksi..."
                  className="flex-1 bg-transparent text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none"
                />
              </div>

              {/* Metode dropdown */}
              <div className="relative" ref={methodRef}>
                <button
                  onClick={() => setMethodOpen((o) => !o)}
                  className="cursor-pointer flex items-center gap-2 rounded-[11px] border border-[#ECEAF4] bg-white px-3.5 py-2.5 text-[13.5px] font-semibold text-[#1B1730] hover:border-[#C7C2DA] transition-colors"
                >
                  {filters.payment_method === "semua" ? "Semua metode" : filters.payment_method}
                  <ChevronDown size={14} className={`text-[#6B667E] transition-transform ${methodOpen ? "rotate-180" : ""}`} />
                </button>
                {methodOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 rounded-[13px] border border-[#ECEAF4] bg-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] z-10">
                    {PAYMENT_METHODS.map((m) => {
                      const val = m === "Semua metode" ? "semua" : m;
                      const active = filters.payment_method === val;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setFilters({ ...filters, payment_method: val });
                            setMethodOpen(false);
                          }}
                          className={`cursor-pointer flex w-full items-center px-4 py-2.5 text-[13px] font-semibold transition-colors border-b border-[#F5F4FA] last:border-0 ${active ? "text-[#7959FF] bg-[#F7F5FF]" : "text-[#1B1730] hover:bg-[#FAFAFA]"
                            }`}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#ECEAF4] overflow-hidden">
              {/* Table head */}
              <div className="hidden md:grid grid-cols-[160px_1fr_130px_110px_130px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#ECEAF4]">
                {["TANGGAL", "DESKRIPSI", "METODE", "TIPE", "JUMLAH"].map((col) => (
                  <div
                    key={col}
                    className={`text-[11px] font-extrabold text-[#6B667E] tracking-widest uppercase ${col === "JUMLAH" ? "text-right" : ""
                      }`}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#6B667E]">
                  <Loader2 size={28} className="animate-spin text-[#7959FF]" />
                  <span className="text-[13.5px] font-semibold">Memuat transaksi...</span>
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-[14px] font-semibold text-red-600">{error}</p>
                  <button
                    onClick={refetch}
                    className="rounded-lg bg-[#7959FF] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#5F3FE0] transition-colors"
                  >
                    Coba lagi
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2EFFF] text-[#7959FF]">
                    <Receipt size={26} />
                  </div>
                  <p className="text-[14px] font-bold text-[#1B1730]">Belum ada transaksi</p>
                  <p className="text-[13px] text-[#6B667E]">
                    {filters.search || filters.type !== "semua" || filters.payment_method !== "semua"
                      ? "Tidak ada hasil untuk filter ini."
                      : "Mulai catat transaksi pertamamu."}
                  </p>
                </div>
              )}

              {/* Rows */}
              {!loading && !error && transactions.map((tx) => {
                const isSale = tx.type === "sale";
                const desc = buildDescription(tx.details);
                const itemCount = tx.details?.length ?? 0;
                return (
                  <div
                    key={tx.id}
                    className="grid grid-cols-1 md:grid-cols-[160px_1fr_130px_110px_130px] gap-2 md:gap-4 items-center px-5 py-4 border-t border-[#ECEAF4] hover:bg-[#FAFAFA] transition-colors group"
                  >
                    {/* Tanggal */}
                    <div className="text-[13px] font-semibold text-[#1B1730]">
                      {formatDate(tx.transaction_date)}
                    </div>

                    {/* Deskripsi */}
                    <div>
                      <div className="text-[13.5px] font-bold text-[#1B1730] leading-snug">
                        {desc}
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-[#7959FF] font-semibold">
                        {itemCount} item · dicatat oleh {tx.user_name}
                        {tx.note && <span className="text-[#6B667E] font-normal"> · {tx.note}</span>}
                      </div>
                    </div>

                    {/* Metode */}
                    <div className="text-[13px] text-[#6B667E] font-semibold">
                      {tx.payment_method}
                    </div>

                    {/* Tipe badge */}
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold whitespace-nowrap ${isSale
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                          }`}
                      >
                        {TRANSACTION_TYPE_LABEL[tx.type]}
                      </span>
                    </div>

                    {/* Jumlah */}
                    <div
                      className={`text-[14px] font-extrabold text-right ${isSale ? "text-emerald-600" : "text-red-600"
                        }`}
                    >
                      {isSale ? "+" : "−"}
                      {formatRp(tx.total_amount)}
                    </div>
                  </div>
                );
              })}

              {/* Footer: count + pagination */}
              {!loading && !error && totalItems > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEAF4] px-5 py-3.5">
                  <p className="text-[12.5px] font-semibold text-[#6B667E]">
                    Menampilkan {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–
                    {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} transaksi
                  </p>
                  <div className="flex items-center gap-1.5">
                    {getPageNumbers().map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-1.5 text-[13px] text-[#6B667E]">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-bold transition-all ${p === currentPage
                            ? "bg-[#7959FF] text-white shadow-sm"
                            : "text-[#6B667E] hover:bg-[#F2EFFF] hover:text-[#7959FF]"
                            }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[#ECEAF4] bg-white px-2 pb-2.5 pt-2.5 md:hidden">
        {navItems.slice(0, 4).map(({ label, icon: Icon, href }) => {
          const active = label === "Transaksi";
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
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-[64px] right-5 z-[21] flex h-14 w-14 items-center justify-center rounded-full bg-[#7959FF] text-white shadow-[0_14px_24px_-8px_rgba(121,89,255,0.6)] md:hidden hover:bg-[#5F3FE0] transition-colors"
      >
        <Plus size={24} strokeWidth={2.6} />
      </button>

      {/* Modal */}
      {showModal && (
        <ModalTransaksiBaru
          onClose={() => setShowModal(false)}
          onSubmit={createTransaction}
          fetchProducts={fetchProducts}
        />
      )}
    </div>
  );
}
