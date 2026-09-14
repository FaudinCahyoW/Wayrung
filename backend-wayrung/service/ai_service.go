package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	openrouter "github.com/OpenRouterTeam/go-sdk"
	"github.com/OpenRouterTeam/go-sdk/models/components"
	"wayrung/repository" // Ganti jika path module beda
)

type AIService interface {
	AskBot(ctx context.Context, userQuery string) (string, error)
}

type aiService struct {
	client      *openrouter.OpenRouter
	productRepo repository.ProductRepository
	reportRepo  repository.ReportRepository
}

func NewAIService(apiKey string, productRepo repository.ProductRepository, reportRepo repository.ReportRepository) AIService {
	return &aiService{
		client:      openrouter.New(openrouter.WithSecurity(apiKey)),
		productRepo: productRepo,
		reportRepo:  reportRepo,
	}
}

func (s *aiService) AskBot(ctx context.Context, userQuery string) (string, error) {
	messages := []components.ChatMessages{
		components.CreateChatMessagesSystem(components.ChatSystemMessage{
			Content: components.CreateChatSystemMessageContentStr(SystemPromptToko),
			Role:    components.ChatSystemMessageRoleSystem,
		}),
		components.CreateChatMessagesUser(components.ChatUserMessage{
			Content: components.CreateChatUserMessageContentStr(userQuery),
			Role:    components.ChatUserMessageRoleUser,
		}),
	}

	res, err := s.client.Chat.Send(ctx, components.ChatRequest{
		Model:    openrouter.Pointer("openai/gpt-4o-mini"),
		Messages: messages,
		Tools:    GetShopTools(),
	}, nil)
	if err != nil {
		return "", err
	}

	choice := res.ChatResult.Choices[0]

	// Jika AI langsung menjawab (ditolak atau tidak butuh data DB)
	if len(choice.Message.ToolCalls) == 0 {
		if content, ok := choice.Message.Content.Get(); ok && content != nil && content.Str != nil {
			return *content.Str, nil
		}
		return "", nil
	}

	// Jika AI meminta panggil Tool Database
	toolCall := choice.Message.ToolCalls[0]

	switch toolCall.Function.Name {
	// Cek Omzet Hari Ini
	case "get_omzet_hari_ini":
		now := time.Now()
		start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		end := start.AddDate(0, 0, 1)

		rows, err := s.reportRepo.GetIncomeExpense(start, end)
		if err != nil {
			return "Gagal mengambil data omzet dari database.", nil
		}

		var totalOmzet float64
		for _, row := range rows {
			if row.Type == "sale" {
				totalOmzet = row.Total
				break
			}
		}
		return fmt.Sprintf("Total omzet toko hari ini adalah Rp %s", formatRupiah(totalOmzet)), nil

	// Cari stok berdasarkan nama barang
	case "get_stok_barang":
		var args struct {
			NamaBarang string `json:"nama_barang"`
		}
		_ = json.Unmarshal([]byte(toolCall.Function.Arguments), &args)

		products, err := s.productRepo.FindByName(args.NamaBarang)
		if err != nil || len(products) == 0 {
			return fmt.Sprintf("Produk dengan kata kunci '%s' tidak ditemukan.", args.NamaBarang), nil
		}

		var sb strings.Builder
		sb.WriteString("Berikut informasi stok produk yang ditemukan:\n")
		for _, p := range products {
			sb.WriteString(fmt.Sprintf("- %s (SKU: %s): stok tersisa %d pcs\n", p.Name, p.SKU, p.Stock))
		}
		return sb.String(), nil

	// Tampilkan Semua Stok Barang
	case "get_stok_all_barang":
		products, err := s.productRepo.FindAll()
		if err != nil || len(products) == 0 {
			return "Gagal mengambil daftar produk atau belum ada produk tersimpan.", nil
		}

		var sb strings.Builder
		sb.WriteString("Berikut adalah daftar stok seluruh produk:\n")
		for _, p := range products {
			sb.WriteString(fmt.Sprintf("- %s: %d pcs\n", p.Name, p.Stock))
		}
		return sb.String(), nil

	// Tampilkan stok yang mulai menipis
	case "get_stok_menipis":
		products, err := s.reportRepo.FindLowStock(5)
		if err != nil {
			return "Gagal mengambil daftar produk stok menipis.", nil
		}
		if len(products) == 0 {
			return "Semua stok produk saat ini dalam kondisi aman (tidak ada yang menipis).", nil
		}

		var sm strings.Builder
		sm.WriteString("⚠️ **Daftar Produk Stok Menipis (<= 5 pcs):**\n")
		for _, p := range products {
			sm.WriteString(fmt.Sprintf("- %s (SKU: %s): sisa %d pcs\n", p.Name, p.SKU, p.Stock))
		}
		return sm.String(), nil

	// Tampilkan produk yang paling laris (Disamakan nama tool-nya dengan ai_tools.go)
	case "get_top_barang":
		now := time.Now()
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end := now

		topProducts, err := s.reportRepo.GetTopProducts(start, end, 5)
		if err != nil {
			return "Gagal mengambil data produk terlaris.", nil
		}
		if len(topProducts) == 0 {
			return "Belum ada data penjualan produk untuk bulan ini.", nil
		}

		var sb strings.Builder
		sb.WriteString("🔥 **Top 5 Produk Terlaris Bulan Ini:**\n")
		for i, p := range topProducts {
			sb.WriteString(fmt.Sprintf("%d. %s - Terjual: %d pcs (Omzet: Rp %s)\n",
				i+1, p.ProductName, p.QuantitySold, formatRupiah(p.Revenue)))
		}
		return sb.String(), nil

	// Mengambil laporan metode pembayaran
	case "get_laporan_pembayaran":
		now := time.Now()
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end := now

		paymentMethods, err := s.reportRepo.GetPaymentMethodTotals(start, end)
		if err != nil {
			return "Gagal mengambil data transaksi pembayaran.", nil
		}
		if len(paymentMethods) == 0 {
			return "Belum ada data transaksi pembayaran untuk bulan ini.", nil
		}

		var sb strings.Builder
		sb.WriteString("💳 **Laporan Metode Pembayaran Bulan Ini:**\n")
		for i, p := range paymentMethods {
			sb.WriteString(fmt.Sprintf("%d. %s - Total: Rp %s\n",
				i+1, p.PaymentMethod, formatRupiah(p.TotalAmount)))
		}
		return sb.String(), nil
	}

	if content, ok := choice.Message.Content.Get(); ok && content != nil && content.Str != nil {
		return *content.Str, nil
	}
	return "", nil
}

// 📍 FUNGSI HELPER FORMAT RUPIAH DITARUH DI SINI (PALING BAWAH FILE)
func formatRupiah(amount float64) string {
	str := fmt.Sprintf("%.0f", amount)
	n := len(str)
	if n <= 3 {
		return str
	}

	var result strings.Builder
	remainder := n % 3
	if remainder > 0 {
		result.WriteString(str[:remainder])
		result.WriteString(".")
	}

	for i := remainder; i < n; i += 3 {
		result.WriteString(str[i : i+3])
		if i+3 < n {
			result.WriteString(".")
		}
	}

	return result.String()
}