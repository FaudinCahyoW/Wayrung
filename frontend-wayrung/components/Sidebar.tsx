"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Package,
  BarChart3,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Beranda", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Transaksi", icon: Receipt, href: "/transaksi" },
  { label: "Produk", icon: Package, href: "/produk" },
  { label: "Laporan", icon: BarChart3, href: "/laporan" },
  { label: "Pengaturan", icon: Settings, href: "/settings" },
];

function getInitials(name?: string): string {
  if (!name) return "—";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = getInitials(user?.name);

  return (
    <aside className="hidden md:flex flex-col sticky top-0 h-screen bg-[#7959FF] text-white px-5 py-7">
      <div className="flex items-center gap-2.5 pb-8 font-extrabold text-lg tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white/15">◆</span>
        Wayrung
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-[11px] px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors ${
                active
                  ? "bg-white text-[#5F3FE0]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {label}
            </Link>
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
  );
}