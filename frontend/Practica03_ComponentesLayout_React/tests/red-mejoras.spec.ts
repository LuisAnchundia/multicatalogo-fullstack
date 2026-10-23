import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('red desplegable, filtros y exportación de comisiones', async ({ page }) => {
  await page.route('**/api/red/mia', route => route.fulfill({
    json: { id: 1, nombre: 'Luis', nivel: 0, ventas: 0, saldo: 12.5, hijos: [
      { id: 2, nombre: 'Ana García', nivel: 1, ventas: 100, hijos: [
        { id: 3, nombre: 'Diana Paz', nivel: 2, ventas: 75 },
      ] },
      { id: 4, nombre: 'Marco Díaz', nivel: 1, ventas: 40 },
    ] },
  }));
  await page.route('**/api/comisiones/mias', route => route.fulfill({
    json: [{ pedidoId: 8, numero: 'MC-8', nivel: 1, monto: 12.5, estado: 'pendiente', fecha: new Date().toISOString() }],
  }));
  await page.goto('/login');
  await page.getByLabel('Correo Electrónico', { exact: true }).fill('admin@upse.edu.ec');
  await page.getByLabel('Contraseña', { exact: true }).fill('12345678');
  await page.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await page.goto('/mi-red');
  await expect(page.getByRole('heading', { name: 'Mi Red de Referidos' })).toBeVisible();
  await expect(page.getByText('Diana Paz')).toHaveCount(0);
  const abrir = page.getByRole('button', { name: 'Mostrar referidos de Ana García' });
  await abrir.click();
  await expect(page.getByText('Diana Paz')).toBeVisible();
  await page.getByRole('button', { name: 'Ocultar referidos de Ana García' }).click();
  await expect(page.getByText('Diana Paz')).toHaveCount(0);

  await page.getByLabel('Buscar por nombre').fill('garcia');
  await expect(page.getByText('1 coincidencia', { exact: true })).toBeVisible();
  await expect(page.getByText('Ana García')).toBeVisible();
  await expect(page.getByText('Marco Díaz')).toHaveCount(0);
  await page.getByLabel('Buscar por nombre').fill('');
  await page.getByRole('combobox', { name: 'Nivel' }).selectOption('2');
  await expect(page.getByText('Diana Paz')).toBeVisible();
  await expect(page.getByText('Marco Díaz')).toHaveCount(0);
  await page.getByLabel('Ventas mínimas (USD)').fill('80');
  await expect(page.getByText('No hay referidos que coincidan con los filtros.')).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(page.getByText('Marco Díaz')).toBeVisible();

  await expect(page.getByRole('list', { name: 'Comisiones de los últimos seis meses' })).toBeVisible();
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar CSV' }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toBe('mis-comisiones.csv');
  const ruta = await archivo.path();
  expect(ruta).not.toBeNull();
  expect(await readFile(ruta!, 'utf8')).toContain('"MC-8";"');
});
