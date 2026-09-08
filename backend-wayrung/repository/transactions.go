package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
)

// TransactionRepository mendefinisikan interface operasi data transaksi penjualan/pembelian.
type TransactionRepository interface {
	// BeginTx memulai sesi transaksi database.
	BeginTx() *gorm.DB
	// CreateTx menyimpan header transaksi beserta detail item dalam sesi transaksi database.
	CreateTx(tx *gorm.DB, transaction *model.Transactions) error
	// FindByID mengambil data transaksi beserta relasi detail item, produk, dan penggunanya.
	FindByID(id uint) (model.Transactions, error)
	// FindAll mengambil seluruh data transaksi.
	FindAll() ([]model.Transactions, error)
	// FindByUserID mengambil transaksi berdasarkan ID pengguna.
	FindByUserID(userID uint) ([]model.Transactions, error)
}

// TransactionRepositoryImpl merupakan implementasi dari TransactionRepository menggunakan GORM.
type TransactionRepositoryImpl struct {
	db *gorm.DB
}

// NewTransactionRepository membuat instance baru dari TransactionRepository.
func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &TransactionRepositoryImpl{db: db}
}

// BeginTx memulai transaksi database GORM.
func (r *TransactionRepositoryImpl) BeginTx() *gorm.DB {
	return r.db.Begin()
}

// CreateTx menyimpan transaksi beserta rincian item dalam transaksi database.
func (r *TransactionRepositoryImpl) CreateTx(tx *gorm.DB, transaction *model.Transactions) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.Create(transaction).Error
}

// FindByID mencari transaksi berdasarkan ID beserta preloading detail, produk, dan pengguna.
func (r *TransactionRepositoryImpl) FindByID(id uint) (model.Transactions, error) {
	var transaction model.Transactions
	err := r.db.Preload("User").Preload("Details.Product").First(&transaction, id).Error
	return transaction, err
}

// FindAll mengambil seluruh riwayat transaksi di database.
func (r *TransactionRepositoryImpl) FindAll() ([]model.Transactions, error) {
	var transactions []model.Transactions
	err := r.db.Preload("User").Preload("Details.Product").Order("created_at DESC").Find(&transactions).Error
	return transactions, err
}

// FindByUserID mengambil daftar transaksi yang dilakukan oleh pengguna tertentu.
func (r *TransactionRepositoryImpl) FindByUserID(userID uint) ([]model.Transactions, error) {
	var transactions []model.Transactions
	err := r.db.Where("user_id = ?", userID).Preload("User").Preload("Details.Product").Order("created_at DESC").Find(&transactions).Error
	return transactions, err
}
