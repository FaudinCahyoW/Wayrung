package config

import (
	"log"
	"wayrung/model"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedDB memasukkan data awal (seeder) ke database secara otomatis.
func SeedDB(db *gorm.DB) {
	var user model.Users
	email := "fadn@gmail.com"

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[SEEDER] Gagal meng-hash password: %v", err)
		return
	}

	result := db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		// User belum ada, buat user owner baru
		owner := model.Users{
			Name:     "faudin",
			Email:    email,
			Password: string(hashedPassword),
			Role:     "owner",
		}

		if err := db.Create(&owner).Error; err != nil {
			log.Printf("[SEEDER] Gagal membuat user owner: %v", err)
			return
		}

		// Buat settings default untuk user owner
		setting := model.Settings{
			UserID:                  owner.ID,
			LowStockNotification:    true,
			LowStockThreshold:       5,
			TransactionNotification: true,
		}
		db.Create(&setting)

		log.Printf("[SEEDER] Berhasil membuat user owner -> Name: faudin | Email: %s | Password: password123 | Role: owner", email)
	} else {
		// User sudah ada, pastikan role adalah owner dan nama faudin
		db.Model(&user).Updates(map[string]interface{}{
			"name": "faudin",
			"role": "owner",
		})
		log.Printf("[SEEDER] User dengan email %s sudah ada. Role dipastikan menjadi 'owner'.", email)
	}
}
