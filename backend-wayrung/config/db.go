package config

import (
	"fmt"
	"log"
	"os"
	"wayrung/model"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// GetENV mengambil nilai environment variable berdasarkan key,
// jika tidak ditemukan maka akan mengembalikan nilai fallback yang diberikan.
func GetENV(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}

// InitDB menginisialisasi koneksi database PostgreSQL menggunakan GORM
// dan menjalankan auto-migration untuk seluruh tabel model aplikasi.
func InitDB() *gorm.DB {
	host := GetENV("DB_HOST", "localhost")
	user := GetENV("DB_USER", "postgres")
	password := GetENV("DB_PASSWORD", "p4ssw0rd")
	dbname := GetENV("DB_NAME", "wayrungdb")
	port := GetENV("DB_PORT", "5433")
	sslmode := GetENV("DB_SSLMODE", "disable")
	timezone := GetENV("DB_TIMEZONE", "Asia/Jakarta")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s TimeZone=%s sslmode=%s",
		host, user, password, dbname, port, timezone, sslmode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Gagal terhubung ke database: %v", err)
	}

	// Menjalankan auto-migration untuk seluruh tabel berdasarkan model struct
	err = db.AutoMigrate(
		&model.Users{},
		&model.Categories{},
		&model.Products{},
		&model.Transactions{},
		&model.TransactionDetails{},
		&model.AuditLogs{},
		&model.Notifications{},
		&model.Settings{},
	)
	if err != nil {
		log.Fatalf("Gagal melakukan auto migrate schema database: %v", err)
	}

	log.Println("Koneksi database berhasil dan auto-migration selesai.")
	return db
}
