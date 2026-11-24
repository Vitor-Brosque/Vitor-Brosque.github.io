import { expect, test } from '@playwright/test';

// A bolinha de cada marco fica no centro da pista (no tracejado) e na altura da primeira linha do título.
for (const largura of [1280, 390]) {
  test(`trajetória em ${largura} px: as bolinhas ficam no centro da pista`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 844 });
    await page.goto('/');
    const traj = page.locator('[data-trajetoria]');
    await traj.scrollIntoViewIfNeeded();
    const medidas = await traj.evaluate((el) => {
      const pista = el.querySelector('.traj-estrada')!.getBoundingClientRect();
      const centro = pista.left + pista.width / 2;
      return [...el.querySelectorAll('.traj-marco h3')].map((h3) => {
        const caixa = h3.getBoundingClientRect();
        const bola = getComputedStyle(h3, '::before');
        const largura = parseFloat(bola.width);
        const altura = parseFloat(bola.height);
        return {
          dx: Math.abs(caixa.left + parseFloat(bola.left) - centro),
          dy: Math.abs(caixa.top + parseFloat(bola.top) - (caixa.top + parseFloat(getComputedStyle(h3).lineHeight) / 2)),
          redonda: largura === altura,
          // A bolinha é posicionada pelo centro: left/top dela são o centro.
          translate: bola.translate,
        };
      });
    });
    expect(medidas).toHaveLength(3);
    for (const m of medidas) {
      expect(m.dx).toBeLessThanOrEqual(2);
      expect(m.dy).toBeLessThanOrEqual(2);
      expect(m.redonda).toBe(true);
      expect(m.translate).toBe('-50% -50%');
    }
  });
}
