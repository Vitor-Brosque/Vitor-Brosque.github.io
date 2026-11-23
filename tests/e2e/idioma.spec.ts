import { expect, test } from '@playwright/test';

test('troca de idioma leva à página equivalente e volta', async ({ page }) => {
  await page.goto('/projetos/life-rpg/');
  await page.getByRole('link', { name: 'Ver esta página em inglês' }).click();
  await expect(page).toHaveURL(/\/en\/projects\/life-rpg\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('link', { name: 'View this page in Portuguese' }).click();
  await expect(page).toHaveURL(/\/projetos\/life-rpg\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
});
