import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('com movimento reduzido a rota fica estática e nenhum vídeo toca', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  const rota = page.locator('[data-rota][data-modo="rolagem"]');
  await expect(rota).toHaveAttribute('data-estatico', '');
  await rota.locator('.rota-detalhe-texto').first().scrollIntoViewIfNeeded();
  await expect(rota.locator('.rota-detalhe-texto').first()).toBeVisible();
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(800);
  const tocando = await page.$$eval('video', (vs) => vs.filter((v) => !(v as HTMLVideoElement).paused).length);
  expect(tocando).toBe(0);
});

test('com movimento reduzido nada fica escondido pela revelação', async ({ page }) => {
  await page.goto('/');
  const escondidos = await page.$$eval('.revelar', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
  expect(escondidos).toBe(0);
});
