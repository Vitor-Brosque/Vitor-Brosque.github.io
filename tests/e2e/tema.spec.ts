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
  { caminho: '/projetos/technews/', rotulo: /^Etapa 1$/ },
  { caminho: '/en/projects/technews/', rotulo: /^Stage 1$/ },
] as const;
for (const r of rotulos) {
  test(`${r.caminho}: rótulo da primeira parada da rota`, async ({ page }) => {
    await page.goto(r.caminho);
    await expect(page.locator('[data-rota] .placa .km').first()).toHaveText(r.rotulo);
  });
}

test('na rota do Life RPG quem anda é a lanterna; na do RodoviariaOS, o carrinho', async ({ page }) => {
  await page.goto('/projetos/life-rpg/');
  // Só a rota da página (no <main>): o fim da página tem os cartões dos outros projetos, cada um com a sua rota.
  await expect(page.locator('main [data-rota] .carro .lanterna')).toHaveCount(1);
  await expect(page.locator('main [data-rota] .carro .carrinho')).toHaveCount(0);
  await expect(page.locator('main [data-rota] .marco')).toHaveCount(5);
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('main [data-rota] .carro .carrinho')).toHaveCount(1);
  await expect(page.locator('main [data-rota] .marco')).toHaveCount(0);
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

  // As rotas do Life RPG e do TechNews andam sozinhas, como a rota grande da home (modo loop), também com movimento reduzido.
  for (const { caminho, veiculo, n, marcos } of [
    { caminho: '/projetos/rodoviariaos/', veiculo: '.carrinho', n: 6, marcos: false },
    { caminho: '/projetos/life-rpg/', veiculo: '.lanterna', n: 5, marcos: true },
    { caminho: '/projetos/technews/', veiculo: '.cursor-rota', n: 6, marcos: true },
  ]) {
  test(`${caminho}: o veículo muda de parada sozinho, sem rolar; a pausa para; clicar numa parada leva o veículo até ela`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(caminho);
    const rota = page.locator('main [data-rota]').filter({ has: page.locator(veiculo) });
    await expect(rota).not.toHaveAttribute('data-estatico');
    await rota.scrollIntoViewIfNeeded();
    const y = await page.evaluate(() => window.scrollY);
    const lanterna = rota.locator(`.carro ${veiculo}`);
    await expect(lanterna).toBeVisible();
    const ativa = () => rota.locator('.placa').evaluateAll((ps) => ps.findIndex((p) => p.hasAttribute('data-ativa')));
    const pos = () => rota.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));
    // Observa um marco, espera, observa outro: a lanterna andou sozinha.
    await expect.poll(ativa, { timeout: 5_000 }).toBeGreaterThanOrEqual(0);
    const primeira = await ativa();
    await expect.poll(ativa, { timeout: 12_000 }).not.toBe(primeira);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    // Nos temas próprios há um nó por parada, que acende quando o veículo passa (a rodovia não tem nós).
    const acesos = () => rota.locator('.marco[data-aceso]').count();
    if (marcos) expect(await acesos()).toBeGreaterThan(0);
    // A pausa da rota para o veículo: mais que uma parada inteira e um trecho (2,5 s + 0,6 s) depois, ele segue na mesma
    // parada e no mesmo lugar.
    const pausa = rota.locator('[data-rota-pausa]');
    await pausa.click();
    await expect(pausa).toHaveText('Continuar');
    const parada = await pos();
    const ativaNaPausa = await ativa();
    await page.waitForTimeout(6000);
    expect(await ativa()).toBe(ativaNaPausa);
    expect(await pos()).toBe(parada);
    // Clicar na última parada leva o veículo até ela.
    await rota.locator('[data-placa-botao]').nth(n - 1).click();
    await expect.poll(ativa).toBe(n - 1);
    await expect.poll(() => rota.evaluate((el) => el.hasAttribute('data-andando'))).toBe(false);
    if (marcos) await expect.poll(acesos).toBe(n);
    // Chama no primeiro quadro e cursor aceso, sem loop.
    expect(await page.locator('.lanterna .quadro-2').evaluateAll((qs) => qs.every((q) => getComputedStyle(q).visibility === 'hidden'))).toBe(true);
    expect(await page.locator('.cursor-rota, .cursor-bloco').evaluateAll((cs) => cs.every((c) => getComputedStyle(c).opacity === '1'))).toBe(true);
  });
  }

  test('no Life RPG a lanterna fica sobre a trilha, parada no primeiro quadro', async ({ page }) => {
    await page.goto('/projetos/life-rpg/');
    const trilha = page.locator('[data-estrada]');
    await trilha.scrollIntoViewIfNeeded();
    const lanterna = trilha.locator('.estrada-lanterna .lanterna');
    await expect(lanterna).toBeVisible();
    const caixa = (await lanterna.boundingBox())!;
    const faixa = (await trilha.boundingBox())!;
    expect(caixa.y).toBeGreaterThanOrEqual(faixa.y - 1);
    expect(caixa.y + caixa.height).toBeLessThanOrEqual(faixa.y + faixa.height + 1);
    expect(caixa.width).toBe(48);
    expect(await lanterna.evaluate((l) => l.getAnimations({ subtree: true }).length)).toBe(0);
  });

});

// Tema terminal: o log do pipeline no cabeçalho, no formato real do TechNews.
const logDoTopo = [
  '$ python scr/main.py',
  '$ tail technews.log',
  '2026-11-23 10:12:04,518 | WARNING | SEM_URL_OU_TITULO | ID = 46012907',
  '2026-11-23 10:12:09,131 | INFO | EXTRACAO_OK | ID = 46013377',
  '2026-11-23 10:12:11,870 | WARNING | FALHA_DOWNLOAD | ID=46013412 | URL=https://…',
  '2026-11-23 10:13:40,002 | INFO | RESUMO_INGESTAO | INSERIDAS=… | DUPLICADAS=… | REJEITADAS=…',
];
for (const js of [true, false]) {
  test.describe(js ? 'log do topo, com JavaScript' : 'log do topo, sem JavaScript', () => {
    test.use({ javaScriptEnabled: js, reducedMotion: 'reduce' });
    for (const [caminho, legenda] of [
      ['/projetos/technews/', 'Formato real do log do projeto. IDs e horários de exemplo.'],
      ['/en/projects/technews/', "The project's real log format. Sample IDs and times."],
    ] as const) {
      test(`${caminho}: as seis linhas na ordem, com os níveis coloridos e a legenda`, async ({ page }) => {
        await page.goto(caminho);
        const janela = page.locator('.log-janela');
        await expect(janela).toBeVisible();
        await expect(janela).toHaveAttribute('aria-label', /technews\.log/);
        await expect(janela.locator('.log-linha')).toHaveText(logDoTopo);
        await expect(janela.locator('.log-nivel')).toHaveText(['WARNING', 'INFO', 'WARNING', 'INFO']);
        // WARNING no âmbar do tema e INFO no verde do tema (valores computados).
        const cores = await janela.locator('.log-nivel').evaluateAll((ns) => ns.map((n) => getComputedStyle(n).color));
        const [verde, ambar] = await page.evaluate(() =>
          ['--verde', '--ambar'].map((v) => {
            const t = document.createElement('span');
            t.style.color = `var(${v})`;
            document.querySelector('main')!.append(t);
            const cor = getComputedStyle(t).color;
            t.remove();
            return cor;
          }),
        );
        expect(verde).toBe('rgb(126, 231, 135)');
        expect(ambar).toBe('rgb(227, 179, 65)');
        expect(cores).toEqual([ambar, verde, ambar, verde]);
        await expect(janela.locator('figcaption')).toHaveText(legenda);
        // Nada de rolagem horizontal: as linhas quebram dentro da janela.
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      });
    }
  });
}
// Com movimento permitido as linhas entram uma a uma: todas precisam chegar à vista (com e sem JS).
const linhasVisiveis = (page: Page) =>
  page.locator('.log-janela .log-linha').evaluateAll((ls) => ls.filter((l) => getComputedStyle(l).visibility === 'visible').length);
for (const js of [true, false]) {
  test.describe(`log do topo com movimento, ${js ? 'com' : 'sem'} JavaScript`, () => {
    test.use({ javaScriptEnabled: js, reducedMotion: 'no-preference' });
    test('as seis linhas aparecem todas', async ({ page }) => {
      await page.goto('/projetos/technews/');
      await expect.poll(() => linhasVisiveis(page), { timeout: 3500 }).toBe(6);
    });
  });
}
test.describe('log do topo, pausa cedo', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('pausar no meio da entrada mostra o log inteiro, e continuar não esconde as linhas de novo', async ({ page }) => {
    await page.goto('/projetos/technews/', { waitUntil: 'domcontentloaded' });
    // Pausa assim que o botão responde, anotando antes do clique se a última linha ainda esperava a vez (prova de que foi cedo).
    const pausar = () =>
      page.evaluate(() => {
        const w = window as unknown as { __pendente?: boolean };
        const a = [...document.querySelectorAll('.log-janela .log-linha')].at(-1)?.getAnimations()[0];
        w.__pendente = Boolean(a) && Number(a!.currentTime ?? 0) < Number(a!.effect?.getTiming().delay ?? 0);
        (document.querySelector('[data-estrada-pausa]') as HTMLButtonElement | null)?.click();
        return document.documentElement.hasAttribute('data-pausado');
      });
    await expect.poll(pausar, { intervals: [20] }).toBe(true);
    const ultimaPendente = await page.evaluate(() => (window as unknown as { __pendente?: boolean }).__pendente);
    expect(ultimaPendente).toBe(true);
    expect(await linhasVisiveis(page)).toBe(6);
    await page.evaluate(() => (document.querySelector('[data-estrada-pausa]') as HTMLButtonElement).click());
    await expect(page.locator('html')).not.toHaveAttribute('data-pausado');
    for (let i = 0; i < 15; i++) {
      expect(await linhasVisiveis(page)).toBe(6);
      await page.waitForTimeout(150);
    }
  });
});

test('as outras páginas não têm o log do topo', async ({ page }) => {
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('.log-janela')).toHaveCount(0);
  await page.goto('/projetos/life-rpg/');
  await expect(page.locator('.log-janela')).toHaveCount(0);
});

for (const modo of ['reduce', 'no-preference'] as const) {
  test.describe(`pausa no TechNews (${modo === 'reduce' ? 'movimento reduzido' : 'movimento permitido'})`, () => {
    test.use({ reducedMotion: modo });

    test('o botão do duto para os pacotes e o cursor piscando, que fica aceso', async ({ page }) => {
      await page.goto('/projetos/technews/');
      const duto = page.locator('[data-estrada]');
      const botao = page.locator('[data-estrada-pausa]');
      const desloc = () => duto.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
      const piscando = () =>
        page.evaluate(
          () =>
            document.getAnimations().filter((a) => {
              const alvo = (a.effect as KeyframeEffect | null)?.target as Element | null;
              return a.playState === 'running' && alvo?.matches('.cursor-bloco, .cursor-rota');
            }).length,
        );
      const cursoresApagados = () =>
        page.locator('.cursor-bloco, .cursor-rota').evaluateAll((cs) => cs.filter((c) => getComputedStyle(c).opacity !== '1').length);
      // Antes da pausa: os pacotes andam e, com movimento, o cursor chega a apagar ao piscar.
      await duto.scrollIntoViewIfNeeded();
      await expect.poll(desloc).not.toBe('');
      const antes = await desloc();
      await expect.poll(desloc, { timeout: 3000 }).not.toBe(antes);
      if (modo === 'no-preference') {
        await expect.poll(piscando, { timeout: 5000 }).toBeGreaterThan(0);
        await expect.poll(cursoresApagados, { timeout: 3000, intervals: [50] }).toBeGreaterThan(0);
      } else expect(await piscando()).toBe(0);

      await botao.click();
      await expect(botao).toHaveAttribute('aria-label', 'Continuar animações');
      const parada = await desloc();
      await page.waitForTimeout(800);
      expect(await desloc()).toBe(parada);
      expect(await piscando()).toBe(0);
      // Aceso em todas as amostras, qualquer que seja a fase em que o piscar congelou.
      for (let i = 0; i < 10; i++) {
        expect(await cursoresApagados()).toBe(0);
        await page.waitForTimeout(120);
      }
      await botao.click();
      await expect.poll(desloc, { timeout: 3000 }).not.toBe(parada);
    });
  });
}

// A rota do TechNews mostra o fluxo inteiro, como foi desenhado: seis etapas com o mesmo peso.
const etapas = {
  pt: ['Fontes', 'Coleta', 'Extração', 'PostgreSQL', 'IA', 'Leitura da manhã'],
  en: ['Sources', 'Collect', 'Extract', 'PostgreSQL', 'AI', 'Morning read'],
} as const;
const linhasDasEtapas = [
  'WARNING | SEM_URL_OU_TITULO | ID = 46012907',
  'INFO | EXTRACAO_OK | ID = 46013377',
  'INFO | RESUMO_INGESTAO | INSERIDAS=… | DUPLICADAS=… | REJEITADAS=…',
];
for (const js of [true, false]) {
  test.describe(`rota do TechNews, ${js ? 'com' : 'sem'} JavaScript`, () => {
    test.use({ javaScriptEnabled: js });
    for (const [caminho, nomes] of [
      ['/projetos/technews/', etapas.pt],
      ['/en/projects/technews/', etapas.en],
    ] as const) {
      test(`${caminho}: seis etapas na ordem, sem marca de estado nem contagem`, async ({ page }) => {
        await page.goto(caminho);
        const placas = page.locator('main [data-rota] .placa');
        await expect(placas.locator('.placa-titulo')).toHaveText([...nomes]);
        await expect(page.locator('main [data-rota] .placa-contagem')).toHaveCount(0);
        await expect(page.locator('main [data-rota]')).not.toContainText(/\b(pronto|planejado|em andamento|done|planned|in progress)\b/i);
        // A janela de cada painel: a linha de log da etapa, ou um comentário com o texto curto quando ela não tem evento.
        const atuais = page.locator('main [data-painel] .execucao-linha--atual');
        await expect(atuais).toHaveCount(6);
        const textos = await atuais.allTextContents();
        expect(textos[1]).toBe(linhasDasEtapas[0]);
        expect(textos[2]).toBe(linhasDasEtapas[1]);
        expect(textos[3]).toBe(linhasDasEtapas[2]);
        for (const i of [0, 4, 5]) expect(textos[i]).toMatch(/^# /);
        expect(await page.locator('main [data-painel]').nth(5).locator('.execucao-linha--atual .log-nivel').count()).toBe(0);
      });
    }
  });
}

test('na janela da etapa ativa aparece a execução até ela', async ({ page }) => {
  await page.goto('/projetos/technews/');
  const rota = page.locator('main [data-rota]');
  await rota.scrollIntoViewIfNeeded();
  // Clica na Extração (etapa 3): o painel dela mostra o comando, o comentário das Fontes, a Coleta e a Extração em destaque.
  await rota.locator('[data-placa-botao]').nth(2).click();
  const painel = rota.locator('[data-painel]').nth(2);
  await expect(painel).toBeVisible();
  const janela = painel.locator('.execucao');
  await expect(janela).toBeVisible();
  await expect(janela.locator('.execucao-linha')).toHaveText([
    '$ python scr/main.py',
    '# Portais e APIs dos temas que eu acompanho.',
    linhasDasEtapas[0],
    linhasDasEtapas[1],
  ]);
  await expect(janela.locator('.execucao-linha--atual')).toHaveText(linhasDasEtapas[1]);
  await expect(janela).not.toContainText('RESUMO_INGESTAO');
  // A IA (etapa 5) não tem evento: a linha dela é o comentário com o texto curto.
  await rota.locator('[data-placa-botao]').nth(4).click();
  await expect(rota.locator('[data-painel]').nth(4).locator('.execucao-linha--atual')).toHaveText('# Filtra, classifica e resume.');
});

test('na home só o cartão do TechNews tem a moldura do terminal, com o cursor e "Etapa n" na rota compacta', async ({ page }) => {
  await page.goto('/');
  const cartao = page.locator('.card--terminal');
  await expect(cartao).toHaveCount(1);
  await expect(cartao.locator('h3')).toHaveText('TechNews');
  await expect(cartao.locator('.rota .placa .km').first()).toHaveText('Etapa 1');
  await expect(cartao.locator('.carro .cursor-rota')).toHaveCount(1);
  await expect(cartao.locator('.carrinho')).toHaveCount(0);
  await cartao.scrollIntoViewIfNeeded();
  expect((await cartao.locator('h3').evaluate((h) => getComputedStyle(h).fontFamily)).split(',')[0]).toMatch(/JetBrains Mono/);
  await expect.poll(() => fonteCarregada(page, 'JetBrains Mono', 700)).toBe(true);
  // A rota grande da home (RodoviariaOS) continua com KM e o carrinho.
  await expect(page.locator('#projetos .rota--vitrine .km').first()).toHaveText('KM 0');
  await expect(page.locator('.card:not(.card--terminal) .cursor-rota')).toHaveCount(0);
});

test('no TechNews as decisões são blocos de terminal e os próximos passos, caixas por fazer', async ({ page }) => {
  await page.goto('/projetos/technews/');
  const decisoes = page.locator('details.decisao');
  expect(await decisoes.count()).toBeGreaterThan(0);
  expect(await decisoes.evaluateAll((ds) => ds.every((d) => d.classList.contains('decisao--terminal')))).toBe(true);
  await decisoes.first().locator('summary').click();
  await expect(decisoes.first().locator('.corpo')).toBeVisible();
  const marca = await page.locator('.proximos li').first().evaluate((li) => getComputedStyle(li, '::before').content);
  expect(marca).toContain('[ ]');
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('details.decisao--terminal')).toHaveCount(0);
});

test('a "Situação atual" fica só no TechNews, entre os detalhes técnicos e os próximos passos, com os números', async ({ page }) => {
  for (const [caminho, titulo] of [
    ['/projetos/technews/', 'Situação atual'],
    ['/en/projects/technews/', 'Where it stands today'],
  ] as const) {
    await page.goto(caminho);
    const secao = page.locator('section[aria-labelledby="situacao"]');
    await expect(secao.locator('h2')).toHaveText(titulo);
    await expect(secao.locator('.numeros dt')).toHaveText(['81', '70', '21', '11']);
    await expect(page.locator('.em-resumo .numeros')).toHaveCount(0);
    const ordem = await page.evaluate(() =>
      ['detalhes', 'situacao', 'proximos'].map((id) => document.getElementById(id)!.getBoundingClientRect().top + window.scrollY),
    );
    expect(ordem[0]).toBeLessThan(ordem[1]);
    expect(ordem[1]).toBeLessThan(ordem[2]);
    // O cabeçalho não tem mais a linha de situação.
    await expect(page.locator('.caso-topo')).not.toContainText(/Hoje ele coleta|Today it collects/);
  }
  for (const caminho of ['/projetos/rodoviariaos/', '/projetos/life-rpg/']) {
    await page.goto(caminho);
    await expect(page.locator('#situacao')).toHaveCount(0);
  }
  // RodoviariaOS e Life RPG continuam com os números onde estavam: os quatro do RodoviariaOS no "Em resumo"; o Life RPG
  // não tem números (nem no "Em resumo", nem numa "Situação atual").
  await page.goto('/projetos/rodoviariaos/');
  await expect(page.locator('.em-resumo .numeros dt')).toHaveCount(4);
  await expect(page.locator('.em-resumo .numeros dt').first()).toBeVisible();
  await page.goto('/projetos/life-rpg/');
  await expect(page.locator('.numeros')).toHaveCount(0);
});
