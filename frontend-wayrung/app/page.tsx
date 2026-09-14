"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

// Interface untuk tipe data item Transaksi pada tabel dashboard
interface TransactionItem {
  id: number;
  title: string;
  type: "in" | "out"; // 'in' = Pemasukan (hijau), 'out' = Pengeluaran (merah)
  paymentMeta: string;
  amount: number;
  status: string;
}

// Interface untuk tipe data item Produk Stok Menipis
interface StockItem {
  id: number;
  initials: string;
  name: string;
  sku: string;
  stock: number;
  isCritical: boolean; // true = Kritis (stok <= 5), false = Menipis
}

export default function DashboardPage() {
  // Hook router Next.js untuk navigasi antar halaman
  const router = useRouter();
  
  // Mengambil data pengguna aktif dan fungsi logout dari AuthContext
  const { user, logout } = useAuth();

  // State untuk melacak menu navigasi sidebar/mobile yang sedang aktif
  const [activeNav, setActiveNav] = useState<string>("beranda");
  
  // State untuk menyimpan pencarian kata kunci produk atau transaksi
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State untuk menyimpan daftar transaksi terbaru
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  
  // State untuk menyimpan daftar produk stok menipis
  const [lowStockList, setLowStockList] = useState<StockItem[]>([]);
  
  // State ringkasan statistik angka dashboard
  const [stats, setStats] = useState({
    dailyRevenue: 2480000,
    dailyExpense: 640000,
    transactionCount: 18,
    stockValueText: "Rp 41,2jt",
    activeProductsCount: 126,
    lowStockCount: 7,
    revenueTrendText: "12% dari kemarin",
    incomeChangeText: "+8,4%",
    expenseChangeText: "-3,1%",
  });

  // State indikator proses pemuatan data
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper: Mendapatkan inisial nama pengguna (misal: "faudin owner" -> "FO", "Rani Amelia" -> "RA")
  const getInitials = (name?: string): string => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Helper: Format angka menjadi mata uang Rupiah (contoh: 135000 -> "Rp 135.000")
  const formatRupiah = (val: number): string => {
    return "Rp " + val.toLocaleString("id-ID");
  };

  // Helper: Mendapatkan format tanggal bahasa Indonesia saat ini (contoh: "Senin, 7 September 2026")
  const getIndonesianDate = (): string => {
    const today = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const dayName = days[today.getDay()];
    const dateNum = today.getDate();
    const monthName = months[today.getMonth()];
    const year = today.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  };

  // Hook useEffect: Mengambil data dari Backend API atau menggunakan fallback data prototype
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);

        // Fetch data produk & transaksi secara paralel dari API backend
        const [productsRes, txRes] = await Promise.all([
          api.get("/products").catch(() => null),
          api.get("/transactions").catch(() => null),
        ]);

        // 1. Memproses data transaksi dari API jika ada
        if (txRes?.data?.data && Array.isArray(txRes.data.data) && txRes.data.data.length > 0) {
          const apiTxList: TransactionItem[] = txRes.data.data.map((tx: any) => ({
            id: tx.id,
            title: `Transaksi #${tx.id}`,
            type: "in",
            paymentMeta: `${tx.payment_method || 'Tunai'} · ${new Date(tx.created_at || Date.now()).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}`,
            amount: tx.total_amount || 0,
            status: "Selesai",
          }));
          setTransactions(apiTxList);
        } else {
          // Data fallback sesuai prototipe Toko.in
          setTransactions([
            { id: 1, title: "Penjualan — Kopi Arabika 250g ×3", type: "in", paymentMeta: "Tunai · 09:42", amount: 135000, status: "Selesai" },
            { id: 2, title: "Pembelian stok — Gula Aren 1kg ×20", type: "out", paymentMeta: "Transfer bank · 08:15", amount: 460000, status: "Selesai" },
            { id: 3, title: "Penjualan — Teh Melati 100g ×5", type: "in", paymentMeta: "QRIS · 07:58", amount: 175000, status: "Selesai" },
            { id: 4, title: "Penjualan — Cokelat Bubuk 200g ×2", type: "in", paymentMeta: "Tunai · 07:30", amount: 90000, status: "Selesai" },
          ]);
        }

        // 2. Memproses data stok produk dari API jika ada
        if (productsRes?.data?.data && Array.isArray(productsRes.data.data) && productsRes.data.data.length > 0) {
          const lowStock: StockItem[] = productsRes.data.data
            .filter((p: any) => p.stock <= 10)
            .map((p: any) => ({
              id: p.id,
              initials: p.name ? p.name.slice(0, 2).toUpperCase() : "PR",
              name: p.name,
              sku: `SKU ${p.code || 'PR-' + p.id} · sisa ${p.stock}`,
              stock: p.stock,
              isCritical: p.stock <= 5,
            }));
          setLowStockList(lowStock);
        } else {
          // Data fallback untuk stok menipis
          setLowStockList([
            { id: 1, initials: "KA", name: "Kopi Arabika 250g", sku: "SKU KA-250 · sisa 4", stock: 4, isCritical: true },
            { id: 2, initials: "GA", name: "Gula Aren 1kg", sku: "SKU GA-1000 · sisa 6", stock: 6, isCritical: false },
            { id: 3, initials: "TM", name: "Teh Melati 100g", sku: "SKU TM-100 · sisa 8", stock: 8, isCritical: false },
            { id: 4, initials: "CB", name: "Cokelat Bubuk 200g", sku: "SKU CB-200 · sisa 5", stock: 5, isCritical: true },
          ]);
        }
      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Handler untuk keluar / logout dari akun pengguna
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Mengambil nama user dari AuthContext (default: "faudin")
  const userName = user?.name || "faudin";
  
  // Menentukan label role pengguna
  const userRoleText = user?.role === "owner" ? "Pemilik toko" : "Kasir toko";
  
  // Mengambil inisial avatar pengguna
  const userInitials = getInitials(userName);

  return (
    <div className="dashboard-shell">
      {/* ====================================================================
          SIDEBAR DESKTOP (232px)
          ==================================================================== */}
      <aside className="dashboard-sidebar">
        {/* Logo / Merk Brand */}
        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">◆</div>
          Wayrung
        </div>

        {/* Menu Navigasi Utama Sidebar */}
        <nav className="dashboard-nav">
          <button
            className={`dashboard-nav-item ${activeNav === "beranda" ? "active" : ""}`}
            onClick={() => setActiveNav("beranda")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            Beranda
          </button>

          <button
            className={`dashboard-nav-item ${activeNav === "transaksi" ? "active" : ""}`}
            onClick={() => setActiveNav("transaksi")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10l1.5-5h15L21 10" />
              <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
              <path d="M9 14h6" />
            </svg>
            Transaksi
          </button>

          <button
            className={`dashboard-nav-item ${activeNav === "produk" ? "active" : ""}`}
            onClick={() => setActiveNav("produk")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 8 12 3 3 8l9 5 9-5Z" />
              <path d="M3 8v8l9 5 9-5V8" />
              <path d="M12 13v8" />
            </svg>
            Produk
          </button>

          <button
            className={`dashboard-nav-item ${activeNav === "laporan" ? "active" : ""}`}
            onClick={() => setActiveNav("laporan")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="m7 15 4-6 3 3 5-7" />
            </svg>
            Laporan
          </button>

          <button
            className={`dashboard-nav-item ${activeNav === "pengaturan" ? "active" : ""}`}
            onClick={() => setActiveNav("pengaturan")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
            </svg>
            Pengaturan
          </button>
        </nav>

        {/* Info Pengguna & Tombol Logout di Footer Sidebar */}
        <div className="dashboard-sidebar-foot">
          <div className="flex items-center gap-2">
            <div className="dashboard-avatar">{userInitials}</div>
            <div className="who leading-tight">
              <b className="block text-[13.5px] font-bold capitalize">{userName}</b>
              <span className="text-[12px] opacity-70">{userRoleText}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar dari akun"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          AREA MAIN CONTENT DASHBOARD
          ==================================================================== */}
      <div className="dashboard-main">
        {/* Header Topbar */}
        <header className="dashboard-topbar">
          <div>
            <h1>Beranda</h1>
            <div className="sub">Ringkasan toko hari ini</div>
          </div>

          <div className="dashboard-topbar-right">
            {/* Input Pencarian */}
            <div className="dashboard-search">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Cari produk, transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tombol Notifikasi */}
            <button className="dashboard-icon-btn" title="Notifikasi Toko">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              <span className="dashboard-dot-badge"></span>
            </button>

            {/* Avatar Pengguna pada Topbar */}
            <div className="dashboard-topbar-avatar" title={userName}>
              {userInitials}
            </div>
          </div>
        </header>

        {/* Konten Utama Dashboard */}
        <div className="dashboard-content">
          {/* Ucapan Selamat Datang & Tombol Transaksi Baru */}
          <div className="dashboard-greet-row">
            <div>
              <h2 className="capitalize">Selamat datang, {userName} 👋</h2>
              <p>{getIndonesianDate()}</p>
            </div>
            <button className="dashboard-btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Transaksi baru
            </button>
          </div>

          {/* Banner Hero: Pendapatan Hari Ini */}
          <div className="dashboard-hero-stat">
            <div className="dashboard-hero-left">
              <div className="lbl">Pendapatan hari ini</div>
              <div className="num">
                Rp <span>{stats.dailyRevenue.toLocaleString("id-ID")}</span>
              </div>
              <div className="dashboard-hero-trend">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M3 17 10 10l4 4 7-7" />
                </svg>
                {stats.revenueTrendText}
              </div>
            </div>

            <div className="dashboard-hero-right">
              <div className="dashboard-hero-mini">
                <div className="lbl">Transaksi</div>
                <div className="val">{stats.transactionCount}</div>
              </div>
              <div className="dashboard-hero-mini">
                <div className="lbl">Nilai stok</div>
                <div className="val">{stats.stockValueText}</div>
              </div>
              <div className="dashboard-hero-mini">
                <div className="lbl">Produk aktif</div>
                <div className="val">{stats.activeProductsCount}</div>
              </div>
            </div>
          </div>

          {/* Grid 3 Kartu Ringkasan Statistik */}
          <div className="dashboard-stat-grid">
            {/* Kartu Pemasukan Hari Ini */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <div className="dashboard-stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
                <span className="dashboard-stat-change up">{stats.incomeChangeText}</span>
              </div>
              <div className="val">{formatRupiah(stats.dailyRevenue)}</div>
              <div className="lbl">Pemasukan hari ini</div>
            </div>

            {/* Kartu Pengeluaran Hari Ini */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <div className="dashboard-stat-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                </div>
                <span className="dashboard-stat-change down">{stats.expenseChangeText}</span>
              </div>
              <div className="val">{formatRupiah(stats.dailyExpense)}</div>
              <div className="lbl">Pengeluaran hari ini</div>
            </div>

            {/* Kartu Peringatan Stok Menipis */}
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-top">
                <div className="dashboard-stat-icon amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M10.3 3.9 2.5 18a1.8 1.8 0 0 0 1.6 2.6h15.8a1.8 1.8 0 0 0 1.6-2.6L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
                    <path d="M12 9.5v4M12 16.8h.01" />
                  </svg>
                </div>
                <span className="dashboard-stat-change down">{stats.lowStockCount} produk</span>
              </div>
              <div className="val">Stok menipis</div>
              <div className="lbl">Perlu segera diisi ulang</div>
            </div>
          </div>

          {/* Split Panels: Transaksi Terbaru & Stok Menipis */}
          <div className="dashboard-split">
            {/* Panel Kiri: Transaksi Terbaru */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-head">
                <h3>Transaksi terbaru</h3>
                <a onClick={() => setActiveNav("transaksi")}>Lihat semua</a>
              </div>

              {/* Daftar Riwayat Transaksi */}
              {transactions.map((tx) => (
                <div className="dashboard-tx-row" key={tx.id}>
                  <div className={`dashboard-tx-icon ${tx.type === "in" ? "in" : "out"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      {tx.type === "in" ? (
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      ) : (
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      )}
                    </svg>
                  </div>

                  <div className="dashboard-tx-body">
                    <div className="name">{tx.title}</div>
                    <div className="meta">{tx.paymentMeta}</div>
                  </div>

                  <div className="dashboard-tx-amt">
                    <div className={`n ${tx.type === "in" ? "pos" : "neg"}`}>
                      {tx.type === "in" ? "+" : "-"}{formatRupiah(tx.amount)}
                    </div>
                    <div className="t">{tx.status}</div>
                  </div>
                </div>
              ))}

              <button className="dashboard-panel-foot-btn">
                + Catat transaksi baru
              </button>
            </div>

            {/* Panel Kanan: Stok Menipis */}
            <div className="dashboard-panel">
              <div className="dashboard-panel-head">
                <h3>Stok menipis</h3>
                <a onClick={() => setActiveNav("produk")}>Kelola produk</a>
              </div>

              {/* Daftar Produk Stok Menipis */}
              {lowStockList.map((item) => (
                <div className="dashboard-stock-row" key={item.id}>
                  <div className="dashboard-stock-thumb">{item.initials}</div>
                  <div className="dashboard-stock-body">
                    <div className="name">{item.name}</div>
                    <div className="sku">{item.sku}</div>
                  </div>
                  <span className={`dashboard-stock-tag ${item.isCritical ? "crit" : ""}`}>
                    {item.isCritical ? "Kritis" : "Menipis"}
                  </span>
                </div>
              ))}

              <button className="dashboard-panel-foot-btn">
                Lihat semua stok menipis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          NAVIGASI BAWAH UNTUK TAMPILAN MOBILE (Screen width <= 560px)
          ==================================================================== */}
      <nav className="dashboard-bottom-nav">
        <button
          className={`dashboard-bn-item ${activeNav === "beranda" ? "active" : ""}`}
          onClick={() => setActiveNav("beranda")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
          Beranda
        </button>

        <button
          className={`dashboard-bn-item ${activeNav === "transaksi" ? "active" : ""}`}
          onClick={() => setActiveNav("transaksi")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10l1.5-5h15L21 10" />
            <path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
            <path d="M9 14h6" />
          </svg>
          Transaksi
        </button>

        <button
          className={`dashboard-bn-item ${activeNav === "produk" ? "active" : ""}`}
          onClick={() => setActiveNav("produk")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8 12 3 3 8l9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
          </svg>
          Produk
        </button>

        <button
          className={`dashboard-bn-item ${activeNav === "laporan" ? "active" : ""}`}
          onClick={() => setActiveNav("laporan")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="m7 15 4-6 3 3 5-7" />
          </svg>
          Laporan
        </button>

        <button
          className={`dashboard-bn-item ${activeNav === "pengaturan" ? "active" : ""}`}
          onClick={() => setActiveNav("pengaturan")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
          </svg>
          Akun
        </button>
      </nav>

      {/* Floating Action Button (FAB) Mobile untuk Tambah Transaksi */}
      <button className="dashboard-fab" title="Transaksi Baru">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
