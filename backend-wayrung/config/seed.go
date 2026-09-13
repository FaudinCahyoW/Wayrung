package config

import (
	"log"
	"strconv"
	"time"
	"wayrung/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedDB memasukkan data awal (seeder) ke database secara otomatis.
func SeedDB(db *gorm.DB) {
	owner := seedOwner(db)
	kasir := seedKasir(db)

	seedSettings(db, owner, kasir)
	categories := seedCategories(db)
	products := seedProducts(db, categories)
	seedTransactions(db, owner, kasir, products)
	seedNotifications(db, owner, products)
	seedAuditLogs(db, owner, products)
}

// seedOwner — LOGIC ASLI, tidak diubah. Membuat (atau memastikan) akun owner
// fadn@gmail.com / password123 dengan nama "faudin".
func seedOwner(db *gorm.DB) model.Users {
	var user model.Users
	email := "fadn@gmail.com"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[SEEDER] Gagal meng-hash password: %v", err)
		return user
	}

	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		// User belum ada, buat user owner baru
		owner := model.Users{
			Name:     "faudin",
			Email:    email,
			Password: string(hashedPassword),
			Role:     "owner",
		}

		if err := db.Create(&owner).Error; err != nil {
			log.Printf("[SEEDER] Gagal membuat user owner: %v", err)
			return user
		}

		// Buat settings default untuk user owner
		setting := model.Settings{
			UserID:                  owner.ID,
			LowStockNotification:    true,
			LowStockThreshold:       5,
			TransactionNotification: true,
		}
		db.Create(&setting)

		log.Printf("[SEEDER] Berhasil membuat user owner -> Name: faudin | Email: %s | Password: password123 | Role: owner", email)
		return owner
	}

	// User sudah ada, pastikan role adalah owner dan nama faudin
	db.Model(&user).Updates(map[string]interface{}{
		"name": "faudin",
		"role": "owner",
	})
	log.Printf("[SEEDER] User dengan email %s sudah ada. Role dipastikan menjadi 'owner'.", email)
	return user
}

// seedKasir membuat satu akun kasir contoh (kasir@gmail.com), kalau belum ada.
// Dibutuhkan supaya ada data transaksi yang "dicatat oleh kasir" (bukan cuma owner)
// dan supaya kontrol akses owner-vs-kasir di frontend bisa dites.
func seedKasir(db *gorm.DB) model.Users {
	var user model.Users
	email := "kasir@gmail.com"

	if err := db.Where("email = ?", email).First(&user).Error; err == nil {
		return user // sudah ada, tidak perlu buat ulang
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[SEEDER] Gagal meng-hash password kasir: %v", err)
		return user
	}

	kasir := model.Users{
		Name:     "Dewi Puspita",
		Email:    email,
		Password: string(hashedPassword),
		Role:     "kasir",
	}
	if err := db.Create(&kasir).Error; err != nil {
		log.Printf("[SEEDER] Gagal membuat user kasir: %v", err)
		return user
	}

	log.Printf("[SEEDER] Berhasil membuat user kasir -> Name: Dewi Puspita | Email: %s | Password: password123 | Role: kasir", email)
	return kasir
}

// seedSettings memastikan tiap user (owner & kasir) punya baris settings.
// user_id di tabel settings itu unique, jadi dicek per-user dulu sebelum Create.
func seedSettings(db *gorm.DB, owner, kasir model.Users) {
	for _, u := range []model.Users{owner, kasir} {
		if u.ID == 0 {
			continue
		}
		var existing model.Settings
		if err := db.Where("user_id = ?", u.ID).First(&existing).Error; err != nil {
			db.Create(&model.Settings{
				UserID:                  u.ID,
				LowStockNotification:    true,
				LowStockThreshold:       5,
				TransactionNotification: true,
			})
		}
	}
}

// seedCategories membuat 3 kategori produk contoh, kalau tabel categories masih kosong.
func seedCategories(db *gorm.DB) []model.Categories {
	var count int64
	db.Model(&model.Categories{}).Count(&count)
	if count > 0 {
		var existing []model.Categories
		db.Find(&existing)
		return existing
	}

	categories := []model.Categories{
		{Name: "Minuman Bubuk"},
		{Name: "Perlengkapan"},
		{Name: "Camilan"},
	}
	for i := range categories {
		db.Create(&categories[i])
	}
	log.Println("[SEEDER] Berhasil membuat 3 kategori produk.")
	return categories
}

// seedProducts membuat 8 produk contoh (kalau tabel products masih kosong).
// 2 produk sengaja dibikin stok Kritis (<=5) dan 2 Menipis (6-10) untuk nge-test
// badge stok & notifikasi di frontend, sisanya Aman.
func seedProducts(db *gorm.DB, categories []model.Categories) []model.Products {
	var count int64
	db.Model(&model.Products{}).Count(&count)
	if count > 0 {
		var existing []model.Products
		db.Find(&existing)
		return existing
	}

	if len(categories) < 3 {
		log.Println("[SEEDER] Kategori tidak lengkap, lewati seed produk.")
		return nil
	}

	products := []model.Products{
		{CategoryID: categories[0].ID, Name: "Kopi Arabika 250g", SKU: "KA-250", PurchasePrice: 32000, SellingPrice: 45000, Stock: 4},   // Kritis
		{CategoryID: categories[0].ID, Name: "Gula Aren 1kg", SKU: "GA-1000", PurchasePrice: 21000, SellingPrice: 28000, Stock: 6},      // Menipis
		{CategoryID: categories[0].ID, Name: "Teh Melati 100g", SKU: "TM-100", PurchasePrice: 12000, SellingPrice: 17500, Stock: 8},     // Menipis
		{CategoryID: categories[0].ID, Name: "Cokelat Bubuk 200g", SKU: "CB-200", PurchasePrice: 18000, SellingPrice: 26000, Stock: 5},  // Kritis
		{CategoryID: categories[1].ID, Name: "Botol Kemasan 500ml", SKU: "BT-500", PurchasePrice: 2500, SellingPrice: 3500, Stock: 240}, // Aman
		{CategoryID: categories[1].ID, Name: "Sedotan Kertas", SKU: "SD-100", PurchasePrice: 500, SellingPrice: 1000, Stock: 150},       // Aman
		{CategoryID: categories[2].ID, Name: "Keripik Singkong 100g", SKU: "KS-100", PurchasePrice: 8000, SellingPrice: 12000, Stock: 30},
		{CategoryID: categories[2].ID, Name: "Kacang Telur 200g", SKU: "KT-200", PurchasePrice: 10000, SellingPrice: 15000, Stock: 20},
	}
	for i := range products {
		db.Create(&products[i])
	}
	log.Println("[SEEDER] Berhasil membuat 8 produk contoh.")
	return products
}

// seedTransactions membuat 14 transaksi (campuran "sale" & "purchase") tersebar
// dalam 7 hari terakhir, lengkap dengan rincian item per transaksi (kalau tabel
// transactions masih kosong). GORM otomatis insert TransactionDetails & set
// transaction_id lewat association Create.
func seedTransactions(db *gorm.DB, owner, kasir model.Users, products []model.Products) {
	if owner.ID == 0 || kasir.ID == 0 || len(products) < 8 {
		log.Println("[SEEDER] User/produk tidak lengkap, lewati seed transaksi.")
		return
	}

	var count int64
	db.Model(&model.Transactions{}).Count(&count)
	if count > 0 {
		return
	}

	paymentMethods := []string{"Tunai", "Transfer bank", "QRIS"}
	now := time.Now()

	type item struct {
		productIdx int
		qty        int
	}
	type txSeed struct {
		daysAgo int
		hour    int
		txType  string
		user    model.Users
		items   []item
	}

	seeds := []txSeed{
		{6, 9, "sale", kasir, []item{{0, 3}, {2, 2}}},
		{6, 8, "purchase", owner, []item{{1, 20}}},
		{5, 10, "sale", kasir, []item{{2, 5}}},
		{5, 16, "sale", owner, []item{{3, 2}}},
		{4, 11, "purchase", owner, []item{{4, 100}}},
		{4, 14, "sale", kasir, []item{{0, 2}, {6, 3}}},
		{3, 9, "sale", kasir, []item{{7, 4}}},
		{3, 15, "sale", owner, []item{{2, 3}}},
		{2, 10, "purchase", owner, []item{{5, 200}}},
		{2, 13, "sale", kasir, []item{{0, 1}, {3, 1}}},
		{1, 9, "sale", kasir, []item{{6, 2}, {7, 2}}},
		{1, 17, "sale", owner, []item{{2, 4}}},
		{0, 9, "sale", kasir, []item{{0, 3}, {2, 2}}},
		{0, 8, "purchase", owner, []item{{1, 20}}},
	}

	for i, s := range seeds {
		date := time.Date(now.Year(), now.Month(), now.Day()-s.daysAgo, s.hour, 0, 0, 0, now.Location())

		var total float64
		var details []model.TransactionDetails
		for _, it := range s.items {
			p := products[it.productIdx]
			price := p.SellingPrice
			if s.txType == "purchase" {
				price = p.PurchasePrice
			}
			subtotal := price * float64(it.qty)
			total += subtotal
			details = append(details, model.TransactionDetails{
				ProductID: p.ID,
				Quantity:  it.qty,
				Price:     price,
				SubTotal:  subtotal,
			})
		}

		tx := model.Transactions{
			UserID:          s.user.ID,
			Type:            s.txType,
			TotalAmount:     total,
			PaymentMethod:   paymentMethods[i%len(paymentMethods)],
			TransactionDate: date,
			CreatedAt:       date,
			Details:         details,
		}
		if err := db.Create(&tx).Error; err != nil {
			log.Printf("[SEEDER] Gagal seed transaksi ke-%d: %v", i, err)
		}
	}

	log.Println("[SEEDER] Berhasil membuat 14 transaksi contoh.")
}

// seedNotifications membuat notifikasi stok menipis + notifikasi transaksi contoh
// (kalau tabel notifications masih kosong).
func seedNotifications(db *gorm.DB, owner model.Users, products []model.Products) {
	if owner.ID == 0 || len(products) < 4 {
		return
	}

	var count int64
	db.Model(&model.Notifications{}).Count(&count)
	if count > 0 {
		return
	}

	now := time.Now()

	// products[0] = Kopi Arabika (stok 4, kritis), products[3] = Cokelat Bubuk (stok 5, kritis)
	lowStock := []struct {
		idx  int
		when time.Time
	}{
		{0, now.Add(-2 * time.Hour)},
		{3, now.Add(-26 * time.Hour)},
	}
	for _, n := range lowStock {
		p := products[n.idx]
		db.Create(&model.Notifications{
			UserID:    owner.ID,
			Type:      "stock",
			Title:     "Stok " + p.Name + " menipis",
			Message:   "Sisa stok tinggal " + strconv.Itoa(p.Stock) + ", segera lakukan pengisian ulang.",
			IsRead:    false,
			CreatedAt: n.when,
		})
	}

	db.Create(&model.Notifications{
		UserID:    owner.ID,
		Type:      "transaction",
		Title:     "Transaksi baru tercatat",
		Message:   "Penjualan berhasil disimpan oleh kasir.",
		IsRead:    true,
		CreatedAt: now.Add(-3 * time.Hour),
	})

	log.Println("[SEEDER] Berhasil membuat notifikasi contoh.")
}

// seedAuditLogs membuat beberapa entri log aktivitas contoh (kalau tabel audit_logs
// masih kosong) — dipakai di tab "Log aktivitas" halaman Pengaturan.
func seedAuditLogs(db *gorm.DB, owner model.Users, products []model.Products) {
	if owner.ID == 0 || len(products) < 1 {
		return
	}

	var count int64
	db.Model(&model.AuditLogs{}).Count(&count)
	if count > 0 {
		return
	}

	now := time.Now()
	logs := []model.AuditLogs{
		{UserID: owner.ID, Action: "create", EntityType: "transaction", EntityID: 1, Description: "Menambahkan transaksi baru", CreatedAt: now.Add(-1 * time.Hour)},
		{UserID: owner.ID, Action: "update", EntityType: "product", EntityID: products[0].ID, Description: "Memperbarui stok produk " + products[0].Name, CreatedAt: now.Add(-20 * time.Hour)},
		{UserID: owner.ID, Action: "login", EntityType: "auth", EntityID: owner.ID, Description: "Masuk ke akun", CreatedAt: now.Add(-48 * time.Hour)},
	}
	for i := range logs {
		db.Create(&logs[i])
	}

	log.Println("[SEEDER] Berhasil membuat log aktivitas contoh.")
}