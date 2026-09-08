package service

import (
	"errors"
	"fmt"
	"time"
	"wayrung/config"
	"wayrung/dto"
	"wayrung/model"
	"wayrung/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// AuthService mendefinisikan interface layanan autentikasi dan manajemen akun pengguna.
type AuthService interface {
	// Register mendaftarkan pengguna baru dengan role 'owner' atau 'kasir'.
	Register(req dto.RegisterRequest) (dto.UserResponse, error)
	// Login mengautentikasi pengguna berdasarkan email & password lalu menghasilkan JWT token.
	Login(req dto.LoginRequest) (dto.LoginResponse, error)
}

// AuthServiceImpl merupakan implementasi dari AuthService.
type AuthServiceImpl struct {
	userRepo     repository.UserRepository
	settingsRepo repository.SettingsRepository
}

// NewAuthService membuat instance baru dari AuthService.
func NewAuthService(userRepo repository.UserRepository, settingsRepo repository.SettingsRepository) AuthService {
	return &AuthServiceImpl{
		userRepo:     userRepo,
		settingsRepo: settingsRepo,
	}
}

// Register memproses pendaftaran pengguna baru, melakukan enkripsi password, dan membuat setting default.
func (s *AuthServiceImpl) Register(req dto.RegisterRequest) (dto.UserResponse, error) {
	// 1. Validasi pilihan role (hanya owner atau kasir)
	if req.Role != "owner" && req.Role != "kasir" {
		return dto.UserResponse{}, errors.New("role pengguna harus 'owner' atau 'kasir'")
	}

	// 2. Cek apakah email sudah terdaftar
	existingUser, err := s.userRepo.FindByEmail(req.Email)
	if err == nil && existingUser.ID != 0 {
		return dto.UserResponse{}, errors.New("email sudah terdaftar dalam sistem")
	}

	// 3. Hash password menggunakan bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return dto.UserResponse{}, fmt.Errorf("gagal memproses enkripsi password: %w", err)
	}

	// 4. Buat entity model pengguna
	user := model.Users{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	if err := s.userRepo.Create(&user); err != nil {
		return dto.UserResponse{}, fmt.Errorf("gagal menyimpan data pengguna: %w", err)
	}

	// 5. Inisialisasi pengaturan default pengguna (low stock threshold = 5)
	defaultSetting := model.Settings{
		UserID:                  user.ID,
		LowStockNotification:    true,
		LowStockThreshold:       5,
		TransactionNotification: true,
	}
	_ = s.settingsRepo.Upsert(&defaultSetting)

	return dto.ToUserResponse(user), nil
}

// Login mencocokkan kredensial pengguna dan mengembalikan token JWT yang berisi ID dan Role pengguna.
func (s *AuthServiceImpl) Login(req dto.LoginRequest) (dto.LoginResponse, error) {
	// 1. Cari pengguna berdasarkan email
	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		return dto.LoginResponse{}, errors.New("email atau password tidak valid")
	}

	// 2. Verifikasi kecocokan password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return dto.LoginResponse{}, errors.New("email atau password tidak valid")
	}

	// 3. Generate token JWT
	token, err := GenerateJWTToken(user.ID, user.Role)
	if err != nil {
		return dto.LoginResponse{}, fmt.Errorf("gagal membuat token autentikasi: %w", err)
	}

	return dto.LoginResponse{
		Token: token,
		User:  dto.ToUserResponse(user),
	}, nil
}

// GenerateJWTToken membuat string token JWT berjangka waktu 24 jam dengan claim userID dan role.
func GenerateJWTToken(userID uint, role string) (string, error) {
	jwtSecret := []byte(config.GetENV("JWT_SECRET", "wayrung_super_secret_key_2026"))

	claims := jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}
