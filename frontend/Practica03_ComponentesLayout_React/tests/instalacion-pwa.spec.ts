import { expect, test } from '@playwright/test';

test('explica qué hacer cuando el navegador no ofrece instalar otra vez', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: '¿Cómo instalar?' }).click();
  const ayuda = page.getByRole('dialog', { name: 'Cómo instalar MultiCatálogo' });
  await expect(ayuda).toBeVisible();
  await expect(ayuda).toContainText('brave://apps');
  await expect(ayuda).toContainText('Mientras siga instalada');

  await ayuda.getByRole('button', { name: 'Cerrar' }).click();
  await expect(ayuda).toBeHidden();
});

test('usa el aviso de instalación una sola vez', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.defineProperties(event, {
      prompt: { value: async () => { (window as Window & { installAttempts: number }).installAttempts++; } },
      userChoice: { value: Promise.resolve({ outcome: 'dismissed' }) },
    });
    (window as Window & { installAttempts: number }).installAttempts = 0;
    window.dispatchEvent(event);
  });

  await page.getByRole('button', { name: 'Instalar app' }).click();
  await expect(page.getByRole('button', { name: '¿Cómo instalar?' })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { installAttempts: number }).installAttempts)).toBe(1);
});
