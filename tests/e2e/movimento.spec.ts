import { expect, test } from '@playwright/test';

test.describe('com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('com movimento reduzido a rota fica estática e nenhum vídeo toca', async ({ page }) => {
    await page.goto('/projetos/rodoviariaos/');
    const rota = page.locator('[data-rota][data-modo="rolagem"]');
    await expect(rota).toHaveAttribute('data-estatico', '');
    await rota.locator('.rota-detalhe-texto').first().scrollIntoViewIfNeeded();
    await expect(rota.locator('.rota-detalhe-texto').first()).toBeVisible();
    const videos = page.locator('video[data-video]');
    expect(await videos.count()).toBeGreaterThan(0);
    await videos.first().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 4000);
    // pausa curta: a decisão de tocar vem de um callback do IntersectionObserver; ler antes não provaria nada
    await page.waitForTimeout(800);
    const tocando = await page.$$eval('video', (vs) => vs.filter((v) => !(v as HTMLVideoElement).paused).length);
    expect(tocando).toBe(0);
  });

  test('com movimento reduzido nada fica escondido pela revelação', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('.revelar').count()).toBeGreaterThan(0);
    const escondidos = await page.$$eval('.revelar', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length);
    expect(escondidos).toBe(0);
  });
});

test.describe('com movimento permitido', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a rota em loop da home anda quando o movimento é permitido', async ({ page }) => {
    await page.goto('/');
    const rota = page.locator('[data-rota][data-modo="loop"]').first();
    await rota.scrollIntoViewIfNeeded();
    await expect(rota).not.toHaveAttribute('data-estatico');
    const pos = () => rota.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));
    const inicial = await pos();
    await expect.poll(pos, { timeout: 8000 }).not.toBe(inicial);
  });
});
