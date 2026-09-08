package main

import (
	"log"
	"wayrung/config"
	"wayrung/handler"
	"wayrung/repository"
	"wayrung/routes"
	"wayrung/service"
)

// main merupakan entrypoint utama aplikasi backend Wayrung.
// Fungsi ini menginisialisasi database, repository, service, handler, dan menjalankan server HTTP.
func main() {
	// 1. Inisialisasi Koneksi Database & Auto Migration
	db := config.InitDB()
	config.SeedDB(db)


	// 2. Inisialisasi Repository Layer
	userRepo := repository.NewUserRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	productRepo := repository.NewProductRepository(db)
	txRepo := repository.NewTransactionRepository(db)
	settingsRepo := repository.NewSettingsRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)
	auditLogRepo := repository.NewAuditLogRepository(db)

	// 3. Inisialisasi Service Layer
	authService := service.NewAuthService(userRepo, settingsRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	productService := service.NewProductService(productRepo, categoryRepo)
	txService := service.NewTransactionService(txRepo, productRepo, settingsRepo, notificationRepo, auditLogRepo)
	settingsService := service.NewSettingsService(settingsRepo)
	notificationService := service.NewNotificationService(notificationRepo)
	auditLogService := service.NewAuditLogService(auditLogRepo)

	// 4. Inisialisasi Handler Layer
	authHandler := handler.NewAuthHandler(authService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	productHandler := handler.NewProductHandler(productService)
	txHandler := handler.NewTransactionHandler(txService)
	settingsHandler := handler.NewSettingsHandler(settingsService)
	notificationHandler := handler.NewNotificationHandler(notificationService)
	auditLogHandler := handler.NewAuditLogHandler(auditLogService)

	// 5. Inisialisasi Router Gin
	r := routes.SetupRouter(
		authHandler,
		categoryHandler,
		productHandler,
		txHandler,
		settingsHandler,
		notificationHandler,
		auditLogHandler,
	)

	// 6. Jalankan Server HTTP pada port 8080 (atau variabel SERVER_PORT)
	port := config.GetENV("SERVER_PORT", "8080")
	log.Printf("Server Wayrung berjalan di http://localhost:%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Gagal menjalankan server: %v", err)
	}
}