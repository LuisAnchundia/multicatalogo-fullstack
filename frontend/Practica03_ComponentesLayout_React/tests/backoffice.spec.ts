import { test, expect, type Page } from '@playwright/test';
const API = process.env.API_URL ?? 'http://localhost:3000';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

test('registro referido y red personal', async ({ page, request }) => {
  const email = `ui.u2.${Date.now()}@example.test`;
  await page.goto('/registro?ref=MC1');
  await expect(page.getByLabel('Código de referido (opcional)')).toHaveValue('MC1');
  await page.getByLabel('Nombre', { exact: true }).fill('Cliente UI');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña (mínimo 8 caracteres)').fill('clave_segura_123');
  const registro = page.waitForResponse(response => response.url().endsWith('/api/register') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Registrarme' }).click();
  const { id: usuarioId } = await (await registro).json() as { id: number };
  try {
    await expect(page.getByText('Cuenta creada.')).toBeVisible();
    await login(page, email, 'clave_segura_123');
    await expect(page).toHaveURL('/tienda');
    await page.getByRole('navigation').getByRole('link', { name: 'Mi Red' }).click();
    await expect(page.getByRole('heading', { name: 'Mi Red de Referidos' })).toBeVisible();
    await expect(page.getByLabel('Enlace de referido')).toHaveValue(/\/registro\?ref=MC\d+/);
    await expect(page.getByText('Aún no tienes referidos.')).toBeVisible();
  } finally {
    const admin = await request.post(`${API}/api/login`, { data: { email: 'admin@upse.edu.ec', password: '123456' } });
    const { token } = await admin.json() as { token: string };
    const limpieza = await request.patch(`${API}/api/usuarios/${usuarioId}`, { headers: { Authorization: `Bearer ${token}` }, data: { rol: 'cliente', activo: false } });
    expect(limpieza.status()).toBe(204);
  }
});

test('administración de productos y acceso a las pantallas del back-office', async ({ page, request }) => {
  await login(page, 'admin@upse.edu.ec', '123456');
  await expect(page.getByRole('heading', { name: 'Resumen del negocio' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Productos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Productos' })).toBeVisible();
  const nombre = `Producto UI ${Date.now()}`;
  await page.getByLabel('Nombre', { exact: true }).fill(nombre);
  await page.getByLabel('Categoría').fill('Prueba');
  await page.getByLabel('Precio').fill('14.75');
  await page.getByLabel('Stock').fill('2');
  await page.getByLabel('URL de imagen').fill('https://example.test/ui.png');
  const creacion = page.waitForResponse(response => response.url().endsWith('/api/productos') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Guardar' }).click();
  const { id: productoId } = await (await creacion).json() as { id: number };
  try {
    await page.getByLabel('Buscar').fill(nombre);
    await expect(page.getByText(nombre)).toBeVisible();
    for (const [link, heading] of [['Usuarios', 'Usuarios'], ['Pedidos', 'Gestión de pedidos'], ['Liquidaciones', 'Liquidaciones']] as const) {
      await page.getByRole('navigation').getByRole('link', { name: link, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  } finally {
    const admin = await request.post(`${API}/api/login`, { data: { email: 'admin@upse.edu.ec', password: '123456' } });
    const { token } = await admin.json() as { token: string };
    const limpieza = await request.delete(`${API}/api/productos/${productoId}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(limpieza.status()).toBe(204);
  }
});
