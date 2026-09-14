"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Category, CategoryRequest } from "@/types/product";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ data: Category[] }>("/categories");
      setCategories(res.data.data ?? []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data kategori"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function createCategory(payload: CategoryRequest) {
    const res = await api.post<{ message: string; data: Category }>(
      "/categories",
      payload
    );
    await fetchCategories();
    return res.data;
  }

  async function updateCategory(id: number, payload: CategoryRequest) {
    const res = await api.put<{ message: string; data: Category }>(
      `/categories/${id}`,
      payload
    );
    await fetchCategories();
    return res.data;
  }

  async function deleteCategory(id: number) {
    await api.delete(`/categories/${id}`);
    await fetchCategories();
  }

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
