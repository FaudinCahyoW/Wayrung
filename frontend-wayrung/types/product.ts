// Tipe data produk & kategori sesuai kontrak backend

export type StockStatus = "Kritis" | "Menipis" | "Aman";

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 5) return "Kritis";
  if (stock <= 10) return "Menipis";
  return "Aman";
}

export interface Product {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

// Meta pagination dari backend GET /products
export interface ProductMeta {
  page: number;
  limit: number;
  total_data: number;
}

// Query params untuk GET /products (server-side)
export interface ProductQuery {
  page: number;
  limit: number;
  search: string;
  sort: string; // "name" | "stock" | "selling_price" | "created_at"
  category_id?: number;
}

// Payload POST/PUT /products
export interface ProductCreateRequest {
  category_id: number;
  name: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
}

// Kategori — GET /categories & POST/PUT /categories
export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryRequest {
  name: string;
}
