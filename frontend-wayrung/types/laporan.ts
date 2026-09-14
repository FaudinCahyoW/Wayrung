// ============================================================
// Types untuk domain Laporan
// Catatan: tidak ada tabel "reports" di ERD — semua data di bawah ini
// adalah hasil agregasi dari tabel `transactions` & `transaction_details`
// (join ke `products`), dihitung di backend (SQL GROUP BY / SUM),
// bukan model baru.
// ============================================================

// Rentang waktu untuk semua endpoint laporan
export type ReportRange = "today" | "week" | "month";

// ------------------------------------------------------------
// GET /reports/summary?range=...
// Sumber: transactions (agregat by type & total_amount)
// ------------------------------------------------------------
export interface ReportSummary {
  total_income: number; // total transaksi type = "penjualan"
  total_expense: number; // total transaksi type = "pembelian"
  gross_profit: number; // total_income - total_expense
  transaction_count: number;

  // Persentase perubahan dibanding periode sebelumnya (boleh negatif)
  income_change_percent: number;
  expense_change_percent: number;
  profit_change_percent: number;
  transaction_count_diff: number; // selisih jumlah transaksi (angka, bukan persen)
}

// ------------------------------------------------------------
// GET /reports/sales-chart?range=...
// Sumber: transactions (GROUP BY DATE(transaction_date), type)
// ------------------------------------------------------------
export interface SalesChartPoint {
  date: string; // ISO date, misal "2026-09-07"
  label: string; // label hari singkat untuk sumbu-x, misal "Sen"
  income: number;
  expense: number;
}

export type SalesChartResponse = SalesChartPoint[];

// ------------------------------------------------------------
// GET /reports/top-products?range=...&limit=...
// Sumber: transaction_details JOIN products (SUM(quantity) per product_id)
// ------------------------------------------------------------
export interface TopProduct {
  product_id: number;
  product_name: string;
  sku: string;
  quantity_sold: number;
  revenue: number; // SUM(subtotal) dari transaction_details untuk produk ini
}

export type TopProductsResponse = TopProduct[];

// ------------------------------------------------------------
// GET /reports/payment-methods?range=...
// Sumber: transactions (GROUP BY payment_method)
// ------------------------------------------------------------
export interface PaymentMethodBreakdown {
  payment_method: string; // "Tunai" | "Transfer bank" | "QRIS" (atau sesuai enum backend)
  total_amount: number;
  percentage: number; // 0-100
}

export type PaymentMethodResponse = PaymentMethodBreakdown[];

// ------------------------------------------------------------
// Query params bersama untuk hook useReports
// ------------------------------------------------------------
export interface ReportQuery {
  range: ReportRange;
}