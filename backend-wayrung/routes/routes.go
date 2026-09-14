package routes

import (
	"net/http"
	"wayrung/handler"

	"github.com/gin-gonic/gin"
	cors "github.com/rs/cors/wrapper/gin"
)

// SetupRouter mengonfigurasi seluruh endpoint HTTP dan mengaitkan middleware otorisasi.
func SetupRouter(
	authHandler *handler.AuthHandler,
	categoryHandler *handler.CategoryHandler,
	productHandler *handler.ProductHandler,
	transactionHandler *handler.TransactionHandler,
	settingsHandler *handler.SettingsHandler,
	notificationHandler *handler.NotificationHandler,
	auditLogHandler *handler.AuditLogHandler,
	reportHandler *handler.ReportHandler,
	chatHandler *handler.ChatHandler,
) *gin.Engine {
	r := gin.Default()

	// Config CORS untuk mengizinkan akses dari Next.js (http://localhost:3000)
	r.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
		Debug:            false,
	}))

	// Endpoint Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Server is healthy",
		})
	})

	// 1. Endpoint Publik (Autentikasi)
	api := r.Group("/api/v1")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"message": "Server is healthy",
			})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}
	}

	// 2. Endpoint Terproteksi JWT (Dapat diakses oleh 'owner' maupun 'kasir')
	protected := api.Group("")
	protected.Use(JWTMiddleware())
	{
		// Kategori Produk (Owner & Kasir dapat membaca)
		protected.GET("/categories", categoryHandler.FindAll)
		protected.GET("/categories/:id", categoryHandler.FindByID)

		// Produk (Owner & Kasir dapat membaca)
		protected.GET("/products", productHandler.FindAll)
		protected.GET("/products/:id", productHandler.FindByID)

		// Transaksi (Owner & Kasir dapat membuat & membaca transaksi)
		protected.POST("/transactions", transactionHandler.Create)
		protected.GET("/transactions", transactionHandler.FindAll)
		protected.GET("/transactions/:id", transactionHandler.FindByID)

		// Notifikasi Pengguna
		protected.GET("/notifications", notificationHandler.GetNotifications)
		protected.PUT("/notifications/:id/read", notificationHandler.MarkAsRead)

		// Pengaturan Pengguna
		protected.GET("/settings", settingsHandler.GetSettings)
		protected.PUT("/settings", settingsHandler.UpdateSettings)

		// AI Chatbot (Owner & Kasir dapat menggunakan)
		protected.POST("/chat", chatHandler.HandleChat)

		// 🟢 LAPORAN: Dipindahkan ke sini agar Kasir & Owner sama-sama bisa membaca data
		protected.GET("/reports/summary", reportHandler.GetSummary)
		protected.GET("/reports/sales-chart", reportHandler.GetSalesChart)
		protected.GET("/reports/top-products", reportHandler.GetTopProducts)
		protected.GET("/reports/payment-methods", reportHandler.GetPaymentMethods)
	}

	// 3. Endpoint Terproteksi Khusus Role 'owner' (Owner-only endpoints)
	ownerOnly := api.Group("")
	ownerOnly.Use(JWTMiddleware(), RequireRoles("owner"))
	{
		// Manajemen Kategori oleh Owner
		ownerOnly.POST("/categories", categoryHandler.Create)
		ownerOnly.PUT("/categories/:id", categoryHandler.Update)
		ownerOnly.DELETE("/categories/:id", categoryHandler.Delete)

		// Manajemen Produk oleh Owner
		ownerOnly.POST("/products", productHandler.Create)
		ownerOnly.PUT("/products/:id", productHandler.Update)
		ownerOnly.DELETE("/products/:id", productHandler.Delete)

		// Penelusuran Log Audit oleh Owner
		ownerOnly.GET("/audit-logs", auditLogHandler.FindAll)
	}

	return r
}