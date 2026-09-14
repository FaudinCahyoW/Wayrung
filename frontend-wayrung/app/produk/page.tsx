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
  Pencil,
  Trash2,
  X,
  Loader2,
  User,
  Check,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import {
  Product,
  ProductMeta,
  ProductQuery,
  ProductCreateRequest,
  Category,
  getStockStatus,
} from "@/types/product";
import Image from "next/image";
// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Nama" },
  { value: "stock", label: "Stok" },
  { value: "selling_price", label: "Harga Jual" },
  { value: "created_at", label: "Terbaru" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StockBadge({ stock }: { stock: number }) {
  const status = getStockStatus(stock);
  const cls =
    status === "Kritis"
      ? "bg-red-50 text-red-700"
      : status === "Menipis"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold whitespace-nowrap ${cls}`}
    >
      {stock} — {status}
    </span>
  );
}

// ─── Modal Produk (Tambah / Edit) ─────────────────────────────────────────────

interface ModalProdukProps {
  initial?: Product | null;
  categories: Category[];
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (payload: ProductCreateRequest) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete?: () => Promise<any>;
}

function ModalProduk({
  initial,
  categories,
  onClose,
  onSave,
  onDelete,
}: ModalProdukProps) {
  const isEdit = !!initial;
  const [form, setForm] = useState<ProductCreateRequest>({
    category_id: initial?.category_id ?? (categories[0]?.id ?? 0),
    name: initial?.name ?? "",
    sku: initial?.sku ?? "",
    purchase_price: initial?.purchase_price ?? 0,
    selling_price: initial?.selling_price ?? 0,
    stock: initial?.stock ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "purchase_price" ||
          name === "selling_price" ||
          name === "stock" ||
          name === "category_id"
          ? Number(value)
          : value,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) return setFormError("Nama produk wajib diisi.");
    if (!form.sku.trim()) return setFormError("SKU wajib diisi.");
    if (!form.category_id) return setFormError("Pilih kategori.");
    if (form.selling_price <= 0)
      return setFormError("Harga jual harus lebih dari 0.");
    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menyimpan produk."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      setDeleting(true);
      await onDelete();
      onClose();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menghapus produk."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[480px] rounded-[20px] bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#ECEAF4] flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#1B1730]">
              {isEdit ? "Edit Produk" : "Tambah Produk"}
            </h2>
            <p className="text-[12.5px] text-[#6B667E] mt-0.5">
              {isEdit ? "Perbarui informasi produk" : "Isi detail produk baru"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2EFFF] text-[#7959FF] hover:bg-[#E7E1FF] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-1.5">
              Nama Produk
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="cth. Kopi Arabika 250g"
              className="w-full rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none focus:border-[#7959FF] transition-colors"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-1.5">
              SKU
            </label>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="cth. KA-250"
              className="w-full rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none focus:border-[#7959FF] transition-colors"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-1.5">
              Kategori
            </label>
            <div className="relative">
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full appearance-none rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 pr-10 text-[13.5px] font-semibold text-[#1B1730] bg-white outline-none focus:border-[#7959FF] transition-colors cursor-pointer"
              >
                <option value={0} disabled>
                  Pilih kategori...
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B667E]"
              />
            </div>
          </div>

          {/* Harga Beli & Jual */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                name: "purchase_price",
                label: "Harga Beli",
                val: form.purchase_price,
              },
              {
                name: "selling_price",
                label: "Harga Jual",
                val: form.selling_price,
              },
            ].map(({ name, label, val }) => (
              <div key={name}>
                <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-1.5">
                  {label}
                </label>
                <div className="flex items-center rounded-[11px] border border-[#ECEAF4] overflow-hidden focus-within:border-[#7959FF] transition-colors">
                  <span className="px-3 py-2.5 text-[13px] font-bold text-[#6B667E] bg-[#FAFAFA] border-r border-[#ECEAF4]">
                    Rp
                  </span>
                  <input
                    type="number"
                    name={name}
                    value={val}
                    onChange={handleChange}
                    min={0}
                    className="flex-1 px-3 py-2.5 text-[13.5px] text-[#1B1730] outline-none bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Stok */}
          <div>
            <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-1.5">
              {isEdit ? "Stok" : "Stok Awal"}
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min={0}
              className="w-full rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 text-[13.5px] text-[#1B1730] outline-none focus:border-[#7959FF] transition-colors"
            />
          </div>

          {formError && (
            <p className="rounded-[10px] bg-red-50 text-red-600 text-[13px] font-semibold px-4 py-2.5">
              {formError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pt-4 pb-5 border-t border-[#ECEAF4] flex-shrink-0">
          {/* Tombol hapus (edit mode) */}
          {isEdit && onDelete && (
            <div className="mb-3">
              {confirmDelete ? (
                <div className="flex items-center gap-2 rounded-[11px] bg-red-50 border border-red-200 px-4 py-2.5">
                  <span className="flex-1 text-[12.5px] font-semibold text-red-700">
                    Yakin hapus produk ini?
                  </span>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-[12px] font-bold text-[#6B667E] hover:text-[#1B1730]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {deleting && <Loader2 size={12} className="animate-spin" />}
                    Hapus
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Hapus produk ini
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-[11px] border border-[#ECEAF4] py-2.5 text-[13.5px] font-bold text-[#6B667E] hover:border-[#C7C2DA] hover:text-[#1B1730] transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-[11px] bg-[#7959FF] py-2.5 text-[13.5px] font-bold text-white hover:bg-[#5F3FE0] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Kategori (Tambah / Edit) ──────────────────────────────────────────

interface ModalKategoriProps {
  initial?: Category | null;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (name: string) => Promise<any>;
}

function ModalKategori({ initial, onClose, onSave }: ModalKategoriProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setErr("Nama kategori wajib diisi.");
    try {
      setSaving(true);
      await onSave(name.trim());
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[360px] rounded-[18px] bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-extrabold text-[#1B1730]">
            {initial ? "Edit Kategori" : "Tambah Kategori"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F2EFFF] text-[#7959FF] hover:bg-[#E7E1FF] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <label className="block text-[12px] font-bold text-[#6B667E] uppercase tracking-widest mb-1.5">
          Nama Kategori
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth. Minuman bubuk"
          className="w-full rounded-[11px] border border-[#ECEAF4] px-3.5 py-2.5 text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none focus:border-[#7959FF] transition-colors mb-4"
          autoFocus
        />
        {err && (
          <p className="mb-3 rounded-[10px] bg-red-50 text-red-600 text-[12.5px] font-semibold px-3 py-2">
            {err}
          </p>
        )}
        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-[11px] border border-[#ECEAF4] py-2.5 text-[13px] font-bold text-[#6B667E] hover:border-[#C7C2DA] transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-[11px] bg-[#7959FF] py-2.5 text-[13px] font-bold text-white hover:bg-[#5F3FE0] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Semua Produk ────────────────────────────────────────────────────────

interface TabProdukProps {
  isOwner: boolean;
  categories: Category[];
  products: Product[];
  meta: ProductMeta;
  loading: boolean;
  error: string | null;
  query: ProductQuery;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateQuery: (patch: Partial<ProductQuery>) => void;
  totalPages: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createProduct: (payload: ProductCreateRequest) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProduct: (id: number, payload: ProductCreateRequest) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteProduct: (id: number) => Promise<any>;
  refetch: () => void;
}

function TabProduk({
  isOwner,
  categories,
  products,
  meta,
  loading,
  error,
  query,
  updateQuery,
  totalPages,
  createProduct,
  updateProduct,
  deleteProduct,
  refetch,
}: TabProdukProps) {

  const [sortOpen, setSortOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [modalProduk, setModalProduk] = useState<
    "add" | Product | null
  >(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setSortOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node))
        setCatOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedSort =
    SORT_OPTIONS.find((s) => s.value === query.sort)?.label ?? "Nama";
  const selectedCatName =
    query.category_id
      ? categories.find((c) => c.id === query.category_id)?.name ?? "Kategori"
      : "Semua kategori";

  function getPageNumbers() {
    const delta = 1;
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= query.page - delta && i <= query.page + delta)
      ) {
        pages.push(i);
      } else if (
        (i === query.page - delta - 1 && i > 1) ||
        (i === query.page + delta + 1 && i < totalPages)
      ) {
        pages.push("...");
      }
    }
    return pages;
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex flex-1 min-w-[180px] max-w-[300px] items-center gap-2 rounded-[11px] border border-[#ECEAF4] bg-white px-3.5 py-2.5 focus-within:border-[#7959FF] transition-colors">
          <Search size={14} className="text-[#C7C2DA] flex-shrink-0" />
          <input
            value={query.search}
            onChange={(e) => updateQuery({ search: e.target.value })}
            placeholder="Cari produk atau SKU..."
            className="flex-1 bg-transparent text-[13.5px] text-[#1B1730] placeholder-[#C7C2DA] outline-none"
          />
        </div>

        {/* Kategori dropdown */}
        <div className="relative" ref={catRef}>
          <button
            onClick={() => setCatOpen((o) => !o)}
            className="cursor-pointer flex items-center gap-2 rounded-[11px] border border-[#ECEAF4] bg-white px-3.5 py-2.5 text-[13.5px] font-semibold text-[#1B1730] hover:border-[#C7C2DA] transition-colors"
          >
            {selectedCatName}
            <ChevronDown
              size={14}
              className={`text-[#6B667E] transition-transform ${catOpen ? "rotate-180" : ""}`}
            />
          </button>
          {catOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 rounded-[13px] border border-[#ECEAF4] bg-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] z-10 max-h-52 overflow-y-auto">
              <button
                onClick={() => {
                  updateQuery({ category_id: undefined });
                  setCatOpen(false);
                }}
                className={`cursor-pointer flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold border-b border-[#F5F4FA] transition-colors ${!query.category_id
                    ? "text-[#7959FF] bg-[#F7F5FF]"
                    : "text-[#1B1730] hover:bg-[#FAFAFA]"
                  }`}
              >
                Semua kategori
                {!query.category_id && (
                  <Check size={13} className="text-[#7959FF]" />
                )}
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    updateQuery({ category_id: c.id });
                    setCatOpen(false);
                  }}
                  className={`cursor-pointer flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold border-b border-[#F5F4FA] last:border-0 transition-colors ${query.category_id === c.id
                      ? "text-[#7959FF] bg-[#F7F5FF]"
                      : "text-[#1B1730] hover:bg-[#FAFAFA]"
                    }`}
                >
                  {c.name}
                  {query.category_id === c.id && (
                    <Check size={13} className="text-[#7959FF]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="cursor-pointer flex items-center gap-2 rounded-[11px] border border-[#ECEAF4] bg-white px-3.5 py-2.5 text-[13.5px] font-semibold text-[#1B1730] hover:border-[#C7C2DA] transition-colors"
          >
            Urutkan: {selectedSort}
            <ChevronDown
              size={14}
              className={`text-[#6B667E] transition-transform ${sortOpen ? "rotate-180" : ""}`}
            />
          </button>
          {sortOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-44 rounded-[13px] border border-[#ECEAF4] bg-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.12)] z-10">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    updateQuery({ sort: s.value });
                    setSortOpen(false);
                  }}
                  className={`cursor-pointer flex w-full items-center justify-between px-4 py-2.5 text-[13px] font-semibold border-b border-[#F5F4FA] last:border-0 transition-colors ${query.sort === s.value
                      ? "text-[#7959FF] bg-[#F7F5FF]"
                      : "text-[#1B1730] hover:bg-[#FAFAFA]"
                    }`}
                >
                  {s.label}
                  {query.sort === s.value && (
                    <Check size={13} className="text-[#7959FF]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-2xl border border-[#ECEAF4] overflow-hidden">
        {/* Head */}
        <div className="hidden md:grid grid-cols-[2fr_1.2fr_120px_120px_140px_44px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#ECEAF4]">
          {["PRODUK", "KATEGORI", "HARGA BELI", "HARGA JUAL", "STOK", ""].map(
            (col) => (
              <div
                key={col}
                className="text-[11px] font-extrabold text-[#6B667E] tracking-widest uppercase"
              >
                {col}
              </div>
            )
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin text-[#7959FF]" />
            <span className="text-[13.5px] font-semibold text-[#6B667E]">
              Memuat produk...
            </span>
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

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2EFFF] text-[#7959FF]">
              <Package size={26} />
            </div>
            <p className="text-[14px] font-bold text-[#1B1730]">
              Belum ada produk
            </p>
            <p className="text-[13px] text-[#6B667E]">
              {query.search || query.category_id
                ? "Tidak ada hasil untuk filter ini."
                : "Tambahkan produk pertamamu."}
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading &&
          !error &&
          products.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_120px_120px_140px_44px] gap-2 md:gap-4 items-center px-5 py-3.5 border-t border-[#ECEAF4] hover:bg-[#FAFAFA] transition-colors"
            >
              {/* Produk */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#F2EFFF] text-[13px] font-extrabold text-[#5F3FE0]">
                  {getInitials(p.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[#1B1730] truncate">
                    {p.name}
                  </div>
                  <div className="text-[11.5px] font-semibold text-[#7959FF]">
                    SKU {p.sku}
                  </div>
                </div>
              </div>

              {/* Kategori */}
              <div className="text-[13px] text-[#6B667E] font-semibold">
                {p.category_name}
              </div>

              {/* Harga Beli */}
              <div className="text-[13px] font-semibold text-[#1B1730]">
                {formatRp(p.purchase_price)}
              </div>

              {/* Harga Jual */}
              <div className="text-[13px] font-semibold text-[#1B1730]">
                {formatRp(p.selling_price)}
              </div>

              {/* Stok */}
              <div>
                <StockBadge stock={p.stock} />
              </div>

              {/* Edit */}
              {isOwner && (
                <button
                  onClick={() => setModalProduk(p)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#C7C2DA] hover:text-[#7959FF] hover:bg-[#F2EFFF] transition-all"
                  title="Edit produk"
                >
                  <Pencil size={15} />
                </button>
              )}
            </div>
          ))}

        {/* Footer pagination */}
        {!loading && !error && meta.total_data > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECEAF4] px-5 py-3.5">
            <p className="text-[12.5px] font-semibold text-[#6B667E]">
              Menampilkan{" "}
              {Math.min((query.page - 1) * query.limit + 1, meta.total_data)}–
              {Math.min(query.page * query.limit, meta.total_data)} dari{" "}
              {meta.total_data} produk
            </p>
            <div className="flex items-center gap-1.5">
              {getPageNumbers().map((p, idx) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1.5 text-[13px] text-[#6B667E]"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateQuery({ page: p as number })}
                    className={`flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-bold transition-all ${p === query.page
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

      {/* Modal Produk */}
      {modalProduk !== null && (
        <ModalProduk
          initial={modalProduk === "add" ? null : modalProduk}
          categories={categories}
          onClose={() => setModalProduk(null)}
          onSave={(payload) =>
            modalProduk === "add"
              ? createProduct(payload)
              : updateProduct((modalProduk as Product).id, payload)
          }
          onDelete={
            modalProduk !== "add"
              ? () => deleteProduct((modalProduk as Product).id)
              : undefined
          }
        />
      )}

      {/* FAB tambah produk di mobile */}
      {isOwner && (
        <button
          onClick={() => setModalProduk("add")}
          className="fixed bottom-[64px] right-5 z-[21] flex h-14 w-14 items-center justify-center rounded-full bg-[#7959FF] text-white shadow-[0_14px_24px_-8px_rgba(121,89,255,0.6)] md:hidden hover:bg-[#5F3FE0] transition-colors"
        >
          <Plus size={24} strokeWidth={2.6} />
        </button>
      )}
    </>
  );
}

// ─── Tab: Kategori ────────────────────────────────────────────────────────────

function TabKategori({ isOwner }: { isOwner: boolean }) {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory, refetch } =
    useCategories();
  const [modal, setModal] = useState<"add" | Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    try {
      setDeletingId(id);
      await deleteCategory(id);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  return (
    <>
      {isOwner && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setModal("add")}
            className="cursor-pointer flex items-center gap-2 rounded-xl bg-[#7959FF] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#5F3FE0] transition-colors shadow-[0_8px_16px_-6px_rgba(121,89,255,0.5)]"
          >
            <Plus size={15} strokeWidth={2.6} />
            Tambah kategori
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-[#ECEAF4] overflow-hidden">
        {/* Head */}
        <div className="grid grid-cols-[1fr_160px_80px] gap-4 px-5 py-3 bg-[#FAFAFA] border-b border-[#ECEAF4]">
          {["NAMA KATEGORI", "DIBUAT", ""].map((col) => (
            <div
              key={col}
              className="text-[11px] font-extrabold text-[#6B667E] tracking-widest uppercase"
            >
              {col}
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-[#6B667E]">
            <Loader2 size={20} className="animate-spin text-[#7959FF]" />
            <span className="text-[13px] font-semibold">Memuat kategori...</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-12 gap-3">
            <p className="text-[13.5px] font-semibold text-red-600">{error}</p>
            <button
              onClick={refetch}
              className="rounded-lg bg-[#7959FF] px-4 py-2 text-[12.5px] font-bold text-white"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!loading && !error && categories.length === 0 && (
          <p className="py-12 text-center text-[13.5px] text-[#6B667E] font-semibold">
            Belum ada kategori.
          </p>
        )}

        {!loading &&
          !error &&
          categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-[1fr_160px_80px] gap-4 items-center px-5 py-3.5 border-t border-[#ECEAF4] hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="text-[13.5px] font-bold text-[#1B1730]">
                {cat.name}
              </div>
              <div className="text-[12.5px] text-[#6B667E] font-semibold">
                {new Date(cat.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
              {isOwner && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setModal(cat)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#C7C2DA] hover:text-[#7959FF] hover:bg-[#F2EFFF] transition-all"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  {confirmId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Konfirmasi hapus"
                      >
                        {deletingId === cat.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#C7C2DA] hover:text-[#6B667E] transition-colors"
                        title="Batal"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(cat.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#C7C2DA] hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      {modal !== null && (
        <ModalKategori
          initial={modal === "add" ? null : modal}
          onClose={() => setModal(null)}
          onSave={(name) =>
            modal === "add"
              ? createCategory({ name })
              : updateCategory((modal as Category).id, { name })
          }
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProdukPage() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const [
    activeTab,
    setActiveTab,
  ] = useState<"produk" | "kategori">("produk");
  const [showModalAdd, setShowModalAdd] = useState(false);

  // ── useProducts di-lift ke level page agar modal header berbagi state dengan TabProduk
  const {
    products,
    meta,
    loading: productsLoading,
    error: productsError,
    query,
    updateQuery,
    totalPages,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  } = useProducts();

  const isOwner = user?.role === "owner";
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "—";

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
              <h1 className="text-xl font-extrabold tracking-tight">Produk</h1>
              <p className="mt-0.5 text-[13px] font-medium/70">
                Kelola produk, harga, dan stok
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

            {/* Page heading + CTA */}
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-extrabold tracking-tight">
                  Produk
                </h2>
                <p className="mt-1 text-[13.5px] text-[#6B667E]">
                  Kelola produk, harga, dan stok
                </p>
              </div>
              {isOwner && activeTab === "produk" && (
                <button
                  onClick={() => setShowModalAdd(true)}
                  className="hidden md:inline-flex items-center gap-2 rounded-xl bg-[#7959FF] px-[18px] py-[11px] text-[13.5px] font-bold text-white shadow-[0_10px_20px_-8px_rgba(121,89,255,0.55)] hover:bg-[#5F3FE0] transition-colors"
                >
                  <Plus size={16} strokeWidth={2.6} />
                  Tambah produk
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="mb-5 flex gap-0 border-b border-[#ECEAF4]">
              {(["produk", "kategori"] as const).map((tab) => {
                const label =
                  tab === "produk" ? "Semua produk" : "Kategori";
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`cursor-pointer px-4 pb-3 text-[14px] font-bold border-b-2 transition-all ${active
                        ? "border-[#7959FF] text-[#7959FF]"
                        : "border-transparent text-[#6B667E] hover:text-[#1B1730]"
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {activeTab === "produk" ? (
              <TabProduk
                isOwner={isOwner}
                categories={categories}
                products={products}
                meta={meta}
                loading={productsLoading}
                error={productsError}
                query={query}
                updateQuery={updateQuery}
                totalPages={totalPages}
                createProduct={createProduct}
                updateProduct={updateProduct}
                deleteProduct={deleteProduct}
                refetch={refetch}
              />
            ) : (
              <TabKategori isOwner={isOwner} />
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-[#ECEAF4] bg-white px-2 pb-2.5 pt-2.5 md:hidden">
        {navItems.slice(0, 4).map(({ label, icon: Icon, href }) => {
          const active = label === "Produk";
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
        <a
          href="#"
          className="flex flex-col items-center gap-1 px-2.5 py-1 text-[10.5px] font-bold text-[#6B667E]"
        >
          <User size={20} />
          Akun
        </a>
      </nav>

      {/* Modal tambah dari tombol desktop */}
      {showModalAdd && (
        <ModalProduk
          initial={null}
          categories={categories}
          onClose={() => setShowModalAdd(false)}
          onSave={async (payload) => {
            await createProduct(payload);
            setShowModalAdd(false);
          }}
        />
      )}
    </div>
  );
}
