package session

import (
	"testing"
	"time"

	"multicatalogo-backend/models"
)

func TestTokenRejectsTamperingAndExpiry(t *testing.T) {
	tokens := Tokens{Secret: []byte("clave_de_prueba_larga_y_no_publica_123456")}
	issued, err := tokens.Issue(models.Usuario{ID: 7, Email: "cliente@upse.edu.ec", Rol: "cliente"})
	if err != nil {
		t.Fatal(err)
	}
	claims, err := tokens.Verify(issued)
	if err != nil || claims.ID != 7 {
		t.Fatalf("token válido rechazado: %+v, %v", claims, err)
	}
	if _, err := (Tokens{Secret: []byte("otra_clave_de_prueba_larga_y_segura_123")}).Verify(issued); err == nil {
		t.Fatal("se aceptó una firma de otra clave")
	}
	changed := "A"
	if issued[0] == 'A' {
		changed = "B"
	}
	if _, err := tokens.Verify(changed + issued[1:]); err == nil {
		t.Fatal("se aceptó un token manipulado")
	}
	if _, err := tokens.Verify("incorrecto"); err == nil {
		t.Fatal("se aceptó un token inválido")
	}
	if time.Now().Unix() >= claims.Expires {
		t.Fatal("el token recién emitido ya venció")
	}
}
