package service

import (
	"errors"
	"fmt"
	"time"
	"wayrung/dto"
	"wayrung/model"
	"wayrung/repository"
)

// TransactionService mendefinisikan interface layanan bisnis transaksi penjualan/pembelian.
type TransactionService interface {
	// CreateTransaction memproses pemuatan transaksi baru, pembaruan stok produk, pembuatan audit log, dan pemberitahuan stok menipis.
	CreateTransaction(userID uint, req dto.TransactionCreateRequest) (dto.TransactionResponse, error)
	// FindByID mengambil detail transaksi berdasarkan ID.
	FindByID(id uint) (dto.TransactionResponse, error)
	// FindAll mengambil seluruh riwayat transaksi.
	FindAll() ([]dto.TransactionResponse, error)
	// FindByUserID mengambil riwayat transaksi pengguna tertentu.
	FindByUserID(userID uint) ([]dto.TransactionResponse, error)
}

// TransactionServiceImpl merupakan implementasi dari TransactionService.
type TransactionServiceImpl struct {
	txRepo          repository.TransactionRepository
	productRepo     repository.ProductRepository
	settingsRepo    repository.SettingsRepository
	notificationRepo repository.NotificationRepository
	auditLogRepo    repository.AuditLogRepository
}

// NewTransactionService membuat instance baru dari TransactionService.
func NewTransactionService(
	txRepo repository.TransactionRepository,
	productRepo repository.ProductRepository,
	settingsRepo repository.SettingsRepository,
	notificationRepo repository.NotificationRepository,
	auditLogRepo repository.AuditLogRepository,
) TransactionService {
	return &TransactionServiceImpl{
		txRepo:           txRepo,
		productRepo:      productRepo,
		settingsRepo:     settingsRepo,
		notificationRepo: notificationRepo,
		auditLogRepo:     auditLogRepo,
	}
}

// CreateTransaction menjalankan alur transaksi atomik: pengecekan stok, pengurangan stok, pembuatan detail, audit log, dan notifikasi stok rendah.
func (s *TransactionServiceImpl) CreateTransaction(userID uint, req dto.TransactionCreateRequest) (dto.TransactionResponse, error) {
	// 1. Memulai database transaction
	txSession := s.txRepo.BeginTx()
	defer func() {
		if r := recover(); r != nil {
			txSession.Rollback()
		}
	}()

	var totalAmount float64
	var details []model.TransactionDetails

	// List produk untuk diperiksa kondisi stoknya setelah transaksi
	type productStockCheck struct {
		product model.Products
		newStock int
	}
	var stockChecks []productStockCheck

	// 2. Iterasi item dan validasi harga/stok produk
	for _, item := range req.Items {
		product, err := s.productRepo.FindByID(item.ProductID)
		if err != nil {
			txSession.Rollback()
			return dto.TransactionResponse{}, fmt.Errorf("produk ID %d tidak ditemukan: %w", item.ProductID, err)
		}

		// Jika transaksi bertipe 'sale', periksa ketercukupan stok
		if req.Type == "sale" && product.Stock < item.Quantity {
			txSession.Rollback()
			return dto.TransactionResponse{}, fmt.Errorf("stok produk '%s' tidak mencukupi (tersisa: %d, diminta: %d)", product.Name, product.Stock, item.Quantity)
		}

		subtotal := product.SellingPrice * float64(item.Quantity)
		totalAmount += subtotal

		details = append(details, model.TransactionDetails{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     product.SellingPrice,
			SubTotal:  subtotal,
		})

		// Update stok di DB session
		if req.Type == "sale" {
			if err := s.productRepo.UpdateStock(txSession, product.ID, item.Quantity); err != nil {
				txSession.Rollback()
				return dto.TransactionResponse{}, fmt.Errorf("gagal mengupdate stok produk '%s': %w", product.Name, err)
			}
			stockChecks = append(stockChecks, productStockCheck{
				product:  product,
				newStock: product.Stock - item.Quantity,
			})
		}
	}

	// 3. Simpan header transaksi dan detail item
	transaction := model.Transactions{
		UserID:          userID,
		Type:            req.Type,
		TotalAmount:     totalAmount,
		PaymentMethod:   req.PaymentMethod,
		Note:            req.Note,
		TransactionDate: time.Now(),
		Details:         details,
	}

	if err := s.txRepo.CreateTx(txSession, &transaction); err != nil {
		txSession.Rollback()
		return dto.TransactionResponse{}, fmt.Errorf("gagal menyimpan transaksi: %w", err)
	}

	// 4. Catat Audit Log aktivitas transaksi
	auditLog := model.AuditLogs{
		UserID:      userID,
		Action:      fmt.Sprintf("CREATE_TRANSACTION_%s", req.Type),
		EntityType:  "TRANSACTION",
		EntityID:    transaction.ID,
		Description: fmt.Sprintf("Transaksi %s berhasil dibuat dengan total Rp%.2f", req.Type, totalAmount),
	}
	if err := s.auditLogRepo.CreateTx(txSession, &auditLog); err != nil {
		txSession.Rollback()
		return dto.TransactionResponse{}, fmt.Errorf("gagal mencatat audit log transaksi: %w", err)
	}

	// 5. Periksa dan buat notifikasi stok rendah jika stok berada di bawah batas ambang user setting
	setting, err := s.settingsRepo.FindByUserID(userID)
	if err == nil && setting.LowStockNotification {
		for _, sc := range stockChecks {
			if sc.newStock <= setting.LowStockThreshold {
				notification := model.Notifications{
					UserID:  userID,
					Type:    "LOW_STOCK",
					Title:   "Peringatan Stok Menipis",
					Message: fmt.Sprintf("Stok produk '%s' tersisa %d (di bawah ambang batas %d)", sc.product.Name, sc.newStock, setting.LowStockThreshold),
					IsRead:  false,
				}
				_ = s.notificationRepo.CreateTx(txSession, &notification)
			}
		}
	}

	// 6. Commit transaksi ke database
	if err := txSession.Commit().Error; err != nil {
		return dto.TransactionResponse{}, fmt.Errorf("gagal menyelesaikan transaksi database: %w", err)
	}

	// 7. Ambil kembali entitas transaksi lengkap dengan relasi untuk dikembalikan ke pemanggil
	createdTx, err := s.txRepo.FindByID(transaction.ID)
	if err != nil {
		return dto.ToTransactionResponse(transaction), nil
	}

	return dto.ToTransactionResponse(createdTx), nil
}

// FindByID mencari transaksi berdasarkan ID.
func (s *TransactionServiceImpl) FindByID(id uint) (dto.TransactionResponse, error) {
	transaction, err := s.txRepo.FindByID(id)
	if err != nil {
		return dto.TransactionResponse{}, errors.New("transaksi tidak ditemukan")
	}
	return dto.ToTransactionResponse(transaction), nil
}

// FindAll mengambil seluruh data riwayat transaksi.
func (s *TransactionServiceImpl) FindAll() ([]dto.TransactionResponse, error) {
	transactions, err := s.txRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil riwayat transaksi: %w", err)
	}
	return dto.ToTransactionResponseList(transactions), nil
}

// FindByUserID mengambil riwayat transaksi spesifik milik pengguna tertentu.
func (s *TransactionServiceImpl) FindByUserID(userID uint) ([]dto.TransactionResponse, error) {
	transactions, err := s.txRepo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil transaksi pengguna: %w", err)
	}
	return dto.ToTransactionResponseList(transactions), nil
}
