## Why

Halaman `/produk` saat ini sudah memiliki kode yang panjang (~1131 baris) namun masih bercampur antara layout, komponen UI, dan logika data dalam satu file. Perlu sebuah spesifikasi formal yang mendokumentasikan perilaku, kontrak komponen, dan desain teknis halaman produk agar pengembangan dan pemeliharaan lebih terstruktur.

## What Changes

- Mendefinisikan spesifikasi fungsional halaman Produk (`/produk`)
- Mendokumentasikan kontrak komponen: `TabProduk`, `TabKategori`, `ModalProduk`, `ModalKategori`, `StockBadge`
- Mendokumentasikan integrasi dengan API backend via hooks `useProducts` dan `useCategories`
- Mendokumentasikan alur filter, sorting, pagination server-side
- Mendokumentasikan CRUD produk dan kategori beserta validasi form
- Mendokumentasikan pengendalian akses berdasarkan `role` (`owner` vs bukan owner)

## Capabilities

### New Capabilities

- `produk/halaman-produk`: Halaman daftar produk dengan tabel, filter kategori, sort, pagination server-side, dan modal CRUD produk & kategori
- `produk/stock-badge`: Komponen badge stok yang menampilkan status kritis/menipis/aman berdasarkan jumlah stok
- `produk/modal-produk`: Form modal untuk tambah dan edit produk dengan validasi
- `produk/modal-kategori`: Form modal untuk tambah dan edit kategori

### Modified Capabilities

<!-- Tidak ada capability yang sudah ada yang dimodifikasi — ini adalah spesifikasi baru -->

## Impact

- **File utama**: `frontend-wayrung/app/produk/page.tsx`
- **Hooks**: `frontend-wayrung/hooks/useProducts.ts`, `frontend-wayrung/hooks/useCategories.ts`
- **Types**: `frontend-wayrung/types/product.ts`
- **API backend**: `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`, `GET /categories`, `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`
- **Auth**: Membaca `user.role` dari `useAuth()` untuk kontrol akses tombol tambah/edit/hapus
