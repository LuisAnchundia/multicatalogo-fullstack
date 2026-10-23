import { expect, test } from '@playwright/test';

const CACHE_KEY = 'multicatalogo_catalogo_publico_v1';
const productos = [
  { id: 1, nombre: 'Serum Revitalizante', descripcion: 'Cuidado facial.', precio: 45, categoria: 'Serum', img: 'https://picsum.photos/seed/serum/600', galeria: [] },
  { id: 2, nombre: 'Crema Hidratante Pro', descripcion: 'Hidratación diaria.', precio: 32.5, categoria: 'Crema', img: 'https://picsum.photos/seed/crema/600', galeria: [] },
];

test('el catálogo guardado se puede abrir sin internet y vence tras 24 horas', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(items => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const path = new URL(input instanceof Request ? input.url : String(input), location.origin).pathname;
      if (path === '/api/login') return Promise.resolve(new Response(JSON.stringify({ email: 'cliente@upse.edu.ec', rol: 'cliente', token: 'token-de-prueba' }), { headers: { 'Content-Type': 'application/json' } }));
      if (path === '/api/productos') return Promise.resolve(new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } }));
      return originalFetch(input, init);
    };
  }, productos);

  const online = await context.newPage();
  await online.goto('/login');
  await online.getByLabel('Correo Electrónico', { exact: true }).fill('cliente@upse.edu.ec');
  await online.getByLabel('Contraseña', { exact: true }).fill('123456');
  await online.getByRole('button', { name: 'Iniciar Sesión' }).click();
  await expect(online).toHaveURL('/tienda');
  await expect(online.locator('.mc-product-card')).toHaveCount(2);
  await online.evaluate(() => navigator.serviceWorker.ready);
  await online.waitForFunction(() => navigator.serviceWorker.controller !== null && localStorage.getItem('multicatalogo_catalogo_publico_v1') !== null);

  await context.setOffline(true);
  await online.goto('/catalogo');
  await expect(online.locator('.mc-product-card')).toHaveCount(2);
  await expect(online.getByText(/Puedes consultarlo sin internet durante 24 horas/)).toBeVisible();
  await expect(online.getByRole('button', { name: /Añadir/ })).toHaveCount(0);

  const guardadoAntes = await online.evaluate(key => JSON.parse(localStorage.getItem(key)!).guardadoEn as number, CACHE_KEY);
  await context.setOffline(false);
  await expect.poll(() => online.evaluate(key => JSON.parse(localStorage.getItem(key)!).guardadoEn as number, CACHE_KEY)).toBeGreaterThan(guardadoAntes);
  await context.setOffline(true);

  await online.close();
  const reopened = await context.newPage();
  await reopened.goto('/login');
  await reopened.getByRole('link', { name: 'ver el catálogo guardado' }).click();
  await expect(reopened).toHaveURL('/catalogo-guardado');
  await expect(reopened.locator('.mc-product-card')).toHaveCount(2);
  await expect(reopened.getByRole('link', { name: 'Ver carrito' })).toHaveCount(0);
  await expect(reopened.getByRole('navigation').getByRole('link')).toHaveCount(1);
  const image = reopened.getByRole('img', { name: 'Serum Revitalizante' });
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  await reopened.evaluate(key => {
    const saved = JSON.parse(localStorage.getItem(key)!);
    saved.guardadoEn = Date.now() - 24 * 60 * 60 * 1000 - 1;
    localStorage.setItem(key, JSON.stringify(saved));
  }, CACHE_KEY);
  await reopened.reload();
  await expect(reopened.getByRole('alert')).toContainText('No hay un catálogo guardado');
  await expect(reopened.locator('.mc-product-card')).toHaveCount(0);
  await context.close();
});
