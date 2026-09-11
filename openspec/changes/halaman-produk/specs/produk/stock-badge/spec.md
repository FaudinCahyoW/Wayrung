## Purpose

Komponen badge yang menampilkan status stok produk secara visual. Status ditentukan berdasarkan jumlah stok dan ditampilkan dengan warna berbeda untuk memudahkan pengguna mengidentifikasi produk yang perlu direstok.

## ADDED Requirements

### Requirement: Klasifikasi status stok
Sistem SHALL mengklasifikasikan stok ke dalam tiga status berdasarkan ambang batas:
- **Kritis**: stok ≤ 5 → latar merah muda, teks merah
- **Menipis**: stok 6–10 → latar kuning muda, teks amber
- **Aman**: stok > 10 → latar hijau muda, teks hijau

#### Scenario: Stok kritis
- **WHEN** `stock <= 5`
- **THEN** badge menampilkan `{stock} — Kritis` dengan gaya warna merah

#### Scenario: Stok menipis
- **WHEN** `stock >= 6 && stock <= 10`
- **THEN** badge menampilkan `{stock} — Menipis` dengan gaya warna amber

#### Scenario: Stok aman
- **WHEN** `stock > 10`
- **THEN** badge menampilkan `{stock} — Aman` dengan gaya warna hijau

### Requirement: Format teks badge
Badge SHALL menampilkan angka stok diikuti em dash dan label status dalam format `{angka} — {status}`.

#### Scenario: Format output badge
- **WHEN** `stock = 4`
- **THEN** teks yang ditampilkan adalah "4 — Kritis"
