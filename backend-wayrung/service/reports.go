package service

import (
	"fmt"
	"time"

	"wayrung/dto"
	"wayrung/repository"
)

// ReportService mendefinisikan interface layanan laporan (agregasi transaksi & stok).
type ReportService interface {
	// GetSummary menghitung ringkasan pemasukan, pengeluaran, laba kotor, dan jumlah transaksi
	// untuk rentang waktu tertentu, beserta persentase perubahan dari periode sebelumnya.
	GetSummary(rangeStr string) (dto.ReportSummary, error)
	// GetSalesChart menghasilkan data grafik pemasukan vs pengeluaran per hari.
	GetSalesChart(rangeStr string) ([]dto.SalesChartPoint, error)
	// GetTopProducts menghasilkan daftar produk terlaris dalam rentang waktu tertentu.
	GetTopProducts(rangeStr string, limit int) ([]dto.TopProduct, error)
	// GetPaymentMethods menghasilkan breakdown persentase transaksi per metode pembayaran.
	GetPaymentMethods(rangeStr string) ([]dto.PaymentMethodBreakdown, error)
}

// ReportServiceImpl merupakan implementasi dari ReportService.
type ReportServiceImpl struct {
	reportRepo repository.ReportRepository
}

// NewReportService membuat instance baru dari ReportService.
func NewReportService(reportRepo repository.ReportRepository) ReportService {
	return &ReportServiceImpl{reportRepo: reportRepo}
}

// dayLabels adalah label hari singkat Bahasa Indonesia, index sesuai time.Weekday()
// (0 = Minggu, 1 = Senin, dst — sesuai konvensi package time Go).
var dayLabels = []string{"Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"}

// resolveRange menerjemahkan parameter range ("today"/"week"/"month") menjadi rentang waktu
// [start, end) untuk periode berjalan, serta [prevStart, prevEnd) untuk periode pembanding
// dengan panjang yang sama persis sebelumnya.
func resolveRange(rangeStr string) (start, end, prevStart, prevEnd time.Time, err error) {
	now := time.Now()
	loc := now.Location()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	switch rangeStr {
	case "today":
		start = today
		end = start.AddDate(0, 0, 1)
		prevStart = start.AddDate(0, 0, -1)
		prevEnd = start

	case "month":
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 1, 0)
		prevStart = start.AddDate(0, -1, 0)
		prevEnd = start

	case "week":
		// Senin dianggap sebagai awal minggu.
		weekday := int(today.Weekday()) // 0 = Minggu
		if weekday == 0 {
			weekday = 7
		}
		start = today.AddDate(0, 0, -(weekday - 1))
		end = start.AddDate(0, 0, 7)
		prevStart = start.AddDate(0, 0, -7)
		prevEnd = start

	default:
		err = fmt.Errorf("range tidak valid, gunakan salah satu: today, week, month")
	}
	return
}

// percentChange menghitung persentase perubahan dari nilai prev ke current.
// Jika prev == 0, dianggap naik 100% saat current > 0, atau 0% kalau keduanya 0.
func percentChange(prev, current float64) float64 {
	if prev == 0 {
		if current == 0 {
			return 0
		}
		return 100
	}
	return ((current - prev) / prev) * 100
}

// sumByType menjumlahkan Total dari rows yang Type-nya cocok dengan target,
// dan mengembalikan total keseluruhan Count di semua rows (dipakai untuk transaction_count).
func sumByType(rows []repository.IncomeExpenseRow, targetType string) float64 {
	for _, row := range rows {
		if row.Type == targetType {
			return row.Total
		}
	}
	return 0
}

func totalCount(rows []repository.IncomeExpenseRow) int64 {
	var total int64
	for _, row := range rows {
		total += row.Count
	}
	return total
}

// GetSummary menghitung ringkasan laporan untuk rentang waktu tertentu.
func (s *ReportServiceImpl) GetSummary(rangeStr string) (dto.ReportSummary, error) {
	start, end, prevStart, prevEnd, err := resolveRange(rangeStr)
	if err != nil {
		return dto.ReportSummary{}, err
	}

	rows, err := s.reportRepo.GetIncomeExpense(start, end)
	if err != nil {
		return dto.ReportSummary{}, err
	}
	prevRows, err := s.reportRepo.GetIncomeExpense(prevStart, prevEnd)
	if err != nil {
		return dto.ReportSummary{}, err
	}

	income := sumByType(rows, "sale")
	expense := sumByType(rows, "purchase")
	count := totalCount(rows)

	prevIncome := sumByType(prevRows, "sale")
	prevExpense := sumByType(prevRows, "purchase")
	prevCount := totalCount(prevRows)

	profit := income - expense
	prevProfit := prevIncome - prevExpense

	return dto.ReportSummary{
		TotalIncome:          income,
		TotalExpense:         expense,
		GrossProfit:          profit,
		TransactionCount:     count,
		IncomeChangePercent:  percentChange(prevIncome, income),
		ExpenseChangePercent: percentChange(prevExpense, expense),
		ProfitChangePercent:  percentChange(prevProfit, profit),
		TransactionCountDiff: count - prevCount,
	}, nil
}

// GetSalesChart menghasilkan satu titik data per hari dalam rentang waktu, termasuk hari
// yang tidak punya transaksi sama sekali (diisi 0) supaya grafik tidak bolong.
func (s *ReportServiceImpl) GetSalesChart(rangeStr string) ([]dto.SalesChartPoint, error) {
	start, end, _, _, err := resolveRange(rangeStr)
	if err != nil {
		return nil, err
	}

	rows, err := s.reportRepo.GetDailyAggregates(start, end)
	if err != nil {
		return nil, err
	}

	// Inisialisasi semua tanggal dalam rentang dengan nilai 0 dulu.
	pointByDate := make(map[string]*dto.SalesChartPoint)
	var order []string
	for d := start; d.Before(end); d = d.AddDate(0, 0, 1) {
		key := d.Format("2006-01-02")
		order = append(order, key)
		pointByDate[key] = &dto.SalesChartPoint{
			Date:  key,
			Label: dayLabels[int(d.Weekday())],
		}
	}

	// Timpa dengan hasil agregasi yang sesungguhnya.
	for _, row := range rows {
		key := row.Date.Format("2006-01-02")
		point, ok := pointByDate[key]
		if !ok {
			continue
		}
		switch row.Type {
		case "sale":
			point.Income = row.Total
		case "purchase":
			point.Expense = row.Total
		}
	}

	result := make([]dto.SalesChartPoint, 0, len(order))
	for _, key := range order {
		result = append(result, *pointByDate[key])
	}
	return result, nil
}

// GetTopProducts menghasilkan daftar produk terlaris dalam rentang waktu tertentu.
func (s *ReportServiceImpl) GetTopProducts(rangeStr string, limit int) ([]dto.TopProduct, error) {
	start, end, _, _, err := resolveRange(rangeStr)
	if err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 5
	}
	return s.reportRepo.GetTopProducts(start, end, limit)
}

// GetPaymentMethods menghasilkan breakdown persentase transaksi per metode pembayaran.
func (s *ReportServiceImpl) GetPaymentMethods(rangeStr string) ([]dto.PaymentMethodBreakdown, error) {
	start, end, _, _, err := resolveRange(rangeStr)
	if err != nil {
		return nil, err
	}

	rows, err := s.reportRepo.GetPaymentMethodTotals(start, end)
	if err != nil {
		return nil, err
	}

	var grandTotal float64
	for _, row := range rows {
		grandTotal += row.TotalAmount
	}

	result := make([]dto.PaymentMethodBreakdown, 0, len(rows))
	for _, row := range rows {
		var pct float64
		if grandTotal > 0 {
			pct = (row.TotalAmount / grandTotal) * 100
		}
		result = append(result, dto.PaymentMethodBreakdown{
			PaymentMethod: row.PaymentMethod,
			TotalAmount:   row.TotalAmount,
			Percentage:    pct,
		})
	}
	return result, nil
}