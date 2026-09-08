package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
)

// AuditLogRepository mendefinisikan interface operasi data log audit aktivitas.
type AuditLogRepository interface {
	// CreateTx mencatat aktivitas log audit baru.
	CreateTx(tx *gorm.DB, auditLog *model.AuditLogs) error
	// FindAll mengambil seluruh log audit aktivitas sistem.
	FindAll() ([]model.AuditLogs, error)
	// FindByUserID mengambil log audit berdasarkan pengguna tertentu.
	FindByUserID(userID uint) ([]model.AuditLogs, error)
}

// AuditLogRepositoryImpl merupakan implementasi dari AuditLogRepository menggunakan GORM.
type AuditLogRepositoryImpl struct {
	db *gorm.DB
}

// NewAuditLogRepository membuat instance baru dari AuditLogRepository.
func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &AuditLogRepositoryImpl{db: db}
}

// CreateTx menambahkan baris catatan audit log baru ke database.
func (r *AuditLogRepositoryImpl) CreateTx(tx *gorm.DB, auditLog *model.AuditLogs) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.Create(auditLog).Error
}

// FindAll mengambil seluruh riwayat aktivitas log dari database.
func (r *AuditLogRepositoryImpl) FindAll() ([]model.AuditLogs, error) {
	var logs []model.AuditLogs
	err := r.db.Preload("User").Order("created_at DESC").Find(&logs).Error
	return logs, err
}

// FindByUserID mengambil riwayat log audit milik pengguna tertentu.
func (r *AuditLogRepositoryImpl) FindByUserID(userID uint) ([]model.AuditLogs, error) {
	var logs []model.AuditLogs
	err := r.db.Where("user_id = ?", userID).Preload("User").Order("created_at DESC").Find(&logs).Error
	return logs, err
}
