"""Prueba integral sobre una base descartable. Iniciar la API en :3001 con multicatalogo_smoke."""
import json
import time
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:3001"


def request(method, path, body=None, token=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    raw = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=raw, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            data = response.read()
    except urllib.error.HTTPError as exc:
        status = exc.code
        data = exc.read()
    assert status == expected, (method, path, status, expected, data)
    return json.loads(data) if data else None


def auth(email):
    return request("POST", "/api/login", {"email": email, "password": "123456"})["token"]


admin = auth("admin@upse.edu.ec")
other = auth("cliente@upse.edu.ec")
assert len(request("GET", "/api/productos")) == 8
assert request("GET", "/api/usuarios", token=other, expected=403)["status"] == 403

email = f"prueba.u2.{int(time.time())}@example.test"
new_user = request("POST", "/api/register", {"nombre": "Prueba U2", "email": email, "password": "clave_segura_123", "ref": "MC1"}, expected=201)
assert new_user["rol"] == "cliente" and new_user["codigoRef"].startswith("MC")
request("POST", "/api/register", {"nombre": "Duplicado", "email": email, "password": "clave_segura_123"}, expected=409)
request("POST", "/api/register", {"nombre": "Inválido", "email": "otro@example.test", "password": "clave_segura_123", "ref": "NOEXISTE"}, expected=400)
user = request("POST", "/api/login", {"email": email, "password": "clave_segura_123"})["token"]
assert request("GET", "/api/referido/codigo", token=user)["codigo"] == new_user["codigoRef"]
assert request("GET", "/api/red/mia", token=user).get("hijos") is None
assert any(x["id"] == new_user["id"] for x in request("GET", "/api/red/mia", token=admin)["hijos"])

product = {"nombre": "Producto prueba U2", "descripcion": "Verificación", "precio": 12.50, "categoria": "Prueba", "img": "https://example.test/producto.png", "galeria": [], "stock": 3}
request("POST", "/api/productos", product, token=user, expected=403)
created = request("POST", "/api/productos", product, token=admin, expected=201)
pid = created["id"]
assert any(p["id"] == pid for p in request("GET", "/api/productos"))
assert request("GET", "/api/admin/productos?q=Producto%20prueba", token=admin)["total"] == 1
request("DELETE", f"/api/productos/{pid}", token=admin, expected=204)
assert all(p["id"] != pid for p in request("GET", "/api/productos"))
request("PATCH", f"/api/productos/{pid}/activar", token=admin, expected=204)

checkout = {"cliente": {"nombre": "Prueba U2", "email": email, "direccion": "Calle 1", "ciudad": "Santa Elena", "telefono": "0991234567"}, "metodoPago": "Transferencia bancaria", "items": [{"id": pid, "cantidad": 1}]}
request("POST", "/api/checkout", checkout, token=user, expected=201)
mine = request("GET", "/api/pedidos/mios", token=user)
assert mine["total"] == 1
order_id = mine["data"][0]["id"]
request("GET", f"/api/pedidos/{order_id}", token=other, expected=403)
assert request("GET", f"/api/pedidos/{order_id}", token=user)["items"][0]["nombre"] == product["nombre"]
assert request("GET", "/api/pedidos", token=admin)["total"] == 1
request("PATCH", f"/api/pedidos/{order_id}/estado", {"estado": "cancelado"}, token=admin, expected=204)
assert request("GET", "/api/admin/productos?q=Producto%20prueba", token=admin)["data"][0]["stock"] == 3
assert request("GET", "/api/comisiones/mias", token=admin)[0]["estado"] == "revertida"
request("PATCH", f"/api/pedidos/{order_id}/estado", {"estado": "enviado"}, token=admin, expected=400)

request("POST", "/api/checkout", checkout, token=user, expected=201)
second = request("GET", "/api/pedidos/mios", token=user)["data"][0]["id"]
for state in ["preparando", "enviado", "entregado"]:
    request("PATCH", f"/api/pedidos/{second}/estado", {"estado": state}, token=admin, expected=204)
for _ in range(30):
    debts = request("GET", "/api/liquidaciones/pendientes", token=admin)
    if any(d["beneficiarioId"] == 1 for d in debts):
        break
    time.sleep(0.2)
else:
    raise AssertionError("El trabajador no acreditó la comisión")
payment = request("POST", "/api/liquidaciones", {"beneficiarioId": 1}, token=admin, expected=201)
assert payment["total"] == 1.25
request("POST", "/api/liquidaciones", {"beneficiarioId": 1}, token=admin, expected=400)
assert request("GET", "/api/liquidaciones/mias", token=admin)[0]["id"] == payment["id"]
report = request("GET", "/api/reportes/resumen", token=admin)
assert report["pedidos"] == 1 and report["ventas"] == 12.5
assert request("GET", "/api/reportes/top-productos", token=admin)

request("PATCH", f"/api/usuarios/{new_user['id']}", {"rol": "cliente", "activo": False}, token=admin, expected=204)
request("POST", "/api/login", {"email": email, "password": "clave_segura_123"}, expected=403)
request("GET", "/api/red/mia", token=user, expected=401)
print("OK: registro, roles, catálogo, pedidos, cancelación, comisiones, liquidación y reportes")
