"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Receipt,
  UserPlus,
  Check,
  LayoutDashboard,
  Package,
  BarChart3,
  Settings,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string; // "stock" | "transaction" | dll
  is_read: boolean;
  created_at: string;
}

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/transaksi" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotifikasiPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data dari API Backend Go
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8080/api/v1/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const result = await res.json();

        if (res.ok) {
          // Proteksi: Cek apakah response berupa array langsung atau terbungkus di .data
          const list = Array.isArray(result)
            ? result
            : Array.isArray(result.data)
            ? result.data
            : [];

          setNotifications(list);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error("Gagal mengambil data notifikasi:", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  // Memastikan notifications adalah array sebelum dipanggil filter
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.is_read).length
    : 0;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "—";

  // Tandai 1 notifikasi spesifik sebagai dibaca
  async function markAsRead(id: number) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:8080/api/v1/notifications/${id}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error("Gagal memperbarui status notifikasi:", err);
    }
  }

  // Tandai semua notifikasi sebagai dibaca secara paralel
  async function markAllAsRead() {
    if (!Array.isArray(notifications)) return;
    const unreadItems = notifications.filter((n) => !n.is_read);
    try {
      await Promise.all(unreadItems.map((n) => markAsRead(n.id)));
    } catch (err) {
      console.error("Gagal menandai semua notifikasi:", err);
    }
  }

  function renderIcon(type: string) {
    if (type === "stock") {
      return (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <AlertTriangle size={18} />
        </div>
      );
    }
    if (type === "transaction") {
      return (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Receipt size={18} />
        </div>
      );
    }
    return (
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <UserPlus size={18} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1B1730] font-sans">
      <div className="grid grid-cols-1 md:grid-cols-[232px_1fr]">
        {/* Sidebar */}
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

        {/* Main Content */}
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="flex items-center justify-between gap-5 px-5 py-4 md:px-8 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)]">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Notifikasi</h1>
              <p className="mt-0.5 text-[13px] font-medium text-[#6B667E]">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua dibaca"}
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

          {/* Body */}
          <main className="flex-1 px-5 py-8 md:px-10 max-w-5xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#1B1730]">
                  Notifikasi
                </h2>
                <p className="mt-1 text-[13.5px] text-[#6B667E]">
                  {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua dibaca"}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 rounded-xl border border-[#ECEAF4] bg-white px-4 py-2.5 text-[13px] font-bold text-[#1B1730] hover:bg-[#F9F8FD] transition-all cursor-pointer shadow-sm"
                >
                  <Check size={16} className="text-emerald-600" />
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* List Notifikasi */}
            <div className="rounded-[20px] border border-[#ECEAF4] bg-white overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-[#6B667E] text-[13.5px]">
                  <Loader2 size={18} className="animate-spin text-[#7959FF]" />
                  Memuat notifikasi...
                </div>
              ) : !Array.isArray(notifications) || notifications.length === 0 ? (
                <div className="py-16 text-center text-[#6B667E] text-[14px]">
                  Tidak ada notifikasi.
                </div>
              ) : (
                notifications.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => !item.is_read && markAsRead(item.id)}
                    className={`relative flex items-start gap-4 px-6 py-4.5 transition-colors cursor-pointer ${
                      idx !== notifications.length - 1 ? "border-b border-[#ECEAF4]" : ""
                    } ${!item.is_read ? "bg-white hover:bg-[#F8F6FE]" : "bg-[#FAF9FD]/60"}`}
                  >
                    {!item.is_read ? (
                      <span className="absolute left-3.5 top-6 h-2 w-2 rounded-full bg-[#7959FF]" />
                    ) : (
                      <span className="w-2" />
                    )}

                    {renderIcon(item.type)}

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-[14.5px] leading-snug ${
                          !item.is_read ? "font-extrabold text-[#1B1730]" : "font-bold text-[#504A66]"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-0.5 text-[13px] text-[#6B667E] leading-relaxed">
                        {item.message}
                      </p>
                      <span className="mt-1.5 block text-[11.5px] font-medium text-[#A39EBC]">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}