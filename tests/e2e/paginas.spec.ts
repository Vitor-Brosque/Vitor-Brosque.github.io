import { expect, test } from '@playwright/test';
import { paginas } from './paginas';

for (const { caminho, lang } of paginas) {
  test(`${caminho} abre sem erro`, async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') erros.push(m.text());
    });
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(erros).toEqual([]);
  });

  test(`${caminho} não rola na horizontal`, async ({ page }) => {
    await page.goto(caminho);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
}

test('404 mostra Saiu da estrada', async ({ page }) => {
  const resposta = await page.goto('/nao-existe/');
  expect(resposta?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Saiu da estrada.');
});
