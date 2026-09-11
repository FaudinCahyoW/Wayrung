## Purpose

Modal dialog untuk menambah dan mengedit kategori produk. Menyediakan form sederhana dengan validasi nama kategori dan mendukung penghapusan melalui tombol inline di tabel kategori.

## ADDED Requirements

### Requirement: Form kategori dengan field nama
Modal SHALL menampilkan satu field input: Nama Kategori.

#### Scenario: Membuka modal tambah kategori
- **WHEN** pengguna menekan tombol "Tambah kategori"
- **THEN** modal terbuka dengan judul "Tambah Kategori" dan field nama kosong dengan focus otomatis

#### Scenario: Membuka modal edit kategori
- **WHEN** pengguna menekan ikon pensil pada baris kategori
- **THEN** modal terbuka dengan judul "Edit Kategori" dan field nama terisi dengan nama kategori yang dipilih

### Requirement: Validasi nama kategori
Sistem SHALL menolak penyimpanan jika nama kategori kosong.

#### Scenario: Nama kategori kosong
- **WHEN** pengguna menekan "Simpan" dengan field nama kosong
- **THEN** pesan error "Nama kategori wajib diisi." ditampilkan, API tidak dipanggil

### Requirement: Menyimpan kategori
Sistem SHALL memanggil API yang sesuai berdasarkan mode modal:
- Mode tambah: `POST /categories` dengan body `{ name }`
- Mode edit: `PUT /categories/:id` dengan body `{ name }`

Setelah berhasil, modal MUST ditutup dan daftar kategori diperbarui.

#### Scenario: Simpan kategori baru berhasil
- **WHEN** nama valid dan pengguna menekan "Simpan"
- **THEN** `POST /categories` dipanggil, modal tertutup, daftar kategori di-refresh

### Requirement: Hapus kategori dengan konfirmasi inline
Di tabel kategori, sistem SHALL menampilkan konfirmasi dua tombol (centang dan X) sebelum memanggil `DELETE /categories/:id`.

#### Scenario: Alur hapus kategori
- **WHEN** pengguna menekan ikon Trash2 pada baris kategori
- **THEN** tombol konfirmasi centang (hijau) dan X (batal) muncul inline menggantikan ikon hapus

#### Scenario: Konfirmasi hapus
- **WHEN** pengguna menekan tombol centang konfirmasi
- **THEN** `DELETE /categories/:id` dipanggil dan daftar kategori di-refresh
