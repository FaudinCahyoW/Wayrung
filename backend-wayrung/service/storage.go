package service

import (
	"errors"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// StorageProvider mendefinisikan interface pengunggahan file.
type StorageProvider interface {
	// UploadFile mengunggah file yang dikirimkan melalui HTTP multipart form.
	UploadFile(file *multipart.FileHeader, c *gin.Context) (string, error)
}

// localStorageProvider merupakan implementasi penyimpan file ke direktori lokal.
type localStorageProvider struct {
	UploadDir string
	BaseURL   string
}

// NewLocalStorageProvider membuat instance baru dari StorageProvider penyimpanan lokal.
func NewLocalStorageProvider(uploadDir, baseURL string) StorageProvider {
	_ = os.MkdirAll(uploadDir, os.ModePerm)
	return &localStorageProvider{UploadDir: uploadDir, BaseURL: baseURL}
}

// UploadFile menyimpan file yang diunggah ke folder lokal setelah memvalidasi ekstensi dan ukurannya.
func (s *localStorageProvider) UploadFile(file *multipart.FileHeader, c *gin.Context) (string, error) {
	if file == nil {
		return "", errors.New("file tidak boleh kosong")
	}

	// 1. Validasi batas ukuran file (maksimal 2 MB)
	var maxFileSize int64 = 2 * 1024 * 1024
	if file.Size > maxFileSize {
		return "", errors.New("ukuran file melebihi batas maksimum 2MB")
	}

	// 2. Validasi ekstensi file (hanya boleh jpg, jpeg, png, pdf)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".pdf" {
		return "", errors.New("format file tidak didukung, gunakan jpg, jpeg, png, atau pdf")
	}

	// 3. Buat nama file unik berdasarkan timestamp
	fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(s.UploadDir, fileName)

	// 4. Simpan file ke disk lokal
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", fmt.Errorf("gagal menyimpan file unggahan: %w", err)
	}

	// 5. Bentuk URL akses file
	finalURL := fmt.Sprintf("%s/uploads/%s", s.BaseURL, fileName)
	return finalURL, nil
}
