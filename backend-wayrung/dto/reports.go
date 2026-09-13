package dto

// ReportSummary merupakan DTO ringkasan laporan (kartu statistik di halaman Laporan).
// Dihitung dari agregasi tabel transactions, dibandingkan dengan periode sebelumnya
// yang panjangnya sama (mis. minggu ini vs minggu lalu).
type ReportSummary struct {
	TotalIncome          float64 `json:"total_income"`
	TotalExpense         float64 `json:"total_expense"`
	GrossProfit          float64 `json:"gross_profit"`
	TransactionCount     int64   `json:"transaction_count"`
	IncomeChangePercent  float64 `json:"income_change_percent"`
	ExpenseChangePercent float64 `json:"expense_change_percent"`
	ProfitChangePercent  float64 `json:"profit_change_percent"`
	TransactionCountDiff int64   `json:"transaction_count_diff"`
}

// SalesChartPoint merupakan satu titik data pada grafik pemasukan vs pengeluaran harian.
type SalesChartPoint struct {
	Date    string  `json:"date"`  // format YYYY-MM-DD
	Label   string  `json:"label"` // label hari singkat, mis. "Sen"
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}

// TopProduct merupakan DTO untuk satu baris di tabel "Produk terlaris".
// Dihitung dari SUM(quantity) transaction_details, hanya untuk transaksi bertipe "sale".
type TopProduct struct {
	ProductID    uint    `json:"product_id"`
	ProductName  string  `json:"product_name"`
	SKU          string  `json:"sku"`
	QuantitySold int64   `json:"quantity_sold"`
	Revenue      float64 `json:"revenue"`
}

// PaymentMethodBreakdown merupakan DTO untuk satu baris di tabel "Metode pembayaran".
type PaymentMethodBreakdown struct {
	PaymentMethod string  `json:"payment_method"`
	TotalAmount   float64 `json:"total_amount"`
	Percentage    float64 `json:"percentage"`
}