import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('a home é legível sem JavaScript', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.locator('.revelar').count()).toBeGreaterThan(0);
  const escondidos = await page.$$eval('.revelar', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  expect(escondidos).toBe(0);
  // A vitrine da rota mostra as seis paradas, uma embaixo da outra.
  const textos = page.locator('#projetos .vitrine .rota-detalhe-texto');
  expect(await textos.count()).toBe(6);
  for (let i = 0; i < 6; i++) await expect(textos.nth(i)).toBeVisible();
  // A dica de clicar numa parada só faz sentido com script.
  await expect(page.locator('#projetos .rota-dica')).toBeHidden();
});

test('o estudo de caso é legível sem JavaScript', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('h1')).toBeVisible();
  const textos = page.locator('.rota-detalhe-texto');
  expect(await textos.count()).toBe(6);
  for (let i = 0; i < 6; i++) await expect(textos.nth(i)).toBeVisible();
  await expect(page.locator('#problema')).toBeVisible();
  await expect(page.locator('#problema + .texto p').first()).toBeVisible();
});

test('o bloco Em resumo e as decisões aparecem sem JavaScript', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('#em-resumo')).toBeVisible();
  await expect(page.locator('.em-resumo .numeros dt').first()).toBeVisible();
  const resumos = page.locator('details.decisao > summary');
  expect(await resumos.count()).toBe(6);
  for (let i = 0; i < 6; i++) await expect(resumos.nth(i)).toBeVisible();
  // O texto completo fica no HTML e abre com o clique nativo do <details>.
  await resumos.first().click();
  await expect(page.locator('details.decisao').first().getByText(/O filtro só na aplicação/)).toBeVisible();
});
