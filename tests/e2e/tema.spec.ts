import { expect, test } from '@playwright/test';

// Tema por projeto: só a página do Life RPG tem a cara do jogo.
const casos = [
  { caminho: '/projetos/life-rpg/', tema: 'rpg' },
  { caminho: '/en/projects/life-rpg/', tema: 'rpg' },
  { caminho: '/projetos/rodoviariaos/', tema: 'rodovia' },
  { caminho: '/projetos/technews/', tema: 'rodovia' },
] as const;

for (const c of casos) {
  test(`${c.caminho}: tema ${c.tema}`, async ({ page }) => {
    await page.goto(c.caminho);
    await expect(page.locator('main')).toHaveAttribute('data-tema', c.tema);
    const fonte = await page.locator('h1').evaluate((h) => getComputedStyle(h).fontFamily);
    if (c.tema === 'rpg') expect(fonte).toMatch(/Pixelify Sans/);
    else expect(fonte).not.toMatch(/Pixelify/);
  });
}

test('no Life RPG a leitura enche a barra de XP; nas outras páginas não há barra', async ({ page }) => {
  await page.goto('/projetos/life-rpg/');
  const cheio = () => page.locator('[data-xp]').evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--xp')) || 0);
  expect(await cheio()).toBe(0);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(cheio).toBeGreaterThan(0);
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('[data-xp]')).toHaveCount(0);
});
