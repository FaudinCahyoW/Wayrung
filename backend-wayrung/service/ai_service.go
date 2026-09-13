package service

import (
	"context"
	"encoding/json"
	"fmt"
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
		return fmt.Sprintf("Total omzet toko hari ini adalah Rp %.0f", totalOmzet), nil

	case "get_stok_barang":
		var args struct {
			NamaBarang string `json:"nama_barang"`
		}
		_ = json.Unmarshal([]byte(toolCall.Function.Arguments), &args)

		products, err := s.productRepo.FindByName(args.NamaBarang)
		if err != nil || len(products) == 0 {
			return fmt.Sprintf("Produk dengan kata kunci '%s' tidak ditemukan.", args.NamaBarang), nil
		}

		var result string
		for _, p := range products {
			result += fmt.Sprintf("- %s (SKU: %s): stok tersisa %d pcs\n", p.Name, p.SKU, p.Stock)
		}
		return fmt.Sprintf("Berikut informasi stok produk yang ditemukan:\n%s", result), nil
	}

	if content, ok := choice.Message.Content.Get(); ok && content != nil && content.Str != nil {
		return *content.Str, nil
	}
	return "", nil
}