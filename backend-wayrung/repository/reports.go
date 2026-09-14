package repository

import (
	"time"

	"wayrung/dto"
	"wayrung/model"

	"gorm.io/gorm"
)

// IncomeExpenseRow merupakan baris hasil agregasi SUM(total_amount) per tipe transaksi.
// Ini bukan model tabel — hanya bentuk sementara hasil query GROUP BY.
type IncomeExpenseRow struct {
	Type  string
	Total float64
	Count int64
}

// DailyAggregateRow merupakan baris hasil agregasi SUM(total_amount) per tanggal & tipe transaksi.
type DailyAggregateRow struct {
	Date  time.Time
	Type  string
	Total float64
}

// PaymentAggregateRow merupakan baris hasil agregasi SUM(total_amount) per metode pembayaran.
type PaymentAggregateRow struct {
	PaymentMethod string
	TotalAmount   float64
}

// ReportRepository mendefinisikan interface untuk query agregasi data laporan.
// Semua method di sini membaca dari tabel transactions & transaction_details yang sudah ada
// (JOIN products untuk detail produk) — tidak ada tabel/model baru.
type ReportRepository interface {
	// GetIncomeExpense menghitung total nominal & jumlah transaksi per tipe ("sale"/"purchase")
	// dalam rentang waktu [start, end).
	GetIncomeExpense(start, end time.Time) ([]IncomeExpenseRow, error)
	// GetDailyAggregates menghitung total nominal per tanggal & tipe transaksi dalam rentang waktu.
	GetDailyAggregates(start, end time.Time) ([]DailyAggregateRow, error)
	// GetTopProducts menghitung produk dengan quantity terjual terbanyak (transaksi "sale")
	// dalam rentang waktu, dibatasi sejumlah limit.
	GetTopProducts(start, end time.Time, limit int) ([]dto.TopProduct, error)
	// GetPaymentMethodTotals menghitung total nominal transaksi "sale" per metode pembayaran.
	GetPaymentMethodTotals(start, end time.Time) ([]PaymentAggregateRow, error)
	// FindLowStock menampilkan produk paling laris
	FindLowStock(limit int) ([]model.Products, error)
}

// ReportRepositoryImpl merupakan implementasi dari ReportRepository menggunakan GORM.
type ReportRepositoryImpl struct {
	db *gorm.DB
}

// NewReportRepository membuat instance baru dari ReportRepository.
func NewReportRepository(db *gorm.DB) ReportRepository {
	return &ReportRepositoryImpl{db: db}
}

// GetIncomeExpense menghitung SUM(total_amount) dan COUNT(*) transaksi, dikelompokkan per type.
func (r *ReportRepositoryImpl) GetIncomeExpense(start, end time.Time) ([]IncomeExpenseRow, error) {
	var rows []IncomeExpenseRow
	err := r.db.Table("transactions").
		Select("type, SUM(total_amount) as total, COUNT(*) as count").
		Where("transaction_date >= ? AND transaction_date < ?", start, end).
		Group("type").
		Scan(&rows).Error
	return rows, err
}

// GetDailyAggregates menghitung SUM(total_amount) per tanggal (DATE(transaction_date)) & type.
func (r *ReportRepositoryImpl) GetDailyAggregates(start, end time.Time) ([]DailyAggregateRow, error) {
	var rows []DailyAggregateRow
	err := r.db.Table("transactions").
		Select("DATE(transaction_date) as date, type, SUM(total_amount) as total").
		Where("transaction_date >= ? AND transaction_date < ?", start, end).
		Group("DATE(transaction_date), type").
		Order("date ASC").
		Scan(&rows).Error
	return rows, err
}

// GetTopProducts menghitung SUM(quantity) & SUM(subtotal) per produk dari transaction_details,
// hanya untuk transaksi bertipe "sale", diurutkan dari quantity terbanyak.
func (r *ReportRepositoryImpl) GetTopProducts(start, end time.Time, limit int) ([]dto.TopProduct, error) {
	var rows []dto.TopProduct
	err := r.db.Table("transaction_details AS td").
		Select(`td.product_id AS product_id,
			p.name AS product_name,
			p.sku AS sku,
			SUM(td.quantity) AS quantity_sold,
			SUM(td.subtotal) AS revenue`).
		Joins("JOIN products p ON p.id = td.product_id").
		Joins("JOIN transactions t ON t.id = td.transaction_id").
		Where("t.transaction_date >= ? AND t.transaction_date < ? AND t.type = ?", start, end, "sale").
		Group("td.product_id, p.name, p.sku").
		Order("quantity_sold DESC").
		Limit(limit).
		Scan(&rows).Error
	return rows, err
}

// GetPaymentMethodTotals menghitung SUM(total_amount) per payment_method,
// hanya untuk transaksi bertipe "sale".
func (r *ReportRepositoryImpl) GetPaymentMethodTotals(start, end time.Time) ([]PaymentAggregateRow, error) {
	var rows []PaymentAggregateRow
	err := r.db.Table("transactions").
		Select("payment_method, SUM(total_amount) as total_amount").
		Where("transaction_date >= ? AND transaction_date < ? AND type = ?", start, end, "sale").
		Group("payment_method").
		Order("total_amount DESC").
		Scan(&rows).Error
	return rows, err
}

// FindLowStock mengambil produk yang stoknya di bawah atau sama dengan threshold (limit)
func (r *ReportRepositoryImpl) FindLowStock(limit int) ([]model.Products, error) {
	var products []model.Products

	// Query GORM: Ambil produk yang stoknya <= limit, diurutkan dari yang paling sedikit
	err := r.db.Table("products").
		Where("stock <= ?", limit).
		Order("stock ASC").
		Find(&products).Error

	return products, err
}
