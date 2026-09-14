"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  ReportRange,
  ReportSummary,
  SalesChartResponse,
  TopProductsResponse,
  PaymentMethodResponse,
} from "@/types/laporan";

// Backend membungkus payload di dalam { message, data } — konsisten dengan pola endpoint lain
interface ApiEnvelope<T> {
  message: string;
  data: T;
}

const DEFAULT_SUMMARY: ReportSummary = {
  total_income: 0,
  total_expense: 0,
  gross_profit: 0,
  transaction_count: 0,
  income_change_percent: 0,
  expense_change_percent: 0,
  profit_change_percent: 0,
  transaction_count_diff: 0,
};

export function useReports(initialRange: ReportRange = "week") {
  const [range, setRange] = useState<ReportRange>(initialRange);

  const [summary, setSummary] = useState<ReportSummary>(DEFAULT_SUMMARY);
  const [salesChart, setSalesChart] = useState<SalesChartResponse>([]);
  const [topProducts, setTopProducts] = useState<TopProductsResponse>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (r: ReportRange) => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, chartRes, topRes, paymentRes] = await Promise.all([
        api.get<ApiEnvelope<ReportSummary>>("/reports/summary", {
          params: { range: r },
        }),
        api.get<ApiEnvelope<SalesChartResponse>>("/reports/sales-chart", {
          params: { range: r },
        }),
        api.get<ApiEnvelope<TopProductsResponse>>("/reports/top-products", {
          params: { range: r, limit: 5 },
        }),
        api.get<ApiEnvelope<PaymentMethodResponse>>("/reports/payment-methods", {
          params: { range: r },
        }),
      ]);

      setSummary(summaryRes.data.data ?? DEFAULT_SUMMARY);
      setSalesChart(chartRes.data.data ?? []);
      setTopProducts(topRes.data.data ?? []);
      setPaymentMethods(paymentRes.data.data ?? []);
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Gagal memuat data laporan"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(range);
  }, [range, fetchAll]);

  return {
    range,
    setRange,
    summary,
    salesChart,
    topProducts,
    paymentMethods,
    loading,
    error,
    refetch: () => fetchAll(range),
  };
}