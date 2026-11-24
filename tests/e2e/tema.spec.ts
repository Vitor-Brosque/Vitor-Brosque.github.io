import { expect, test, type Page } from '@playwright/test';

/** A fonte `familia` já carregou de fato na página, no peso pedido (a pilha declarada no CSS não prova isso). */
const fonteCarregada = (page: Page, familia: string, peso: number) =>
  page.evaluate(
    async ([familia, peso]) => {
      await document.fonts.ready;
      return (
        document.fonts.check(`${peso} 16px "${familia}"`) &&
        [...document.fonts].some((f) => f.family.replace(/"/g, '') === familia && String(f.weight) === String(peso) && f.status === 'loaded')
      );
    },
    [familia, peso] as const,
  );
const pixelifyCarregada = (page: Page) => fonteCarregada(page, 'Pixelify Sans', 400);

// Tema por projeto: o Life RPG tem a cara do jogo, o TechNews a do terminal; o RodoviariaOS fica com a rodovia.
const casos = [
  { caminho: '/projetos/life-rpg/', tema: 'rpg', fonte: 'Pixelify Sans', peso: 400 },
  { caminho: '/en/projects/life-rpg/', tema: 'rpg', fonte: 'Pixelify Sans', peso: 400 },
  { caminho: '/projetos/technews/', tema: 'terminal', fonte: 'JetBrains Mono', peso: 700 },
  { caminho: '/en/projects/technews/', tema: 'terminal', fonte: 'JetBrains Mono', peso: 700 },
  { caminho: '/projetos/rodoviariaos/', tema: 'rodovia', fonte: null, peso: 0 },
] as const;

for (const c of casos) {
  test(`${c.caminho}: tema ${c.tema}`, async ({ page }) => {
    await page.goto(c.caminho);
    await expect(page.locator('main')).toHaveAttribute('data-tema', c.tema);
    const fonte = await page.locator('h1').evaluate((h) => getComputedStyle(h).fontFamily);
    if (c.fonte) {
      expect(fonte.split(',')[0]).toMatch(c.fonte);
      await expect.poll(() => fonteCarregada(page, c.fonte, c.peso)).toBe(true);
    } else expect(fonte).not.toMatch(/Pixelify|JetBrains/);
  });
}

for (const caminho of ['/projetos/life-rpg/', '/projetos/technews/']) {
  test(`${caminho}: a leitura enche a barra do tema; no RodoviariaOS não há barra`, async ({ page }) => {
    await page.goto(caminho);
    const cheio = () => page.locator('[data-leitura]').evaluate((el) => parseFloat((el as HTMLElement).style.getPropertyValue('--lido')) || 0);
    expect(await cheio()).toBe(0);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(cheio).toBeGreaterThan(0);
    await page.goto('/projetos/rodoviariaos/');
    await expect(page.locator('[data-leitura]')).toHaveCount(0);
  });
}

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
      const segundoQuadroAVista = () =>
        page.locator('.lanterna .quadro-2').evaluateAll((qs) => qs.some((q) => getComputedStyle(q).visibility === 'visible'));
      if (modo === 'no-preference') {
        expect(await chamas()).toBeGreaterThan(0);
        // Só prova a volta ao primeiro quadro se o segundo chegou a aparecer antes da pausa.
        await expect.poll(segundoQuadroAVista, { timeout: 3000, intervals: [50] }).toBe(true);
      } else expect(await chamas()).toBe(0);

      await botao.click();
      await expect(botao).toHaveAttribute('aria-label', 'Continuar animações');
      const parada = await desloc();
      await page.waitForTimeout(800);
      expect(await desloc()).toBe(parada);
      expect(await chamas()).toBe(0);
      // Na pausa a chama volta ao primeiro quadro.
      expect(await segundoQuadroAVista()).toBe(false);
      const visiveis = await page.locator('.lanterna .quadro').evaluateAll((qs) => qs.map((q) => getComputedStyle(q).visibility));
      expect(visiveis.filter((_, i) => i % 2 === 0).every((v) => v === 'visible')).toBe(true);
      expect(visiveis.filter((_, i) => i % 2 === 1).every((v) => v === 'hidden')).toBe(true);

      await botao.click();
      await expect.poll(desloc, { timeout: 3000 }).not.toBe(parada);
    });
  });
}

// Estágios do projeto (tema rpg): os cinco estágios de território, Hoje sob a Vila e o que falta sob o Castelo.
const estagios = [
  { caminho: '/projetos/life-rpg/', nomes: ['Ruínas', 'Acampamento', 'Aldeia', 'Vila', 'Castelo'], hoje: 'Hoje', frase: 'Funciona sem internet, tem mais de 2.300 testes automáticos e está em uso no PC.', falta: 'Falta para o castelo', proximo: /testar no iPhone real/ },
  { caminho: '/en/projects/life-rpg/', nomes: ['Ruins', 'Camp', 'Village', 'Town', 'Castle'], hoje: 'Today', frase: 'It works offline, has more than 2,300 automated tests and is in use on the PC.', falta: 'Left before the castle', proximo: /test on a real iPhone/ },
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
        await expect(vila.locator('.estagio-nota p')).toHaveText(e.frase);
        // Só o Castelo está apagado.
        expect(await itens.evaluateAll((ls) => ls.map((l) => l.classList.contains('estagio--apagado')))).toEqual([false, false, false, false, true]);
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
  expect(await page.locator('.proximos li').count()).toBeGreaterThan(0);
});

test('na home só o cartão do Life RPG tem a moldura do jogo e a lanterna', async ({ page }) => {
  await page.goto('/');
  const cartao = page.locator('.card--rpg');
  await expect(cartao).toHaveCount(1);
  await expect(cartao.locator('h3')).toHaveText('Life RPG');
  expect(await cartao.locator('h3').evaluate((h) => getComputedStyle(h).fontFamily)).toMatch(/Pixelify Sans/);
  await cartao.scrollIntoViewIfNeeded();
  await expect.poll(() => pixelifyCarregada(page)).toBe(true);
  await expect(cartao.locator('.card-midia .lanterna')).toHaveCount(1);
  await expect(page.locator('.card:not(.card--rpg) .lanterna')).toHaveCount(0);
});

// Exceção escolhida à regra dos dois modos: no Life RPG a lanterna percorre a trilha também com movimento reduzido.
test.describe('rota com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no Life RPG a lanterna anda com a rolagem e a placa ativa troca', async ({ page }) => {
    await page.goto('/projetos/life-rpg/');
    const rota = page.locator('[data-rota][data-modo="rolagem"]');
    const lanterna = rota.locator('.carro .lanterna');
    await expect(rota).not.toHaveAttribute('data-estatico');
    await expect(page.locator('[data-rota] [data-estatico], [data-rota][data-estatico]')).toHaveCount(0);
    const topo = await rota.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo(0, y - 40), topo);
    await expect(lanterna).toBeVisible();
    const pos = () => rota.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));
    const ativa = () => rota.locator('.placa').evaluateAll((ps) => ps.findIndex((p) => p.hasAttribute('data-ativa')));
    await expect.poll(pos).not.toBe('');
    // Parado numa parada: a posição não muda sozinha (sem suavização que continue andando).
    const antes = await pos();
    const placaAntes = await ativa();
    await page.waitForTimeout(400);
    expect(await pos()).toBe(antes);
    await page.evaluate(() => window.scrollBy(0, 900));
    await expect.poll(pos).not.toBe(antes);
    await expect.poll(ativa).not.toBe(placaAntes);
    await expect(lanterna).toBeVisible();
    // A chama fica no primeiro quadro e nada fica em loop.
    expect(await page.locator('.lanterna .quadro-2').evaluateAll((qs) => qs.every((q) => getComputedStyle(q).visibility === 'hidden'))).toBe(true);
  });

  test('no RodoviariaOS a rota continua a lista estática, sem veículo', async ({ page }) => {
    await page.goto('/projetos/rodoviariaos/');
    const rota = page.locator('[data-rota][data-modo="rolagem"]');
    await expect(rota).toHaveAttribute('data-estatico', '');
    await rota.scrollIntoViewIfNeeded();
    await expect(rota.locator('.carro')).toBeHidden();
  });
});
