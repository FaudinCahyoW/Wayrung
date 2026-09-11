## Context

Proyek ini menggunakan Next.js 16 dengan App Router, React 19, TypeScript, dan TailwindCSS v4. Halaman `/produk` (`app/produk/page.tsx`) sudah diimplementasikan (~1131 baris) dengan komponen inline. Data diambil dari backend Go melalui `axios` yang dikonfigurasi di `lib/api.ts` dengan base URL dari environment variable `NEXT_PUBLIC_API_URL`. Autentikasi menggunakan JWT di cookie `token`, ditangani oleh `AuthContext`.

Hooks yang sudah ada:
- `useProducts()` — fetch, CRUD, filter, sort, pagination produk via `/products`
- `useCategories()` — fetch, CRUD kategori via `/categories`
- `useAuth()` — membaca `user.role` untuk kontrol akses

## Goals / Non-Goals

**Goals:**
- Mendokumentasikan arsitektur komponen halaman produk yang sudah ada
- Menjelaskan keputusan desain: server-side vs client-side filtering, state management, kontrol akses
- Menjadi referensi teknis saat melakukan perubahan atau pengujian di masa mendatang

**Non-Goals:**
- Refactor atau memecah file `page.tsx` menjadi beberapa file komponen (bukan bagian dari change ini)
- Implementasi unit test otomatis
- Optimasi performa (lazy loading, virtualization tabel)
- Fitur export data produk

## Decisions

### 1. Server-side filtering, sorting, dan paginasi

**Keputusan**: Semua filter (search, category_id, sort) dan paginasi dikirim sebagai query parameter ke API `/products`, bukan dilakukan di sisi klien dari data yang sudah diambil semua sekaligus.

**Alasan**: Jumlah produk bisa sangat besar. Server-side filtering memastikan performa tetap konsisten tanpa perlu mengambil semua data ke browser.

**Alternatif dipertimbangkan**: Client-side filtering dari satu fetch besar — ditolak karena tidak skalabel.

### 2. State filter terpusat di `useProducts` hook

**Keputusan**: Semua state query (`search`, `sort`, `category_id`, `page`, `limit`) dikelola dalam satu `ProductQuery` state di dalam `useProducts`. Komponen memanggil `updateQuery(patch)` untuk mengubah filter apa pun.

**Alasan**: Menjaga filter sinkron dan memudahkan reset halaman ke 1 secara otomatis setiap kali filter non-halaman berubah.

### 3. Semua komponen dalam satu file `page.tsx`

**Keputusan**: `ModalProduk`, `ModalKategori`, `TabProduk`, `TabKategori`, `StockBadge` semua ada dalam satu file.

**Alasan**: Semua komponen ini sangat terikat pada halaman produk dan tidak digunakan di tempat lain. Memisahkannya ke file terpisah tidak memberi nilai tambah signifikan pada skala proyek saat ini.

**Alternatif dipertimbangkan**: Folder `app/produk/components/` dengan file terpisah — dapat dilakukan di masa depan jika kompleksitas bertambah.

### 4. Role-based access control di sisi klien

**Keputusan**: Tombol tambah, edit, dan hapus hanya dirender jika `user.role === "owner"`. Backend tetap memvalidasi otorisasi pada setiap request.

**Alasan**: UI yang bersih dan konsisten. Kontrol akses backend tetap sebagai lapisan keamanan utama; kontrol klien hanya untuk UX.

### 5. Konfirmasi hapus dua langkah (inline, tanpa modal tambahan)

**Keputusan**: Konfirmasi hapus menggunakan state inline di dalam komponen (bukan modal terpisah). Untuk produk: state `confirmDelete` di `ModalProduk`. Untuk kategori: state `confirmId` di `TabKategori`.

**Alasan**: UX lebih cepat, tidak perlu membuka modal baru hanya untuk konfirmasi sederhana.

### 6. Penggunaan `lucide-react` untuk ikon

**Keputusan**: Semua ikon menggunakan `lucide-react` yang sudah terinstal.

**Alasan**: Konsistensi dengan desain seluruh aplikasi. Library sudah tersedia di `package.json`.

## Risks / Trade-offs

- **[Risk] File page.tsx terlalu panjang** → Jika fitur bertambah, pertimbangkan ekstraksi ke `app/produk/components/`. Saat ini masih dapat dikelola.
- **[Risk] Race condition saat filter berubah cepat** → `useProducts` tidak mengimplementasikan debounce pada input pencarian; setiap keystroke memicu request. Mitigasi: tambahkan debounce ~300ms pada input search di masa mendatang.
- **[Risk] Token expired saat CRUD** → Ditangani oleh interceptor Axios di `lib/api.ts` yang redirect ke `/login` pada 401.
- **[Trade-off] Modal tambah di header tidak terhubung ke `TabProduk`** → Tombol "Tambah produk" di header membuka `ModalProduk` terpisah dari `TabProduk`. Setelah simpan, daftar produk tidak di-refresh otomatis karena `createProduct` milik `TabProduk`. Perlu perbaikan: teruskan fungsi `createProduct` dari `TabProduk` ke level page.
