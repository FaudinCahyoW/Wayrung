package routes

import (
	"net/http"
	"strings"
	"wayrung/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTMiddleware merupakan middleware untuk melakukan validasi token JWT pada header Authorization.
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Header otorisasi tidak ditemukan"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format token otorisasi tidak valid (gunakan Bearer <token>)"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		jwtSecret := []byte(config.GetENV("JWT_SECRET", "wayrung_super_secret_key_2026"))

		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau telah kadaluwarsa"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Klaim token tidak valid"})
			c.Abort()
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "ID pengguna tidak ditemukan di dalam token"})
			c.Abort()
			return
		}

		roleStr, _ := claims["role"].(string)

		// Simpan user_id dan role ke konteks permintaan Gin
		c.Set("user_id", uint(userIDFloat))
		c.Set("role", roleStr)

		c.Next()
	}
}

// RequireRoles merupakan middleware otorisasi berbasis peran (Role-Based Access Control / RBAC).
// Memastikan hanya pengguna dengan peran tertentu (misal: "owner" atau "kasir") yang diizinkan mengakses endpoint.
func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Informasi peran pengguna tidak ditemukan"})
			c.Abort()
			return
		}

		userRole := userRoleVal.(string)
		isAllowed := false

		for _, role := range allowedRoles {
			if strings.EqualFold(userRole, role) {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak memiliki hak akses untuk fitur ini"})
			c.Abort()
			return
		}

		c.Next()
	}
}
