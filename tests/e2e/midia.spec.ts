import { expect, test, type Locator, type Page } from '@playwright/test';

/** Põe o vídeo em tela cheia com um gesto de usuário e mede como ele é encaixado. */
async function telaCheia(page: Page, video: Locator) {
  await video.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.mouse.click(2, 200); // gesto do usuário: sem ele o navegador recusa a tela cheia
  return video.evaluate(async (el: HTMLVideoElement) => {
    await el.requestFullscreen();
    await new Promise((ok) => setTimeout(ok, 300));
    if (el.readyState < 1) {
      await new Promise((ok) => {
        el.addEventListener('loadedmetadata', ok, { once: true });
        el.load();
        setTimeout(ok, 5000);
      });
    }
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const caixa = b.width / b.height;
    const proporcao = el.videoWidth / el.videoHeight;
    // Com "cover", só uma parte do vídeo fica à vista; com "contain", ele cabe inteiro.
    const visivel = cs.objectFit === 'cover' ? Math.min(caixa / proporcao, proporcao / caixa) : 1;
    const r = { telaCheia: document.fullscreenElement === el, objectFit: cs.objectFit, visivel: Math.round(visivel * 100) };
    await document.exitFullscreen();
    return r;
  });
}

test.describe('vídeo em tela cheia', () => {
  test.use({ reducedMotion: 'reduce' });
  for (const nome of ['do-whatsapp-a-fila.mp4', 'whatsapp-negociacao-celular.mp4']) {
    test(`${nome} aparece inteiro em tela cheia`, async ({ page }) => {
      await page.goto('/projetos/rodoviariaos/');
      const video = page.locator(`video[data-video]:has(source[src$="${nome}"])`).first();
      const r = await telaCheia(page, video);
      expect(r.telaCheia).toBe(true);
      expect(r.objectFit).toBe('contain');
      expect(r.visivel).toBe(100);
    });
  }
});

test.describe('botão de tela cheia', () => {
  test('aparece junto do vídeo, tem nome e abre o vídeo em tela cheia', async ({ page }) => {
    await page.goto('/projetos/rodoviariaos/');
    const figura = page.locator('.moldura:has(video[data-video])').first();
    const botao = figura.locator('[data-video-tela-cheia]');
    await figura.scrollIntoViewIfNeeded();
    await expect(botao).toBeVisible();
    await expect(botao).toHaveAttribute('aria-label', 'Ver vídeo em tela cheia');
    await botao.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.tagName ?? '')).toBe('VIDEO');
    await page.evaluate(() => document.exitFullscreen());
  });
  test('na vitrine da home também, em inglês', async ({ page }) => {
    await page.goto('/en/');
    const botao = page.locator('#projetos [data-vitrine] [data-video-tela-cheia]').first();
    await expect(botao).toHaveAttribute('aria-label', 'View video full screen');
    expect(await page.locator('#projetos [data-vitrine] [data-video-tela-cheia]').count()).toBe(await page.locator('#projetos [data-vitrine] video').count());
  });
});
test.describe('botão de tela cheia sem JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('não aparece', async ({ page }) => {
    await page.goto('/projetos/rodoviariaos/');
    const botoes = page.locator('[data-video-tela-cheia]');
    expect(await botoes.count()).toBeGreaterThan(0);
    expect(await botoes.evaluateAll((bs) => bs.every((b) => getComputedStyle(b).display === 'none'))).toBe(true);
  });
});

test.describe('imagem ampliada', () => {
  for (const [descricao, caminho, seletor] of [
    ['larga (navegador)', '/projetos/rodoviariaos/', '.funcs .moldura--navegador [data-ampliar]'],
    ['de celular', '/projetos/life-rpg/', '.funcs .moldura--celular [data-ampliar]'],
  ] as const) {
    test(`uma imagem ${descricao} cabe inteira, sem deformar e sem rolagem`, async ({ page }) => {
      await page.goto(caminho);
      const botao = page.locator(seletor).first();
      await botao.scrollIntoViewIfNeeded();
      await botao.click();
      const dialogo = page.locator('[data-ampliador]');
      await expect(dialogo).toBeVisible();
      const img = dialogo.locator('img');
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
      const m = await page.evaluate(() => {
        const d = document.querySelector('[data-ampliador]') as HTMLDialogElement;
        const i = d.querySelector('img') as HTMLImageElement;
        const r = i.getBoundingClientRect();
        return {
          dentro: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          proporcao: Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight),
          sobraV: d.scrollHeight - d.clientHeight,
          sobraH: d.scrollWidth - d.clientWidth,
        };
      });
      expect(m.dentro).toBe(true);
      expect(m.proporcao).toBeLessThan(0.02);
      expect(m.sobraV).toBeLessThanOrEqual(0);
      expect(m.sobraH).toBeLessThanOrEqual(0);
    });
  }
});
