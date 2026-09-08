package service

import (
	"fmt"
	"wayrung/dto"
	"wayrung/repository"
)

// NotificationService mendefinisikan interface layanan kelola notifikasi.
type NotificationService interface {
	// GetByUserID mengambil seluruh notifikasi milik pengguna tertentu.
	GetByUserID(userID uint) ([]dto.NotificationResponse, error)
	// MarkAsRead menandai notifikasi sebagai sudah dibaca.
	MarkAsRead(id uint, userID uint) error
}

// NotificationServiceImpl merupakan implementasi dari NotificationService.
type NotificationServiceImpl struct {
	notificationRepo repository.NotificationRepository
}

// NewNotificationService membuat instance baru dari NotificationService.
func NewNotificationService(notificationRepo repository.NotificationRepository) NotificationService {
	return &NotificationServiceImpl{notificationRepo: notificationRepo}
}

// GetByUserID mengambil daftar notifikasi pengguna dari repository.
func (s *NotificationServiceImpl) GetByUserID(userID uint) ([]dto.NotificationResponse, error) {
	notifications, err := s.notificationRepo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil notifikasi: %w", err)
	}
	return dto.ToNotificationResponseList(notifications), nil
}

// MarkAsRead memperbarui status keterbacaan notifikasi.
func (s *NotificationServiceImpl) MarkAsRead(id uint, userID uint) error {
	if err := s.notificationRepo.MarkAsRead(id, userID); err != nil {
		return fmt.Errorf("gagal memperbarui status notifikasi: %w", err)
	}
	return nil
}
