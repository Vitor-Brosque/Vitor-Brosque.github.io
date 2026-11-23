import { expect, test } from '@playwright/test';

const casos = [
  { caminho: '/projetos/rodoviariaos/', numero: '1.000', deixei: /O filtro só na aplicação/, proibida: /Desafios/ },
  { caminho: '/en/projects/rodoviariaos/', numero: '1,000', deixei: /Filtering only in the application/, proibida: /Challenges/ },
] as const;

for (const c of casos) {
  test(`${c.caminho}: Em resumo vem antes de O problema e traz os números`, async ({ page }) => {
    await page.goto(c.caminho);
    const resumo = page.locator('#em-resumo');
    await expect(resumo).toBeVisible();
    const antes = await page.evaluate(() => {
      const a = document.getElementById('em-resumo');
      const b = document.getElementById('problema');
      return Boolean(a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(antes).toBe(true);
    await expect(page.locator('.em-resumo')).toContainText(c.numero);
  });

  test(`${c.caminho}: abrir uma decisão mostra o que ficou de lado`, async ({ page }) => {
    await page.goto(c.caminho);
    const primeira = page.locator('details.decisao').first();
    await expect(primeira).not.toHaveAttribute('open', '');
    await primeira.locator('summary').click();
    await expect(primeira.getByText(c.deixei)).toBeVisible();
  });

  test(`${c.caminho}: não existe seção de desafios`, async ({ page }) => {
    await page.goto(c.caminho);
    await expect(page.locator('body')).not.toContainText(c.proibida);
  });
}
