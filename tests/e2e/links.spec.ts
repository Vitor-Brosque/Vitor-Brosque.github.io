import { expect, test } from '@playwright/test';
import { paginas } from './paginas';

test('todos os links internos respondem 200', async ({ page, request }) => {
  test.skip(test.info().project.name !== 'desktop', 'basta rodar uma vez');
  const vistos = new Set<string>();
  for (const { caminho } of paginas) {
    await page.goto(caminho);
    const hrefs = await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href') ?? '/'));
    for (const h of hrefs) vistos.add(h.split('#')[0] || '/');
  }
  for (const href of vistos) {
    const r = await request.get(href);
    expect(r.status(), href).toBe(200);
  }
});
