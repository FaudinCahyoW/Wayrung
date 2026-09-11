## Purpose

Modal dialog untuk menambah dan mengedit produk. Menyediakan form dengan validasi sisi klien untuk semua field produk, dan mendukung penghapusan produk dengan konfirmasi dua langkah.

## ADDED Requirements

### Requirement: Form produk dengan field wajib
Modal SHALL menampilkan field: Nama Produk, SKU, Kategori (dropdown), Harga Beli (input numerik dengan prefix Rp), Harga Jual (input numerik dengan prefix Rp), dan Stok.

#### Scenario: Membuka modal tambah produk
- **WHEN** pengguna menekan tombol "+ Tambah produk"
- **THEN** modal terbuka dengan judul "Tambah Produk" dan semua field kosong

#### Scenario: Membuka modal edit produk
- **WHEN** pengguna menekan ikon pensil pada baris produk
- **THEN** modal terbuka dengan judul "Edit Produk" dan semua field terisi dengan data produk yang dipilih

### Requirement: Validasi form sebelum simpan
Sistem SHALL memvalidasi form sebelum mengirim ke API. Validasi MUST menolak:
- Nama produk kosong
- SKU kosong
- Kategori belum dipilih (nilai 0)
- Harga Jual ≤ 0

#### Scenario: Nama produk kosong saat simpan
- **WHEN** pengguna menekan "Simpan" dengan field Nama kosong
- **THEN** pesan error "Nama produk wajib diisi." ditampilkan, API tidak dipanggil

#### Scenario: SKU kosong saat simpan
- **WHEN** pengguna menekan "Simpan" dengan field SKU kosong
- **THEN** pesan error "SKU wajib diisi." ditampilkan, API tidak dipanggil

#### Scenario: Harga Jual nol atau negatif
- **WHEN** pengguna menekan "Simpan" dengan Harga Jual ≤ 0
- **THEN** pesan error "Harga jual harus lebih dari 0." ditampilkan, API tidak dipanggil

### Requirement: Menyimpan produk
Sistem SHALL memanggil API yang sesuai berdasarkan mode modal:
- Mode tambah: `POST /products`
- Mode edit: `PUT /products/:id`

Setelah berhasil, modal MUST ditutup dan daftar produk diperbarui.

#### Scenario: Simpan produk baru berhasil
- **WHEN** semua field valid dan pengguna menekan "Simpan"
- **THEN** `POST /products` dipanggil, modal tertutup, daftar produk di-refresh

#### Scenario: Gagal simpan dari API
- **WHEN** API mengembalikan error
- **THEN** pesan error dari API ditampilkan di dalam modal, modal tetap terbuka

### Requirement: Hapus produk dengan konfirmasi dua langkah
Dalam mode edit, sistem SHALL menampilkan opsi hapus yang membutuhkan konfirmasi eksplisit sebelum memanggil `DELETE /products/:id`.

#### Scenario: Alur hapus produk
- **WHEN** pengguna menekan "Hapus produk ini"
- **THEN** konfirmasi inline muncul dengan tombol "Hapus" (merah) dan "Batal"

#### Scenario: Konfirmasi hapus
- **WHEN** pengguna menekan tombol "Hapus" pada konfirmasi
- **THEN** `DELETE /products/:id` dipanggil, modal tertutup, daftar produk di-refresh

### Requirement: Menutup modal
Modal MUST dapat ditutup dengan menekan tombol X, tombol "Batal", atau mengklik overlay backdrop.

#### Scenario: Menutup modal via overlay
- **WHEN** pengguna mengklik area gelap di luar modal
- **THEN** modal tertutup tanpa menyimpan perubahan
