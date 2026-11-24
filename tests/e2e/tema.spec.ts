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

// A rota: no Life RPG as paradas são marcos da jornada; no RodoviariaOS continuam os KM.
const rotulos = [
  { caminho: '/projetos/life-rpg/', rotulo: /^Marco 1$/ },
  { caminho: '/en/projects/life-rpg/', rotulo: /^Milestone 1$/ },
  { caminho: '/projetos/rodoviariaos/', rotulo: /^KM 0$/ },
] as const;
for (const r of rotulos) {
  test(`${r.caminho}: rótulo da primeira parada da rota`, async ({ page }) => {
    await page.goto(r.caminho);
    await expect(page.locator('[data-rota] .placa .km').first()).toHaveText(r.rotulo);
  });
}

test('na rota do Life RPG quem anda é a lanterna; na do RodoviariaOS, o carrinho', async ({ page }) => {
  await page.goto('/projetos/life-rpg/');
  await expect(page.locator('[data-rota] .carro .lanterna')).toHaveCount(1);
  await expect(page.locator('[data-rota] .carro .carrinho')).toHaveCount(0);
  await expect(page.locator('[data-rota] .marco')).toHaveCount(5);
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('[data-rota] .carro .carrinho')).toHaveCount(1);
  await expect(page.locator('[data-rota] .marco')).toHaveCount(0);
});

for (const modo of ['reduce', 'no-preference'] as const) {
  test.describe(`pausa no Life RPG (${modo === 'reduce' ? 'movimento reduzido' : 'movimento permitido'})`, () => {
    test.use({ reducedMotion: modo });

    test('o botão da trilha para a trilha e a chama da lanterna', async ({ page }) => {
      await page.goto('/projetos/life-rpg/');
      const trilha = page.locator('[data-estrada]');
      const botao = page.locator('[data-estrada-pausa]');
      await trilha.scrollIntoViewIfNeeded();
      const desloc = () => trilha.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
      await expect.poll(desloc).not.toBe('');
      const antes = await desloc();
      await expect.poll(desloc, { timeout: 3000 }).not.toBe(antes);
      const chamas = () =>
        page.evaluate(
          () =>
            document.getAnimations().filter((a) => {
              const alvo = (a.effect as KeyframeEffect | null)?.target as Element | null;
              return a.playState === 'running' && alvo?.closest('.lanterna');
            }).length,
        );
      if (modo === 'no-preference') expect(await chamas()).toBeGreaterThan(0);
      else expect(await chamas()).toBe(0);

      await botao.click();
      await expect(botao).toHaveAttribute('aria-label', 'Continuar animações');
      const parada = await desloc();
      await page.waitForTimeout(800);
      expect(await desloc()).toBe(parada);
      expect(await chamas()).toBe(0);
      // Na pausa a chama volta ao primeiro quadro.
      const visiveis = await page.locator('.lanterna .quadro').evaluateAll((qs) => qs.map((q) => getComputedStyle(q).visibility));
      expect(visiveis.filter((v, i) => i % 2 === 0).every((v) => v === 'visible')).toBe(true);
      expect(visiveis.filter((v, i) => i % 2 === 1).every((v) => v === 'hidden')).toBe(true);

      await botao.click();
      await expect.poll(desloc, { timeout: 3000 }).not.toBe(parada);
    });
  });
}

// Estágios do projeto (tema rpg): os cinco estágios de território, Hoje sob a Vila e o que falta sob o Castelo.
const estagios = [
  { caminho: '/projetos/life-rpg/', nomes: ['Ruínas', 'Acampamento', 'Aldeia', 'Vila', 'Castelo'], hoje: 'Hoje', falta: 'Falta para o castelo', proximo: /testar no iPhone real/ },
  { caminho: '/en/projects/life-rpg/', nomes: ['Ruins', 'Camp', 'Village', 'Town', 'Castle'], hoje: 'Today', falta: 'Left before the castle', proximo: /test on a real iPhone/ },
] as const;
for (const js of [true, false]) {
  test.describe(js ? 'com JavaScript' : 'sem JavaScript', () => {
    test.use({ javaScriptEnabled: js });
    for (const e of estagios) {
      test(`${e.caminho}: os cinco estágios na ordem, Hoje sob a Vila e os próximos passos sob o Castelo`, async ({ page }) => {
        await page.goto(e.caminho);
        const itens = page.locator('.estagios > .estagio');
        await expect(itens.locator('.estagio-nome')).toHaveText([...e.nomes]);
        await itens.nth(4).scrollIntoViewIfNeeded();
        const vila = itens.nth(3);
        await expect(vila).toHaveAttribute('aria-current', 'step');
        await expect(vila.locator('.tag')).toHaveText(e.hoje);
        await expect(vila.locator('.estagio-nota')).toContainText('2');
        await expect(vila.locator('.estagio-nota')).toBeVisible();
        const castelo = itens.nth(4);
        await expect(castelo.locator('.rotulo')).toHaveText(e.falta);
        await expect(castelo.locator('li')).toHaveCount(3);
        await expect(castelo.getByText(e.proximo)).toBeVisible();
        for (const i of [0, 1, 2]) await expect(itens.nth(i).locator('.estagio-nota')).toHaveCount(0);
        await expect(page.locator('body')).not.toContainText('%');
      });
    }
  });
}

test('o RodoviariaOS continua com a lista de próximos passos, sem estágios', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('.estagios')).toHaveCount(0);
});

test('na home só o cartão do Life RPG tem a moldura do jogo e a lanterna', async ({ page }) => {
  await page.goto('/');
  const cartao = page.locator('.card--rpg');
  await expect(cartao).toHaveCount(1);
  await expect(cartao.locator('h3')).toHaveText('Life RPG');
  expect(await cartao.locator('h3').evaluate((h) => getComputedStyle(h).fontFamily)).toMatch(/Pixelify Sans/);
  await expect(cartao.locator('.card-midia .lanterna')).toHaveCount(1);
  await expect(page.locator('.card:not(.card--rpg) .lanterna')).toHaveCount(0);
});
