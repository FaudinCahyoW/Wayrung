package repository

import (
	"wayrung/model"

	"gorm.io/gorm"
)

// UserRepository mendefinisikan interface untuk manajemen data pengguna (users).
type UserRepository interface {
	// Create menambahkan pengguna baru ke database.
	Create(user *model.Users) error
	// FindByID mengambil data pengguna berdasarkan ID.
	FindByID(id uint) (model.Users, error)
	// FindByEmail mengambil data pengguna berdasarkan alamat email.
	FindByEmail(email string) (model.Users, error)
	// FindAll mengambil seluruh data pengguna.
	FindAll() ([]model.Users, error)
}

// UserRepositoryImpl merupakan implementasi dari UserRepository menggunakan GORM.
type UserRepositoryImpl struct {
	db *gorm.DB
}

// NewUserRepository membuat instance baru dari UserRepository.
func NewUserRepository(db *gorm.DB) UserRepository {
	return &UserRepositoryImpl{db: db}
}

// Create menyimpan data pengguna baru ke database.
func (r *UserRepositoryImpl) Create(user *model.Users) error {
	return r.db.Create(user).Error
}

// FindByID mencari pengguna berdasarkan ID primary key.
func (r *UserRepositoryImpl) FindByID(id uint) (model.Users, error) {
	var user model.Users
	err := r.db.First(&user, id).Error
	return user, err
}

// FindByEmail mencari pengguna berdasarkan alamat email yang unik.
func (r *UserRepositoryImpl) FindByEmail(email string) (model.Users, error) {
	var user model.Users
	err := r.db.Where("email = ?", email).First(&user).Error
	return user, err
}

// FindAll mengambil daftar seluruh pengguna.
func (r *UserRepositoryImpl) FindAll() ([]model.Users, error) {
	var users []model.Users
	err := r.db.Find(&users).Error
	return users, err
}
