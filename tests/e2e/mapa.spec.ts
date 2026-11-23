import { expect, test } from '@playwright/test';

test('o mapa de arquitetura explica o componente escolhido', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  const no = page.getByRole('button', { name: /withTenant\(\)/ });
  await no.scrollIntoViewIfNeeded();
  await expect(async () => {
    await no.click();
    await expect(page.locator('.mapa-explicacao')).toContainText('transação', { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
});
