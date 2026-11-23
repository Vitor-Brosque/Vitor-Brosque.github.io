import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('a home é legível sem JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.locator('.revelar').count()).toBeGreaterThan(0);
  const escondidos = await page.$$eval('.revelar', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  expect(escondidos).toBe(0);
});

test('o estudo de caso é legível sem JavaScript', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('h1')).toBeVisible();
  const textos = page.locator('.rota-detalhe-texto');
  expect(await textos.count()).toBe(5);
  for (let i = 0; i < 5; i++) await expect(textos.nth(i)).toBeVisible();
  await expect(page.locator('#problema')).toBeVisible();
  await expect(page.locator('#problema + .texto p').first()).toBeVisible();
});
