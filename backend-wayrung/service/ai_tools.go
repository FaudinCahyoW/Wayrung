package service

import (
	openrouter "github.com/OpenRouterTeam/go-sdk"
	"github.com/OpenRouterTeam/go-sdk/models/components"
)

const SystemPromptToko = `Kamu adalah Customer Service Wayrung bernama Moblit yang ramah dan profesional.
Tugasmu HANYA membantu menjawab pertanyaan seputar:
1. Sisa stok barang/produk
2. Laporan omzet/penjualan toko (hari ini)

ATURAN KETAT:
Jika pengguna bertanya hal di luar operasional toko (misal: pengetahuan umum, sains, curhat, coding, politik, dll), 
TOLAK dengan sopan. Katakan: "Maaf, saya hanya bisa membantu menjawab pertanyaan seputar stok produk dan omzet toko Wayrung."`

func GetShopTools() []components.ChatFunctionTool {
	return []components.ChatFunctionTool{
		components.CreateChatFunctionToolChatFunctionToolFunction(
			components.ChatFunctionToolFunction{
				Type: components.ChatFunctionToolTypeFunction,
				Function: components.ChatFunctionToolFunctionFunction{
					Name:        "get_omzet_hari_ini",
					Description: openrouter.Pointer("Mengambil total omzet/penjualan toko untuk hari ini"),
				},
			},
		),
		components.CreateChatFunctionToolChatFunctionToolFunction(
			components.ChatFunctionToolFunction{
				Type: components.ChatFunctionToolTypeFunction,
				Function: components.ChatFunctionToolFunctionFunction{
					Name:        "get_stok_barang",
					Description: openrouter.Pointer("Mengecek sisa stok produk berdasarkan nama atau keyword produk"),
					Parameters: map[string]any{
						"type": "object",
						"properties": map[string]any{
							"nama_barang": map[string]any{
								"type":        "string",
								"description": "Nama atau keyword barang yang ingin dicek stoknya",
							},
						},
						"required": []string{"nama_barang"},
					},
				},
			},
		),
	}
}