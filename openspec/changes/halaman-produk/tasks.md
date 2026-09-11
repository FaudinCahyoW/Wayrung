## 1. Types & Data Model

- [x] 1.1 Verifikasi `types/product.ts` memiliki semua interface yang dibutuhkan (`Product`, `ProductMeta`, `ProductQuery`, `ProductCreateRequest`, `Category`, `CategoryRequest`) dan fungsi `getStockStatus` dengan threshold yang benar (≤5 Kritis, ≤10 Menipis, >10 Aman) — buka file dan cek setiap interface.
- [x] 1.2 Verifikasi hook `useProducts` meng-expose `products`, `meta`, `loading`, `error`, `query`, `updateQuery`, `totalPages`, `createProduct`, `updateProduct`, `deleteProduct`, `refetch` — cek return value di `hooks/useProducts.ts`.
- [x] 1.3 Verifikasi hook `useCategories` meng-expose `categories`, `loading`, `error`, `createCategory`, `updateCategory`, `deleteCategory`, `refetch` — cek return value di `hooks/useCategories.ts`.

## 2. Komponen StockBadge

- [x] 2.1 Verifikasi komponen `StockBadge` menampilkan warna merah untuk stok ≤ 5, amber untuk 6–10, dan hijau untuk > 10 — render badge dengan stok = 4, 8, 240 dan periksa kelas CSS yang dihasilkan.
- [x] 2.2 Verifikasi format teks badge adalah `{angka} — {status}` (contoh: "4 — Kritis") — cek output render komponen.

## 3. Komponen ModalProduk

- [x] 3.1 Verifikasi modal terbuka dalam mode "Tambah" dengan field kosong saat dipanggil dengan `initial={null}` — buka halaman produk, klik "+ Tambah produk", periksa field kosong dan judul "Tambah Produk".
- [x] 3.2 Verifikasi modal terbuka dalam mode "Edit" dengan data produk terisi saat dipanggil dengan objek produk — klik ikon pensil pada baris produk, periksa field terisi dengan data produk.
- [x] 3.3 Verifikasi validasi menampilkan error "Nama produk wajib diisi." saat nama kosong — di modal tambah, klik Simpan tanpa mengisi nama.
- [x] 3.4 Verifikasi validasi menampilkan error "SKU wajib diisi." saat SKU kosong — isi nama, biarkan SKU kosong, klik Simpan.
- [x] 3.5 Verifikasi validasi menampilkan error "Harga jual harus lebih dari 0." saat harga jual = 0 — isi nama & SKU, biarkan harga jual = 0, klik Simpan.
- [x] 3.6 Verifikasi simpan produk baru memanggil `POST /products` dan menutup modal — isi semua field valid, klik Simpan, verifikasi request di Network tab dan modal tertutup.
- [x] 3.7 Verifikasi edit produk memanggil `PUT /products/:id` — buka modal edit, ubah nama, klik Simpan, verifikasi request di Network tab.
- [x] 3.8 Verifikasi konfirmasi hapus dua langkah — di modal edit, klik "Hapus produk ini", verifikasi muncul tombol konfirmasi "Hapus" dan "Batal".
- [x] 3.9 Verifikasi konfirmasi hapus memanggil `DELETE /products/:id` — klik konfirmasi "Hapus", verifikasi request di Network tab dan modal tertutup.
- [x] 3.10 Verifikasi modal tertutup saat klik overlay backdrop — klik area gelap di luar modal, verifikasi modal hilang tanpa menyimpan.

## 4. Tab Semua Produk — Tabel & Filter

- [x] 4.1 Verifikasi tabel menampilkan kolom: Produk (nama, SKU, avatar inisial), Kategori, Harga Beli, Harga Jual, Stok (badge) — muat halaman dan periksa header kolom dan baris data.
- [x] 4.2 Verifikasi inisial avatar diambil dari 2 huruf pertama kata-kata nama produk (contoh: "Kopi Arabika" → "KA") — periksa avatar pada baris produk.
- [x] 4.3 Verifikasi harga ditampilkan dalam format Rupiah (contoh: "Rp 32.000") — periksa kolom Harga Beli dan Harga Jual.
- [x] 4.4 Verifikasi input pencarian memfilter produk via `GET /products?search=...` — ketik "Kopi" di kolom pencarian dan periksa request di Network tab.
- [x] 4.5 Verifikasi memilih kategori dari dropdown mengirim `GET /products?category_id=...` — pilih kategori dari dropdown dan periksa request.
- [x] 4.6 Verifikasi memilih "Semua kategori" menghilangkan parameter `category_id` — pilih "Semua kategori" dan periksa request tanpa `category_id`.
- [x] 4.7 Verifikasi dropdown sort mengirim parameter `sort` yang sesuai (nama/stok/selling_price/created_at) — ubah urutan dan periksa request.
- [x] 4.8 Verifikasi setiap perubahan filter (bukan page) mereset halaman ke 1 — ganti filter saat berada di halaman 2, verifikasi kembali ke halaman 1.

## 5. Tab Semua Produk — Paginasi

- [x] 5.1 Verifikasi info paginasi "Menampilkan X–Y dari Z produk" ditampilkan — muat halaman dengan data > 0 dan periksa teks.
- [x] 5.2 Verifikasi tombol nomor halaman memanggil `GET /products?page=...` — klik nomor halaman 2 dan periksa request.
- [x] 5.3 Verifikasi halaman aktif ditandai dengan latar ungu dan teks putih — periksa styling tombol halaman aktif.

## 6. Kontrol Akses Role Owner

- [x] 6.1 Verifikasi tombol "+ Tambah produk" di header hanya muncul saat `user.role === "owner"` dan tab aktif "Semua produk" — login sebagai owner dan non-owner, bandingkan tampilan.
- [x] 6.2 Verifikasi kolom edit (ikon pensil per baris) hanya dirender saat `user.role === "owner"` — login sebagai non-owner dan verifikasi tidak ada ikon pensil di tabel.
- [x] 6.3 Verifikasi tombol "Tambah kategori" di tab Kategori hanya muncul saat `user.role === "owner"` — pindah ke tab Kategori sebagai non-owner dan verifikasi tombol tidak ada.

## 7. Tab Kategori

- [x] 7.1 Verifikasi tab Kategori menampilkan tabel dengan kolom "Nama Kategori" dan "Dibuat" — klik tab Kategori dan periksa header kolom.
- [x] 7.2 Verifikasi tanggal dibuat ditampilkan dalam format lokal Indonesia (contoh: "9 Sep 2026") — periksa kolom Dibuat pada baris kategori.
- [x] 7.3 Verifikasi modal "Tambah Kategori" terbuka dengan field kosong dan focus otomatis — klik tombol "Tambah kategori" dan periksa focus input.
- [x] 7.4 Verifikasi modal "Edit Kategori" terbuka dengan nama terisi — klik ikon pensil pada kategori dan periksa field nama terisi.
- [x] 7.5 Verifikasi konfirmasi hapus kategori inline (tombol centang + X) muncul saat klik ikon Trash2 — klik ikon hapus pada kategori dan verifikasi tombol konfirmasi muncul inline.
- [x] 7.6 Verifikasi konfirmasi hapus memanggil `DELETE /categories/:id` — klik tombol centang konfirmasi dan periksa request di Network tab.

## 8. Perbaikan Bug

- [x] 8.1 Perbaiki modal "Tambah produk" di header yang tidak me-refresh daftar produk di `TabProduk` setelah simpan — `useProducts` di-lift ke level `ProdukPage`, state `products`/`meta`/dll diteruskan sebagai props ke `TabProduk`, dan `onSave` di modal header kini memanggil `createProduct(payload)` yang sama. Verifikasi: `npx tsc --noEmit` exit code 0.

## 9. Validasi Akhir

- [x] 9.1 Jalankan `npx tsc --noEmit` di `frontend-wayrung` dan verifikasi tidak ada TypeScript error — exit code 0 ✅
- [ ] 9.2 Muat halaman `/produk` di browser, pastikan tidak ada console error, dan semua fitur utama (tabel, filter, sort, paginasi, modal CRUD) berfungsi end-to-end.
