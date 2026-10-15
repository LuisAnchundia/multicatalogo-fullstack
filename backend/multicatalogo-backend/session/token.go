package session

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"multicatalogo-backend/models"
)

type Claims struct {
	ID      int64  `json:"id"`
	Email   string `json:"email"`
	Rol     string `json:"rol"`
	Expires int64  `json:"exp"`
}

type Tokens struct{ Secret []byte }

func (t Tokens) Issue(user models.Usuario) (string, error) {
	c := Claims{ID: user.ID, Email: user.Email, Rol: user.Rol, Expires: time.Now().Add(8 * time.Hour).Unix()}
	data, err := json.Marshal(c)
	if err != nil {
		return "", err
	}
	part := base64.RawURLEncoding.EncodeToString(data)
	mac := hmac.New(sha256.New, t.Secret)
	mac.Write([]byte(part))
	return part + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}

func (t Tokens) Verify(token string) (Claims, error) {
	var c Claims
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return c, errors.New("token inválido")
	}
	sig, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return c, errors.New("token inválido")
	}
	mac := hmac.New(sha256.New, t.Secret)
	mac.Write([]byte(parts[0]))
	if !hmac.Equal(sig, mac.Sum(nil)) {
		return c, errors.New("firma inválida")
	}
	data, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return c, errors.New("token inválido")
	}
	if err = json.Unmarshal(data, &c); err != nil {
		return c, errors.New("token inválido")
	}
	if c.ID < 1 || c.Email == "" || c.Expires <= time.Now().Unix() {
		return c, errors.New("token vencido")
	}
	return c, nil
}
