import { expect, test } from '@playwright/test';

test('o mapa de arquitetura explica o componente escolhido', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  const no = page.getByRole('button', { name: /withTenant\(\)/ });
  await no.scrollIntoViewIfNeeded();
  await expect(page.locator('astro-island').filter({ has: page.locator('.mapa') })).not.toHaveAttribute('ssr');
  const explicacao = page.locator('.mapa-explicacao');
  await expect(explicacao).not.toContainText('transação');
  await no.click();
  await expect(explicacao).toContainText('transação');
  await expect(no).toHaveAttribute('aria-pressed', 'true');
});
