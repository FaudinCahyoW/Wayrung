package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// SettingsRepository mendefinisikan interface operasi data pengaturan pengguna.
type SettingsRepository interface {
	// FindByUserID mengambil pengaturan aplikasi berdasarkan ID pengguna.
	FindByUserID(userID uint) (model.Settings, error)
	// Upsert menyimpan atau memperbarui data pengaturan pengguna.
	Upsert(settings *model.Settings) error
}

// SettingsRepositoryImpl merupakan implementasi dari SettingsRepository menggunakan GORM.
type SettingsRepositoryImpl struct {
	db *gorm.DB
}

// NewSettingsRepository membuat instance baru dari SettingsRepository.
func NewSettingsRepository(db *gorm.DB) SettingsRepository {
	return &SettingsRepositoryImpl{db: db}
}

// FindByUserID mengambil data pengaturan milik pengguna tertentu.
func (r *SettingsRepositoryImpl) FindByUserID(userID uint) (model.Settings, error) {
	var settings model.Settings
	err := r.db.Where("user_id = ?", userID).First(&settings).Error
	return settings, err
}

// Upsert membuat data pengaturan jika belum ada, atau meng-update jika sudah ada berdasarkan user_id.
func (r *SettingsRepositoryImpl) Upsert(settings *model.Settings) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"low_stock_notification", "low_stock_threshold", "transaction_notification", "updated_at"}),
	}).Save(settings).Error
}
