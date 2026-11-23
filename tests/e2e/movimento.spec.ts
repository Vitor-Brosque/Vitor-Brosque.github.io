import { expect, test, type Page } from '@playwright/test';

async function rolarAteOFim(page: Page, passo = 500, aCada?: () => Promise<void>) {
  for (;;) {
    const fim = await page.evaluate((d) => {
      window.scrollBy(0, d);
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    }, passo);
    await page.waitForTimeout(120);
    if (aCada) await aCada();
    if (fim) break;
  }
}

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
    // pausa curta: a decisão de tocar vem de um callback do IntersectionObserver; ler antes não provaria nada
    await page.waitForTimeout(800);
    const tocando = await page.$$eval('video', (vs) => vs.filter((v) => !(v as HTMLVideoElement).paused).length);
    expect(tocando).toBe(0);
  });

  test('o conteúdo entra com fade ao rolar e nada fica escondido', async ({ page }) => {
    await page.goto('/');
    const alvo = page.locator('#ferr-titulo');
    const estilo = () => alvo.evaluate((el) => ({ opacity: getComputedStyle(el).opacity, translate: getComputedStyle(el).translate }));
    expect(await estilo()).toEqual({ opacity: '0', translate: 'none' });
    await alvo.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await estilo()).opacity).toBe('1');
    await rolarAteOFim(page);
    await expect
      .poll(() => page.$$eval('.revelar', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length))
      .toBe(0);
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
