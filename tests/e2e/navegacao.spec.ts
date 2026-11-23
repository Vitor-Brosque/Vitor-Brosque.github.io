import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('navegação pelo ClientRouter mantém a rota, o pin e o idioma funcionando', async ({ page }, info) => {
  test.skip(info.project.name === 'celular', 'cobre o layout de desktop (pin da rota)');
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(`console: ${m.text()}`);
  });

  await page.goto('/');
  await page.evaluate(() => {
    (window as unknown as { __marca: number }).__marca = 1;
  });
  await page.locator('#projetos').getByRole('link', { name: /ver estudo de caso/i }).click();
  await expect(page).toHaveURL(/\/projetos\/rodoviariaos\/$/);
  expect(await page.evaluate(() => (window as unknown as { __marca?: number }).__marca)).toBe(1);

  const rota = page.locator('[data-rota][data-modo="rolagem"]');
  await rota.scrollIntoViewIfNeeded();
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  const indiceAtivo = () => rota.locator('.placa').evaluateAll((ps) => ps.findIndex((p) => p.hasAttribute('data-ativa')));
  const topo = await rota.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo(0, y - 80 + 400), topo);
  await expect.poll(indiceAtivo, { timeout: 5000 }).toBeGreaterThanOrEqual(0);
  const antes = await indiceAtivo();
  await page.evaluate((y) => window.scrollTo(0, y - 80 + 2200), topo);
  await expect.poll(indiceAtivo, { timeout: 5000 }).not.toBe(antes);
  await expect(page.locator('.pin-spacer')).toHaveCount(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  const loop = page.locator('[data-rota][data-modo="loop"]').first();
  await loop.scrollIntoViewIfNeeded();
  const pos = () => loop.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));
  const inicial = await pos();
  await expect.poll(pos, { timeout: 8000 }).not.toBe(inicial);

  await page.getByRole('link', { name: /ver esta página em inglês/i }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  expect(erros).toEqual([]);
});
