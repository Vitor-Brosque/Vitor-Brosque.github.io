import { expect, test } from '@playwright/test';

// A primeira dobra no desktop: título, botões, faixa de números e a estrada com o carro cabem na janela sem rolar.
const janelas = [
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
];

for (const caminho of ['/', '/en/']) {
  for (const janela of janelas) {
    test(`${caminho} em ${janela.width}×${janela.height}: o hero e a estrada cabem na primeira dobra`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'só no desktop');
      await page.setViewportSize(janela);
      await page.goto(caminho);
      await page.waitForLoadState('load');
      const fundo = (seletor: string) =>
        page.locator(seletor).first().evaluate((el) => {
          const r = el.getBoundingClientRect();
          return { topo: r.top, fundo: r.bottom };
        });
      for (const seletor of ['.hero h1', '.hero-apresentacao', '.hero-acoes', '.hero-print', '.hero .numeros', '[data-estrada]', '[data-estrada] .estrada-carro']) {
        const caixa = await fundo(seletor);
        expect(caixa.topo, `${seletor} começa na janela`).toBeGreaterThanOrEqual(0);
        expect(caixa.fundo, `${seletor} termina na janela`).toBeLessThanOrEqual(janela.height);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(janela.width);
    });
  }
}
