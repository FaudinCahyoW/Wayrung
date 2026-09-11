## Purpose

Halaman utama pengelolaan produk di aplikasi Wayrung. Menampilkan daftar produk dalam tabel dengan filter kategori, pengurutan, dan paginasi server-side. Menyediakan tab terpisah untuk manajemen kategori, serta modal CRUD produk dan kategori bagi pengguna dengan peran `owner`.

## ADDED Requirements

### Requirement: Menampilkan daftar produk dalam tabel
Sistem SHALL menampilkan produk dalam tabel dengan kolom: Produk (nama + SKU + inisial avatar), Kategori, Harga Beli, Harga Jual, Stok (dengan badge status), dan aksi Edit.

#### Scenario: Tabel tampil dengan data
- **WHEN** API `/products` mengembalikan data produk
- **THEN** setiap produk ditampilkan dalam baris tabel dengan nama, SKU, kategori, harga beli, harga jual, dan badge stok

#### Scenario: State loading
- **WHEN** permintaan API sedang berjalan
- **THEN** spinner loading ditampilkan di area tabel

#### Scenario: State error
- **WHEN** API mengembalikan error
- **THEN** pesan error ditampilkan beserta tombol "Coba lagi"

#### Scenario: Tidak ada produk
- **WHEN** API mengembalikan data kosong
- **THEN** tampilan kosong dengan ikon dan pesan "Belum ada produk"

### Requirement: Filter pencarian produk
Sistem SHALL menyediakan input pencarian yang memfilter produk berdasarkan nama atau SKU melalui query parameter `search` ke API.

#### Scenario: Pengguna mengetik di kolom pencarian
- **WHEN** pengguna mengetik teks di input "Cari produk atau SKU..."
- **THEN** API dipanggil ulang dengan parameter `search` sesuai input dan halaman direset ke 1

### Requirement: Filter berdasarkan kategori
Sistem SHALL menyediakan dropdown untuk memfilter produk berdasarkan kategori via query parameter `category_id`.

#### Scenario: Memilih kategori dari dropdown
- **WHEN** pengguna memilih salah satu kategori dari dropdown
- **THEN** API dipanggil ulang dengan `category_id` yang dipilih dan halaman direset ke 1

#### Scenario: Memilih "Semua kategori"
- **WHEN** pengguna memilih opsi "Semua kategori"
- **THEN** API dipanggil ulang tanpa parameter `category_id`

### Requirement: Pengurutan (sort) produk
Sistem SHALL menyediakan dropdown sort dengan pilihan: Nama, Stok, Harga Jual, Terbaru.

#### Scenario: Mengubah urutan
- **WHEN** pengguna memilih opsi sort
- **THEN** API dipanggil ulang dengan parameter `sort` yang sesuai dan halaman direset ke 1

### Requirement: Paginasi server-side
Sistem SHALL menampilkan kontrol paginasi berdasarkan metadata yang dikembalikan API (`total_data`, `page`, `limit`).

#### Scenario: Navigasi antar halaman
- **WHEN** pengguna menekan tombol nomor halaman
- **THEN** API dipanggil ulang dengan `page` yang dipilih

#### Scenario: Menampilkan info paginasi
- **WHEN** ada data produk
- **THEN** teks "Menampilkan X–Y dari Z produk" ditampilkan di bawah tabel

### Requirement: Kontrol akses berdasarkan peran
Tombol "Tambah produk" dan tombol edit per-baris MUST hanya ditampilkan kepada pengguna dengan `role === "owner"`.

#### Scenario: Pengguna owner melihat tombol tambah
- **WHEN** `user.role === "owner"` dan tab aktif adalah "Semua produk"
- **THEN** tombol "+ Tambah produk" ditampilkan di area header halaman

#### Scenario: Pengguna non-owner tidak melihat tombol edit
- **WHEN** `user.role !== "owner"`
- **THEN** kolom edit (ikon pensil) tidak dirender di setiap baris tabel

### Requirement: Tab navigasi Produk / Kategori
Halaman SHALL memiliki dua tab: "Semua produk" dan "Kategori". Hanya satu tab yang aktif pada satu waktu.

#### Scenario: Berpindah tab
- **WHEN** pengguna menekan tab "Kategori"
- **THEN** konten tab berubah ke daftar kategori tanpa navigasi halaman baru

### Requirement: Tab Kategori — daftar kategori
Tab Kategori SHALL menampilkan tabel kategori dengan kolom: Nama Kategori dan Tanggal Dibuat.

#### Scenario: Kategori ditampilkan
- **WHEN** API `/categories` mengembalikan data
- **THEN** setiap kategori ditampilkan dalam baris tabel dengan nama dan tanggal dibuat

#### Scenario: Owner dapat menambah/edit/hapus kategori
- **WHEN** `user.role === "owner"`
- **THEN** tombol "Tambah kategori", ikon edit, dan ikon hapus (dengan konfirmasi inline) tersedia per baris
