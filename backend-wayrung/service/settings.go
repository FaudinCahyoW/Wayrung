package service

import (
	"fmt"
	"wayrung/dto"
	"wayrung/model"
	"wayrung/repository"
)

// SettingsService mendefinisikan interface layanan manajemen pengaturan aplikasi pengguna.
type SettingsService interface {
	// GetByUserID mengambil pengaturan aplikasi berdasarkan ID pengguna.
	GetByUserID(userID uint) (dto.SettingsResponse, error)
	// Update memperbarui atau membuat pengaturan baru pengguna.
	Update(userID uint, req dto.UpdateSettingsRequest) (dto.SettingsResponse, error)
}

// SettingsServiceImpl merupakan implementasi dari SettingsService.
type SettingsServiceImpl struct {
	settingsRepo repository.SettingsRepository
}

// NewSettingsService membuat instance baru dari SettingsService.
func NewSettingsService(settingsRepo repository.SettingsRepository) SettingsService {
	return &SettingsServiceImpl{settingsRepo: settingsRepo}
}

// GetByUserID mengambil data pengaturan pengguna, jika belum ada maka mengembalikan pengaturan default.
func (s *SettingsServiceImpl) GetByUserID(userID uint) (dto.SettingsResponse, error) {
	setting, err := s.settingsRepo.FindByUserID(userID)
	if err != nil {
		// Mengembalikan default jika belum dikonfigurasi
		defaultSetting := model.Settings{
			UserID:                  userID,
			LowStockNotification:    true,
			LowStockThreshold:       5,
			TransactionNotification: true,
		}
		return dto.ToSettingsResponse(defaultSetting), nil
	}
	return dto.ToSettingsResponse(setting), nil
}

// Update menyimpan perubahan konfigurasi preferensi pengguna ke database.
func (s *SettingsServiceImpl) Update(userID uint, req dto.UpdateSettingsRequest) (dto.SettingsResponse, error) {
	setting := model.Settings{
		UserID:                  userID,
		LowStockNotification:    *req.LowStockNotification,
		LowStockThreshold:       *req.LowStockThreshold,
		TransactionNotification: *req.TransactionNotification,
	}

	if err := s.settingsRepo.Upsert(&setting); err != nil {
		return dto.SettingsResponse{}, fmt.Errorf("gagal menyimpan pengaturan: %w", err)
	}

	updatedSetting, err := s.settingsRepo.FindByUserID(userID)
	if err != nil {
		return dto.ToSettingsResponse(setting), nil
	}

	return dto.ToSettingsResponse(updatedSetting), nil
}
