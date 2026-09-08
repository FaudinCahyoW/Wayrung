package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
)

// NotificationRepository mendefinisikan interface untuk mengelola data notifikasi.
type NotificationRepository interface {
	// CreateTx menyimpan notifikasi baru (dapat menerima *gorm.DB session untuk transaksi).
	CreateTx(tx *gorm.DB, notification *model.Notifications) error
	// FindByUserID mengambil daftar notifikasi milik pengguna tertentu.
	FindByUserID(userID uint) ([]model.Notifications, error)
	// MarkAsRead mengubah status notifikasi menjadi sudah dibaca.
	MarkAsRead(id uint, userID uint) error
}

// NotificationRepositoryImpl merupakan implementasi dari NotificationRepository menggunakan GORM.
type NotificationRepositoryImpl struct {
	db *gorm.DB
}

// NewNotificationRepository membuat instance baru dari NotificationRepository.
func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &NotificationRepositoryImpl{db: db}
}

// CreateTx membuat record notifikasi baru ke database.
func (r *NotificationRepositoryImpl) CreateTx(tx *gorm.DB, notification *model.Notifications) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.Create(notification).Error
}

// FindByUserID mengambil seluruh notifikasi pengguna diurutkan dari yang terbaru.
func (r *NotificationRepositoryImpl) FindByUserID(userID uint) ([]model.Notifications, error) {
	var notifications []model.Notifications
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

// MarkAsRead memperbarui kolom is_read menjadi true untuk notifikasi spesifik.
func (r *NotificationRepositoryImpl) MarkAsRead(id uint, userID uint) error {
	return r.db.Model(&model.Notifications{}).Where("id = ? AND user_id = ?", id, userID).Update("is_read", true).Error
}
