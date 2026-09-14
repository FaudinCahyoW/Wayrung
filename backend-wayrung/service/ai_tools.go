package service

import (
	openrouter "github.com/OpenRouterTeam/go-sdk"
	"github.com/OpenRouterTeam/go-sdk/models/components"
)

const SystemPromptToko = `Kamu adalah Customer Service Wayrung bernama Moblit yang ramah dan profesional.
Tugasmu HANYA membantu menjawab pertanyaan seputar:
1. Sisa stok barang/produk tertentu atau SELURUH produk toko
2. Laporan omzet/penjualan toko (hari ini)
3. Stok barang/produk yang menipis di toko
4. Laporan mendapatkan produk terjual terbanyak (top 5)
5. Rincian total transaksi berdasarkan metode pembayaran (Cash, QRIS, dll)

ATURAN TOOL:
- Gunakan 'get_stok_barang' jika pengguna bertanya stok produk tertentu (misal: "stok beras ada?").
- Gunakan 'get_stok_all_barang' jika pengguna bertanya daftar/semua stok produk (misal: "tampilkan semua stok", "ada barang apa aja?").
- Gunakan 'get_stok_menipis' Jika pengguna bertanya barang yang mau habis (misal:"cek stok barang yang menipis").
- Gunakan 'get_top_barang' jika pengguna bertanya barang yang paling laku (misal:"tampilkan top 5 daftar barang paling laku")
- Gunakan 'get_laporan_pembayaran' jika pengguna bertanya metode pembayaran pelanggan (misal: "banyakan bayar ncash atau qris?").

ATURAN KETAT:
Jika pengguna bertanya hal di luar operasional toko, TOLAK dengan sopan.`

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
		components.CreateChatFunctionToolChatFunctionToolFunction(
			components.ChatFunctionToolFunction{
				Type: components.ChatFunctionToolTypeFunction,
				Function: components.ChatFunctionToolFunctionFunction{
					Name: "get_stok_all_barang",
					Description: openrouter.Pointer("Mengambil daftar sisa stok untuk SEMUA produk yang ada di toko"),
				},
			},
		),
		components.CreateChatFunctionToolChatFunctionToolFunction(
			components.ChatFunctionToolFunction{
				Type: components.ChatFunctionToolTypeFunction,
				Function: components.ChatFunctionToolFunctionFunction{
					Name: "get_stok_menipis",
					Description: openrouter.Pointer("Mengambil daftar stok barang yang mulai menipis"),
				},
			},
		),

		components.CreateChatFunctionToolChatFunctionToolFunction(
			components.ChatFunctionToolFunction{
				Type: components.ChatFunctionToolTypeFunction,
				Function: components.ChatFunctionToolFunctionFunction{
					Name:        "get_top_barang",
					Description: openrouter.Pointer("Mengambil daftar barang yang paling laku"),
				},
			},
		),
		
		components.CreateChatFunctionToolChatFunctionToolFunction(
			components.ChatFunctionToolFunction{
				Type: components.ChatFunctionToolTypeFunction,
				Function: components.ChatFunctionToolFunctionFunction{
					Name:        "get_laporan_pembayaran",
					Description: openrouter.Pointer("Mengambil laporan metode pembayaran (QRIS, Cash, Transfer, dll) yang paling banyak digunakan transaksi bulan ini"),
				},
			},
		),
		
	}
}