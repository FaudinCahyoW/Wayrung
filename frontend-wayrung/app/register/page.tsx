"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Store } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "kasir", // Default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Gagal mendaftar");
      }

      // Jika berhasil, arahkan pengguna ke halaman login
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat registrasi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F8FD] px-4 py-12 font-sans text-[#1B1730]">
      <div className="w-full max-w-md rounded-[24px] border border-[#ECEAF4] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7959FF] text-white shadow-md">
            <Store size={26} />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="mt-1 text-[13.5px] font-medium text-[#6B667E]">
            Daftarkan akun untuk mengakses sistem Wayrung
          </p>
        </div>

        {/* Pesan Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-3.5 text-center text-[13px] font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Form Register */}
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-[#1B1730]">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Budi Santoso"
              className="mt-1.5 w-full rounded-xl border border-[#ECEAF4] bg-[#FAF9FD] px-4 py-2.5 text-[14px] text-[#1B1730] outline-none transition-all focus:border-[#7959FF] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#1B1730]">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="mt-1.5 w-full rounded-xl border border-[#ECEAF4] bg-[#FAF9FD] px-4 py-2.5 text-[14px] text-[#1B1730] outline-none transition-all focus:border-[#7959FF] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#1B1730]">
              Kata Sandi
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-[#ECEAF4] bg-[#FAF9FD] px-4 py-2.5 text-[14px] text-[#1B1730] outline-none transition-all focus:border-[#7959FF] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#1B1730]">
              Peran (Role)
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-xl border border-[#ECEAF4] bg-[#FAF9FD] px-4 py-2.5 text-[14px] text-[#1B1730] outline-none transition-all focus:border-[#7959FF] focus:bg-white"
            >
              <option value="kasir">Kasir</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#7959FF] px-4 py-3 text-[14px] font-bold text-white transition-all hover:bg-[#6846f7] disabled:opacity-70 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mendaftarkan...
              </>
            ) : (
              <>
                Daftar Sekarang
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] font-medium text-[#6B667E]">
          Sudah punya akun?{" "}
          <a
            href="/login"
            className="font-bold text-[#7959FF] hover:underline"
          >
            Masuk di sini
          </a>
        </p>
      </div>
    </div>
  );
}