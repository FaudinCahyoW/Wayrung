package service

import (
	"fmt"
	"wayrung/model"
	"wayrung/repository"
)

// AuditLogService mendefinisikan interface layanan penelusuran audit log sistem.
type AuditLogService interface {
	// FindAll mengambil seluruh riwayat aktivitas log pengguna.
	FindAll() ([]model.AuditLogs, error)
	// FindByUserID mengambil riwayat aktivitas log milik pengguna tertentu.
	FindByUserID(userID uint) ([]model.AuditLogs, error)
}

// AuditLogServiceImpl merupakan implementasi dari AuditLogService.
type AuditLogServiceImpl struct {
	auditLogRepo repository.AuditLogRepository
}

// NewAuditLogService membuat instance baru dari AuditLogService.
func NewAuditLogService(auditLogRepo repository.AuditLogRepository) AuditLogService {
	return &AuditLogServiceImpl{auditLogRepo: auditLogRepo}
}

// FindAll mengembalikan seluruh data log audit dari database.
func (s *AuditLogServiceImpl) FindAll() ([]model.AuditLogs, error) {
	logs, err := s.auditLogRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data audit log: %w", err)
	}
	return logs, nil
}

// FindByUserID mengembalikan log audit yang terasosiasi dengan userID tertentu.
func (s *AuditLogServiceImpl) FindByUserID(userID uint) ([]model.AuditLogs, error) {
	logs, err := s.auditLogRepo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil audit log pengguna: %w", err)
	}
	return logs, nil
}
