// Tipe transaksi sesuai kontrak backend: "sale" = penjualan, "purchase" = pembelian
export type TransactionType = "sale" | "purchase";
export type PaymentMethod = "Tunai" | "Transfer bank" | "QRIS" | "Lainnya";

// Label UI (bahasa Indonesia) dari value backend
export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  sale: "Penjualan",
  purchase: "Pembelian",
};

// Rincian item dalam satu transaksi
export interface TransactionDetail {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

// Shape data transaksi dari GET /api/v1/transactions
export interface Transaction {
  id: number;
  user_id: number;
  user_name: string;
  type: TransactionType;
  total_amount: number;
  payment_method: string;
  note: string;
  transaction_date: string; // ISO string
  created_at: string;
  details: TransactionDetail[];
}

// Item di dalam form "Transaksi baru" (untuk tampilan preview)
export interface TransactionItemForm {
  product_id: number;
  product_name: string;
  selling_price: number;
  purchase_price: number;
  quantity: number;
}

// Payload POST /api/v1/transactions
export interface CreateTransactionPayload {
  type: TransactionType;
  payment_method: PaymentMethod;
  note?: string;
  items: { product_id: number; quantity: number }[];
}

// Shape produk dari GET /api/v1/products (untuk dropdown di modal)
export interface ProductOption {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  purchase_price: number;
  stock: number;
}
