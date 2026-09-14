"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function getInitials(name?: string): string {
  if (!name) return "—";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Topbar() {
  const { user } = useAuth();
  const initials = getInitials(user?.name);

  return (
    <header className="flex items-center justify-between gap-5 bg-[#7959FF] px-5 py-4 md:px-8">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-white">Wayrung</h1>
        <p className="mt-0.5 text-[13px] font-medium text-white/70">
          Kelola profil, notifikasi, dan aktivitas akun
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <button className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-white/15 text-white">
          <Bell size={18} />
          <span className="absolute right-[7px] top-[6px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[#7959FF] bg-[#FF6B57]" />
        </button>
        <Link href="/settings">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white/20 text-[13px] font-bold text-white">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
}