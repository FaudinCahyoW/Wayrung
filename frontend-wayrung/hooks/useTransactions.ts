"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Transaction,
  TransactionType,
  CreateTransactionPayload,
  ProductOption,
} from "@/types/transaction";

// ─── Filter & Pagination State ────────────────────────────────────────────────

export interface TransactionFilters {
  search: string;
  type: TransactionType | "semua";
  payment_method: string; // "semua" atau nilai spesifik
}

const PAGE_SIZE = 5;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    type: "semua",
    payment_method: "semua",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ── Fetch semua transaksi dari backend ───────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Transaction[] }>("/transactions");
      setAllTransactions(res.data.data ?? []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Gagal memuat data transaksi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ── Filter lokal ─────────────────────────────────────────────────────────
  const filtered = allTransactions.filter((tx) => {
    // Filter tipe
    if (filters.type !== "semua" && tx.type !== filters.type) return false;

    // Filter metode bayar
    if (
      filters.payment_method !== "semua" &&
      tx.payment_method !== filters.payment_method
    )
      return false;

    // Filter search: cocokkan nama produk di details atau user_name
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const matchProduct = tx.details.some((d) =>
        d.product_name.toLowerCase().includes(q)
      );
      const matchUser = tx.user_name.toLowerCase().includes(q);
      if (!matchProduct && !matchUser) return false;
    }

    return true;
  });

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginated = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  // ── Summary (dihitung dari semua data yang sudah difilter tipe) ──────────
  const totalPenjualan = allTransactions
    .filter((tx) => tx.type === "sale")
    .reduce((sum, tx) => sum + tx.total_amount, 0);

  const totalPembelian = allTransactions
    .filter((tx) => tx.type === "purchase")
    .reduce((sum, tx) => sum + tx.total_amount, 0);

  // ── Create transaksi baru ─────────────────────────────────────────────────
  const createTransaction = async (payload: CreateTransactionPayload) => {
    const res = await api.post<{ message: string; data: Transaction }>(
      "/transactions",
      payload
    );
    // Refresh list setelah berhasil
    await fetchTransactions();
    return res.data;
  };

  // ── Ambil daftar produk untuk dropdown modal ──────────────────────────────
  const fetchProducts = async (): Promise<ProductOption[]> => {
    const res = await api.get<{ data: ProductOption[] }>("/products");
    return res.data.data ?? [];
  };

  return {
    // Data
    transactions: paginated,
    allCount: totalItems,
    loading,
    error,
    // Filter
    filters,
    setFilters,
    // Pagination
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    pageSize: PAGE_SIZE,
    // Summary
    totalPenjualan,
    totalPembelian,
    saldoBersih: totalPenjualan - totalPembelian,
    // Actions
    createTransaction,
    fetchProducts,
    refetch: fetchTransactions,
  };
}
