import { test, expect, type Page } from '@playwright/test';
import { contarRed, sumarVentasRed, sumarComisiones, nivelAlcanzado, redInicial } from '../src/data/red';

async function login(page: Page, rol: 'admin' | 'cliente') {
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico', { exact: true }).fill(`${rol}@upse.edu.ec`);
  await page.getByLabel('Contraseña', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(page).toHaveURL(rol === 'admin' ? '/' : '/tienda');
}
async function logout(page: Page) {
  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
  await expect(page).toHaveURL('/login');
}
async function agregar(page: Page, id: number) {
  await page.goto(`/producto/${id}`);
  await page.getByRole('button', { name: 'Añadir al Carrito', exact: true }).click();
}
async function envio(page: Page) {
  await page.getByLabel('Nombre completo').fill('Luis Prueba');
  await page.getByLabel('Dirección').fill('Av. Universidad 123');
  await page.getByLabel('Ciudad').fill('La Libertad');
  await page.getByLabel('Teléfono').fill('0991234567');
}
test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => { throw error; });
});

test('API: dos roles, credenciales incorrectas, JSON inválido y catálogo base', async ({ request }) => {
  for (const rol of ['admin', 'cliente']) {
    const res = await request.post('http://localhost:3000/api/login', { data: { email: `${rol}@upse.edu.ec`, password: '123456' } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ email: `${rol}@upse.edu.ec`, rol });
  }
  expect((await request.post('http://localhost:3000/api/login', { data: { email: 'admin@upse.edu.ec', password: 'incorrecta' } })).status()).toBe(401);
  expect((await request.post('http://localhost:3000/api/login', { data: '{', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
  expect(await (await request.get('http://localhost:3000/api/productos')).json()).toHaveLength(4);
});

test('red: cálculos recursivos, límites de nivel y KPIs compartidos', async ({ page }) => {
  expect(contarRed(redInicial)).toBe(7);
  expect(sumarVentasRed(redInicial)).toBe(4090);
  expect(sumarComisiones(redInicial)).toBeCloseTo(319.5);
  expect([0, 1, 2, 3, 4, 5, 6].map(nivelAlcanzado)).toEqual(['Bronce', 'Bronce', 'Plata', 'Plata', 'Oro', 'Oro', 'Diamante']);
  const vacia = { id: 0, nombre: 'Tú', nivel: 0, ventas: 999 };
  expect(contarRed(vacia)).toBe(0);
  expect(sumarVentasRed(vacia)).toBe(0);
  expect(sumarComisiones(vacia)).toBe(0);
  await login(page, 'admin');
  await expect(page.getByRole('heading', { name: 'Resumen General' })).toBeVisible();
  await expect(page.getByText('$319.50', { exact: true })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(4);
  await page.getByRole('link', { name: 'Mi Red', exact: true }).click();
  await expect(page.getByText('Diana Paz')).toBeVisible();
  await expect(page.getByText('Nivel 3 · 2 % comisión')).toBeVisible();
  await expect(page.getByText('$319.50', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Tienda', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Conocer el Plan Multinivel' })).toBeVisible();
});

test('guardas, storefront, filtros y navegación atrás', async ({ page }) => {
  await page.goto('/mi-red');
  await expect(page).toHaveURL('/login');
  await login(page, 'cliente');
  await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Conocer el Plan Multinivel' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Explorar el Catálogo' })).toBeVisible();
  await expect(page.locator('main section').nth(1).getByRole('link')).toHaveCount(5);
  await expect(page.locator('main section').nth(2).getByRole('link')).toHaveCount(4);
  expect(await page.locator('main section').first().evaluate(el => el.getBoundingClientRect().height >= window.innerHeight)).toBe(true);
  for (const path of ['/', '/mi-red']) {
    await page.goto(path);
    await expect(page).toHaveURL('/tienda');
  }
  await page.getByRole('link', { name: 'Serum', exact: true }).click();
  await expect(page).toHaveURL(/categoria=Serum/);
  await expect(page.getByText('2 producto(s) encontrado(s)')).toBeVisible();
  await page.getByLabel('Categoría', { exact: true }).selectOption('Kit');
  await expect(page.getByText('1 producto(s) encontrado(s)')).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel('Categoría', { exact: true })).toHaveValue('Serum');
  await expect(page.getByText('2 producto(s) encontrado(s)')).toBeVisible();
  await page.getByLabel('Buscar productos').fill('inexistente');
  await expect(page.getByText('No hay productos que coincidan con tu búsqueda.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByText('8 producto(s) encontrado(s)')).toBeVisible();
  await page.getByLabel('Buscar productos').fill('serum');
  await expect(page.getByText('3 producto(s) encontrado(s)')).toBeVisible();
});

test('galería accesible: teclado, foco, navegación y producto inexistente', async ({ page }) => {
  await login(page, 'cliente');
  await page.goto('/producto/1');
  await page.getByRole('button', { name: 'Ver imagen 3' }).click();
  const abrir = page.getByRole('button', { name: 'Ampliar imagen del producto' });
  await abrir.focus();
  await page.keyboard.press('Enter');
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('3 / 4')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(modal.getByText('4 / 4')).toBeVisible();
  await modal.getByRole('button', { name: 'Imagen siguiente' }).click();
  await expect(modal.getByText('1 / 4')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(abrir).toBeFocused();
  await page.goto('/producto/999');
  await expect(page.getByRole('heading', { name: 'Producto no encontrado.' })).toBeVisible();
});

test('carrito: cantidades, recarga y aislamiento al cambiar de cuenta', async ({ page }) => {
  await login(page, 'admin');
  await agregar(page, 1);
  await page.getByRole('link', { name: 'Ver carrito' }).click();
  await page.getByRole('button', { name: 'Aumentar cantidad' }).click();
  await page.reload();
  await expect(page.getByText('$90.00', { exact: true })).toHaveCount(3);
  await logout(page);
  await login(page, 'cliente');
  await page.getByRole('link', { name: 'Ver carrito' }).click();
  await expect(page.getByText('Tu carrito está vacío actualmente.')).toBeVisible();
  await agregar(page, 2);
  await logout(page);
  await login(page, 'admin');
  await page.getByRole('link', { name: 'Ver carrito' }).click();
  await expect(page.getByRole('heading', { name: 'Serum Revitalizante' })).toBeVisible();
  await expect(page.getByText('Crema Hidratante Pro')).toHaveCount(0);
  await page.getByRole('button', { name: 'Disminuir cantidad' }).click();
  await page.getByRole('button', { name: 'Disminuir cantidad' }).click();
  await expect(page.getByText('Tu carrito está vacío actualmente.')).toBeVisible();
});

test('checkout: validación, confirmación, carrito vacío y privacidad del pedido', async ({ page }) => {
  await login(page, 'cliente');
  await page.goto('/confirmacion');
  await expect(page.getByText('No hay un pedido para mostrar')).toBeVisible();
  await page.goto('/checkout');
  await expect(page.getByText('No tienes productos en el carrito.')).toBeVisible();
  await agregar(page, 1);
  await page.goto('/checkout');
  await envio(page);
  await page.getByLabel('Nombre completo').fill('   ');
  await page.getByRole('button', { name: 'Confirmar Pedido' }).click();
  await expect(page.getByRole('alert')).toContainText('solo espacios');
  await page.getByLabel('Nombre completo').fill('Luis Prueba');
  await page.getByLabel('Transferencia bancaria', { exact: true }).check();
  await page.getByRole('button', { name: 'Confirmar Pedido' }).click();
  await expect(page.getByRole('button', { name: 'Procesando pago...' })).toBeDisabled();
  await expect(page).toHaveURL('/confirmacion');
  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible();
  await expect(page.getByText(/MC-[0-9A-F]{8}/)).toBeVisible();
  await expect(page.getByText('Método de pago: Transferencia bancaria')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '¡Pedido confirmado!' })).toBeVisible();
  const pedidoAnterior = await page.evaluate(() => history.state);
  await page.getByRole('link', { name: 'Ver carrito' }).click();
  await expect(page.getByText('Tu carrito está vacío actualmente.')).toBeVisible();
  await logout(page);
  await login(page, 'admin');
  await page.evaluate(state => { history.pushState(state, '', '/confirmacion'); }, pedidoAnterior);
  await page.reload();
  await expect(page.getByText('No hay un pedido para mostrar')).toBeVisible();
});

test('abandonar un pago pendiente no vacía el carrito ni redirige', async ({ page }) => {
  await login(page, 'cliente');
  await agregar(page, 1);
  await page.goto('/checkout');
  await envio(page);
  await page.getByRole('button', { name: 'Confirmar Pedido' }).click();
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await page.waitForTimeout(1400); // Supera deliberadamente el temporizador del pago simulado.
  await expect(page).toHaveURL('/catalogo');
  await page.getByRole('link', { name: 'Ver carrito' }).click();
  await expect(page.getByRole('heading', { name: 'Serum Revitalizante' })).toBeVisible();
});

test('datos de carrito dañados no rompen la aplicación', async ({ page }) => {
  await login(page, 'cliente');
  for (const saved of ['{', '{}', '[null, {"id": 1, "cantidad": -3}, {"id": 999, "cantidad": 2}]']) {
    await page.evaluate(value => localStorage.setItem('multicatalogo_carrito_cliente@upse.edu.ec', value), saved);
    await page.goto('/carrito');
    await expect(page.getByText('Tu carrito está vacío actualmente.')).toBeVisible();
  }
});

test('móvil: menú y compra sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'cliente');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Catálogo de Productos' })).toBeVisible();
  await agregar(page, 8);
  for (const path of ['/tienda', '/catalogo', '/producto/8', '/carrito', '/checkout']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
});
