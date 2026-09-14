"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  Product,
  ProductMeta,
  ProductQuery,
  ProductCreateRequest,
} from "@/types/product";

const DEFAULT_LIMIT = 4;

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductMeta>({
    page: 1,
    limit: DEFAULT_LIMIT,
    total_data: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState<ProductQuery>({
    page: 1,
    limit: DEFAULT_LIMIT,
    search: "",
    sort: "name",
    category_id: undefined,
  });

  // ── Fetch (server-side pagination + filter) ───────────────────────────────
  const fetchProducts = useCallback(async (q: ProductQuery) => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = {
        page: q.page,
        limit: q.limit,
      };
      if (q.search) params.search = q.search;
      if (q.sort) params.sort = q.sort;
      if (q.category_id) params.category_id = q.category_id;

      const res = await api.get<{ data: Product[]; meta: ProductMeta }>(
        "/products",
        { params }
      );
      setProducts(res.data.data ?? []);
      setMeta(res.data.meta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch setiap kali query berubah
  useEffect(() => {
    fetchProducts(query);
  }, [fetchProducts, query]);

  // ── Helpers untuk update query ────────────────────────────────────────────
  function updateQuery(patch: Partial<ProductQuery>) {
    setQuery((prev) => ({
      ...prev,
      ...patch,
      // Setiap kali filter berubah (bukan page), reset ke halaman 1
      page: patch.page !== undefined ? patch.page : 1,
    }));
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async function createProduct(payload: ProductCreateRequest) {
    const res = await api.post<{ message: string; data: Product }>(
      "/products",
      payload
    );
    await fetchProducts(query);
    return res.data;
  }

  async function updateProduct(id: number, payload: ProductCreateRequest) {
    const res = await api.put<{ message: string; data: Product }>(
      `/products/${id}`,
      payload
    );
    await fetchProducts(query);
    return res.data;
  }

  async function deleteProduct(id: number) {
    await api.delete(`/products/${id}`);
    // Jika halaman terakhir tinggal 1 item, mundur ke halaman sebelumnya
    const newTotal = meta.total_data - 1;
    const maxPage = Math.max(1, Math.ceil(newTotal / query.limit));
    const newPage = Math.min(query.page, maxPage);
    await fetchProducts({ ...query, page: newPage });
    setQuery((prev) => ({ ...prev, page: newPage }));
  }

  const totalPages = Math.max(1, Math.ceil(meta.total_data / query.limit));

  return {
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
    refetch: () => fetchProducts(query),
  };
}
