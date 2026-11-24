import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('navegação pelo ClientRouter mantém as rotas e o idioma funcionando', async ({ page }, info) => {
  test.skip(info.project.name === 'celular', 'cobre o layout de desktop');
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

  // A rota do estudo de caso anda sozinha depois da troca de página (o script reinicia no astro:page-load).
  const rota = page.locator('main [data-rota]');
  await rota.scrollIntoViewIfNeeded();
  // O ponteiro ficou onde o link foi clicado; sobre a vitrine ele seguraria a parada (de propósito): tira de cima.
  await page.mouse.move(1, 1);
  const indiceAtivo = () => rota.locator('.placa').evaluateAll((ps) => ps.findIndex((p) => p.hasAttribute('data-ativa')));
  await expect.poll(indiceAtivo, { timeout: 5000 }).toBeGreaterThanOrEqual(0);
  const antes = await indiceAtivo();
  await expect.poll(indiceAtivo, { timeout: 15_000 }).not.toBe(antes);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  // O fim do estudo de caso também tem uma rota em loop (o cartão do TechNews): a da home é a da seção de projetos.
  const loop = page.locator('#projetos [data-rota][data-modo="loop"]').first();
  await loop.scrollIntoViewIfNeeded();
  const pos = () => loop.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));
  await expect.poll(pos, { timeout: 8000 }).not.toBe('');
  const inicial = await pos();
  await expect.poll(async () => { const v = await pos(); return v !== '' && v !== inicial; }, { timeout: 8000 }).toBe(true);

  await page.getByRole('link', { name: /ver esta página em inglês/i }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  expect(erros).toEqual([]);
});

// No fim de cada estudo de caso, "Outros projetos" traz os outros dois, em cartões, na ordem a partir do seguinte.
const fins = [
  { caminho: '/projetos/rodoviariaos/', outros: ['/projetos/life-rpg/', '/projetos/technews/'], titulo: 'Outros projetos' },
  { caminho: '/projetos/life-rpg/', outros: ['/projetos/technews/', '/projetos/rodoviariaos/'], titulo: 'Outros projetos' },
  { caminho: '/projetos/technews/', outros: ['/projetos/rodoviariaos/', '/projetos/life-rpg/'], titulo: 'Outros projetos' },
  { caminho: '/en/projects/rodoviariaos/', outros: ['/en/projects/life-rpg/', '/en/projects/technews/'], titulo: 'Other projects' },
  { caminho: '/en/projects/life-rpg/', outros: ['/en/projects/technews/', '/en/projects/rodoviariaos/'], titulo: 'Other projects' },
  { caminho: '/en/projects/technews/', outros: ['/en/projects/rodoviariaos/', '/en/projects/life-rpg/'], titulo: 'Other projects' },
] as const;
for (const f of fins) {
  test(`${f.caminho}: o fim mostra os outros dois projetos em cartões e leva a eles`, async ({ page }) => {
    await page.goto(f.caminho);
    const nav = page.getByRole('navigation', { name: f.titulo });
    await expect(nav.getByRole('heading', { level: 2 })).toHaveText(f.titulo);
    const cartoes = nav.locator('.card');
    await expect(cartoes).toHaveCount(2);
    expect(await cartoes.locator('.card-link').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual([...f.outros]);
    // Mesma altura nos dois cartões.
    await cartoes.first().scrollIntoViewIfNeeded();
    const alturas = await cartoes.evaluateAll((cs) => cs.map((c) => Math.round(c.getBoundingClientRect().height)));
    if ((page.viewportSize()?.width ?? 0) >= 700) expect(alturas[0]).toBe(alturas[1]);
    // O cartão leva à página do projeto.
    await cartoes.nth(1).locator('.card-link').click();
    await expect(page).toHaveURL(new RegExp(`${f.outros[1]}$`));
  });
}

test('cada cartão do fim tem a cara do próprio projeto, não a da página', async ({ page }) => {
  await page.goto('/projetos/technews/');
  const nav = page.getByRole('navigation', { name: 'Outros projetos' });
  // O do Life RPG com a moldura do jogo e a lanterna; o do RodoviariaOS com a capa e a fonte do site.
  await expect(nav.locator('.card--rpg .card-lanterna .lanterna')).toHaveCount(1);
  const rodovia = nav.locator('.card:not(.card--rpg):not(.card--terminal)');
  await expect(rodovia.locator('img')).toHaveCount(1);
  expect((await rodovia.locator('h3').evaluate((h) => getComputedStyle(h).fontFamily)).split(',')[0]).toMatch(/Archivo/);
  expect(await rodovia.evaluate((c) => getComputedStyle(c).getPropertyValue('--signal').trim())).toBe('#f5b800');
  await page.goto('/projetos/life-rpg/');
  const nav2 = page.getByRole('navigation', { name: 'Outros projetos' });
  await expect(nav2.locator('.card--terminal .cursor-rota')).toHaveCount(1);
  expect((await nav2.locator('.card--terminal h3').evaluate((h) => getComputedStyle(h).fontFamily)).split(',')[0]).toMatch(/JetBrains Mono/);
});
