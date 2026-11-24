import { expect, test, type Page } from '@playwright/test';

async function rolarAteOFim(page: Page, passo = 500, aCada?: () => Promise<void>) {
  for (;;) {
    const fim = await page.evaluate((d) => {
      window.scrollBy(0, d);
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    }, passo);
    await page.waitForTimeout(120);
    if (aCada) await aCada();
    if (fim) break;
  }
}

/** Animações em curso que deslocam algo ou repetem para sempre (proibidas com movimento reduzido). */
function animacoesProibidas(page: Page) {
  return page.evaluate(() => {
    const deslocamento = /^(transform|translate|rotate|scale|backgroundPosition.*|background-position.*)$/;
    const ruins: string[] = [];
    for (const a of document.getAnimations()) {
      const efeito = a.effect as KeyframeEffect | null;
      const alvo = efeito?.target as Element | null;
      const nome = `${alvo?.tagName ?? '?'}.${alvo?.className ?? ''} ${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? ''}`;
      if (efeito?.getTiming().iterations === Infinity) ruins.push(`loop: ${nome}`);
      const props = new Set<string>();
      for (const k of efeito?.getKeyframes() ?? []) Object.keys(k).forEach((p) => props.add(p));
      if ('transitionProperty' in a) props.add((a as CSSTransition).transitionProperty);
      for (const p of props) if (deslocamento.test(p)) ruins.push(`${p}: ${nome}`);
    }
    return ruins;
  });
}

/** Registra, desde o carregamento, cada texto mostrado no primeiro número do hero (em window.__contagem). */
async function registrarContagem(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __contagem: string[] };
    w.__contagem = [];
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.querySelector('[data-contar]');
      if (!el) return;
      w.__contagem.push(el.textContent ?? '');
      new MutationObserver(() => w.__contagem.push(el.textContent ?? '')).observe(el, { childList: true, characterData: true, subtree: true });
    });
  });
}
const textosDaContagem = (page: Page) => page.evaluate(() => (window as unknown as { __contagem: string[] }).__contagem);

/** Fixa a entrada dos números: 'escondidos' segura o início do fade (opacidade 0), 'visiveis' tira a entrada. */
async function entradaDosNumeros(page: Page, estado: 'escondidos' | 'visiveis') {
  // Antes de qualquer script da página: o estilo entra no <html> assim que ele existe.
  await page.addInitScript((e) => {
    const estilo = document.createElement('style');
    estilo.textContent = `[data-hero-prova] { ${e === 'escondidos' ? 'animation-play-state: paused' : 'animation: none'} !important; }`;
    const por = () => document.documentElement.append(estilo);
    if (document.documentElement) por();
    else
      new MutationObserver((_, obs) => {
        if (!document.documentElement) return;
        obs.disconnect();
        por();
      }).observe(document, { childList: true });
  }, estado);
}

const indiceAtivo = (page: Page, seletor: string) =>
  page.locator(seletor).first().locator('.placa').evaluateAll((ps) => ps.findIndex((p) => p.hasAttribute('data-ativa')));

/** Índice do único painel da vitrine que está à vista (-1 se nenhum ou mais de um). */
const painelVisivel = (page: Page, seletor: string) =>
  page
    .locator(seletor)
    .first()
    .locator('[data-painel]')
    .evaluateAll((ps) => {
      const vistos = ps.flatMap((p, i) => (getComputedStyle(p).visibility === 'visible' && !(p as HTMLElement).inert ? [i] : []));
      return vistos.length === 1 ? vistos[0] : -1;
    });

test.describe('com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const caminho of ['/', '/projetos/rodoviariaos/', '/projetos/life-rpg/', '/projetos/technews/']) {
    test(`${caminho}: nada desliza e nada fica em loop`, async ({ page }) => {
      await page.goto(caminho);
      const ruins = new Set<string>();
      const juntar = async () => (await animacoesProibidas(page)).forEach((r) => ruins.add(r));
      await juntar();
      await rolarAteOFim(page, 400, juntar);
      expect([...ruins]).toEqual([]);
    });
  }

  // Exceção escolhida à regra dos dois modos: a rua corre devagar (as duas variantes), sem o carro sair do lugar.
  for (const caminho of ['/', '/projetos/rodoviariaos/']) {
    test(`${caminho}: a rua da estrada corre devagar`, async ({ page }) => {
      await page.goto(caminho);
      const estrada = page.locator('[data-estrada]').first();
      await estrada.scrollIntoViewIfNeeded();
      const desloc = () => estrada.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
      await expect.poll(desloc).not.toBe('');
      const antes = await desloc();
      await expect.poll(desloc, { timeout: 3000 }).not.toBe(antes);
    });
  }

  test('o carro da rota grande anda de placa em placa', async ({ page }) => {
    await page.goto('/');
    const rota = page.locator('#projetos [data-rota][data-modo="loop"]');
    test.setTimeout(90_000);
    await rota.scrollIntoViewIfNeeded();
    // Observa a cada quadro, dentro da página, até ver a sequência inteira: o carro parado sob uma placa,
    // depois andando, depois parado sob OUTRA placa. Só a entrada do carro na pista não basta.
    const visto = await rota.evaluate(
      (el) =>
        new Promise<{ paradas: number[]; andouEntreElas: boolean }>((resolve) => {
          const r = el as HTMLElement;
          const ativa = () => [...r.querySelectorAll('.placa')].findIndex((p) => p.hasAttribute('data-ativa'));
          const paradas: number[] = [];
          let andouDepoisDaPrimeira = false;
          const limite = performance.now() + 60_000;
          const olhar = () => {
            const andando = r.hasAttribute('data-andando');
            const i = ativa();
            if (!andando && i >= 0 && paradas[paradas.length - 1] !== i) paradas.push(i);
            if (andando && paradas.length >= 1) andouDepoisDaPrimeira = true;
            if (paradas.length >= 2 || performance.now() > limite) resolve({ paradas, andouEntreElas: andouDepoisDaPrimeira });
            else requestAnimationFrame(olhar);
          };
          requestAnimationFrame(olhar);
        }),
    );
    expect(visto.paradas.length).toBeGreaterThanOrEqual(2);
    expect(visto.paradas[1]).not.toBe(visto.paradas[0]);
    expect(visto.andouEntreElas).toBe(true);
  });

  test('o conteúdo entra com fade ao rolar e nada fica escondido', async ({ page }) => {
    await page.goto('/');
    const alvo = page.locator('#ferr-titulo');
    const estilo = () => alvo.evaluate((el) => ({ opacity: getComputedStyle(el).opacity, translate: getComputedStyle(el).translate }));
    expect(await estilo()).toEqual({ opacity: '0', translate: 'none' });
    await alvo.scrollIntoViewIfNeeded();
    await expect.poll(async () => (await estilo()).opacity).toBe('1');
    await rolarAteOFim(page);
    await expect
      .poll(() => page.$$eval('.revelar', (els) => els.filter((e) => getComputedStyle(e).opacity !== '1').length))
      .toBe(0);
  });

  test('a rota grande troca a parada sozinha, a pausa segura, a placa leva à parada e nenhum vídeo toca', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    const seletor = '#projetos [data-rota][data-modo="loop"]';
    const rota = page.locator(seletor);
    await rota.scrollIntoViewIfNeeded();
    const inicial = await indiceAtivo(page, seletor);
    // 4 s por parada: a troca chega em menos de 8 s.
    await expect.poll(() => indiceAtivo(page, seletor), { timeout: 8_000 }).not.toBe(inicial);
    expect(await painelVisivel(page, seletor)).toBe(await indiceAtivo(page, seletor));
    const pausa = rota.locator('[data-rota-pausa]');
    await pausa.click();
    await expect(pausa).toHaveText('Continuar');
    const pausado = await indiceAtivo(page, seletor);
    // Mais que uma parada inteira (4 s): sem a pausa, teria trocado.
    await page.waitForTimeout(6000);
    expect(await indiceAtivo(page, seletor)).toBe(pausado);
    // O clique com a rota rodando também pausa: retoma, e então clica na placa.
    await pausa.click();
    await expect(pausa).toHaveText('Pausar');
    await rota.locator('[data-placa-botao]').nth(3).click();
    await expect(pausa).toHaveText('Continuar');
    await expect(rota.locator('.placa').nth(3)).toHaveAttribute('data-ativa', '');
    await expect.poll(() => painelVisivel(page, seletor)).toBe(3);
    await rota.locator('[data-placa-botao]').nth(5).click();
    await expect.poll(() => painelVisivel(page, seletor)).toBe(5);
    await page.waitForTimeout(800);
    expect(await page.$$eval('video', (vs) => vs.filter((v) => !(v as HTMLVideoElement).paused).length)).toBe(0);
  });

  test('o vídeo que a pessoa iniciou continua tocando ao a rota sair e voltar à tela', async ({ page }) => {
    await page.goto('/');
    const rota = page.locator('#projetos [data-rota][data-modo="loop"]');
    await rota.scrollIntoViewIfNeeded();
    const video = rota.locator('[data-painel]').first().locator('video');
    await page.waitForTimeout(500);
    expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
    await video.evaluate((v) => (v as HTMLVideoElement).play()); // a pessoa dá play
    await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await rota.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(false);
  });

  test('no estudo de caso o KM em destaque acompanha a rolagem', async ({ page }) => {
    await page.goto('/projetos/rodoviariaos/');
    const rota = page.locator('[data-rota][data-modo="rolagem"]');
    await expect(rota).toHaveAttribute('data-estatico', '');
    const primeiro = rota.locator('.rota-detalhe-texto').first();
    await primeiro.scrollIntoViewIfNeeded();
    await expect(primeiro).toBeVisible();
    const terceira = rota.locator('.placa').nth(2);
    await terceira.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await expect(terceira).toHaveAttribute('data-ativa', '');
    await expect(rota.locator('.placa').first()).not.toHaveAttribute('data-ativa', '');
  });

  test('nenhum vídeo toca sozinho', async ({ page }) => {
    await page.goto('/projetos/rodoviariaos/');
    const videos = page.locator('video[data-video]');
    expect(await videos.count()).toBeGreaterThan(0);
    await videos.first().scrollIntoViewIfNeeded();
    // pausa curta: a decisão de tocar vem de um callback do IntersectionObserver; ler antes não provaria nada
    await page.waitForTimeout(800);
    const tocando = await page.$$eval('video', (vs) => vs.filter((v) => !(v as HTMLVideoElement).paused).length);
    expect(tocando).toBe(0);
  });

  test('os números do hero contam até o valor final', async ({ page }) => {
    await entradaDosNumeros(page, 'escondidos');
    await registrarContagem(page);
    await page.goto('/');
    await expect
      .poll(async () => {
        const textos = await textosDaContagem(page);
        return textos.length > 1 && textos[textos.length - 1] === '~1.000';
      }, { timeout: 8000 })
      .toBe(true);
    expect(new Set(await textosDaContagem(page)).size).toBeGreaterThan(3);
    // O segundo número termina a contagem um pouco depois do primeiro: espera, em vez de ler uma vez só.
    await expect(page.locator('[data-contar]').nth(1)).toHaveText('~11.000', { timeout: 8000 });
  });

  test('os números do hero não contam se já estão à vista quando o script começa', async ({ page }) => {
    await entradaDosNumeros(page, 'visiveis');
    await registrarContagem(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2500);
    expect(await textosDaContagem(page)).toEqual(['~1.000']);
  });
});

test.describe('com movimento permitido', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('o carro percorre a rota compacta inteira e todas as placas acendem', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    const rota = page.locator('[data-rota].rota--compacta').first();
    await rota.scrollIntoViewIfNeeded();
    await expect(rota).not.toHaveAttribute('data-estatico');
    // Observa a cada quadro, dentro da página, até ver o carro antes da entrada, depois da saída e todas as placas acesas.
    const visto = await rota.evaluate(
      (el) =>
        new Promise<{ min: number; max: number; acesas: number; total: number }>((resolve) => {
          const r = el as HTMLElement;
          const placas = [...r.querySelectorAll('.placa')];
          let min = Infinity;
          let max = -Infinity;
          const acesas = new Set<number>();
          const limite = performance.now() + 40_000;
          const olhar = () => {
            const pos = Number(r.style.getPropertyValue('--pos'));
            min = Math.min(min, pos);
            max = Math.max(max, pos);
            placas.forEach((p, i) => p.hasAttribute('data-ativa') && acesas.add(i));
            const completo = min < 0 && max > 1 && acesas.size === placas.length;
            if (!completo && performance.now() < limite) requestAnimationFrame(olhar);
            else resolve({ min, max, acesas: acesas.size, total: placas.length });
          };
          requestAnimationFrame(olhar);
        }),
    );
    expect(visto.total).toBeGreaterThan(1);
    expect(visto.min).toBeLessThan(0);
    expect(visto.max).toBeGreaterThan(1);
    expect(visto.acesas).toBe(visto.total);
  });

  test('o botão de pausa para tudo e troca o texto', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    const rota = page.locator('#projetos [data-rota][data-modo="loop"]');
    await rota.scrollIntoViewIfNeeded();
    const pos = () => rota.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));
    const rodando = () =>
      rota.evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.playState === 'running')
          .map((a) => (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty),
      );
    const pausa = rota.locator('[data-rota-pausa]');
    await expect(pausa).toHaveText('Pausar');
    // O caso difícil: pausar com o carro andando entre duas placas.
    await expect(rota).toHaveAttribute('data-andando', '', { timeout: 25_000 });
    await pausa.click();
    await expect(pausa).toHaveText('Continuar');
    await expect(rota).not.toHaveAttribute('data-andando');
    await expect.poll(rodando, { timeout: 3000 }).toEqual([]);
    const parado = await pos();
    await page.waitForTimeout(1500);
    expect(await pos()).toBe(parado);
    expect(await rodando()).toEqual([]);
    await expect(rota).not.toHaveAttribute('data-andando');
    await pausa.click();
    await expect(pausa).toHaveText('Pausar');
    // Se a pausa pegou o carro já chegando a uma placa, ele ainda fica até 4 s parado nela antes de seguir.
    await expect.poll(pos, { timeout: 25_000 }).not.toBe(parado);
  });

  test.describe('rota grande da home', () => {
    const seletor = '#projetos [data-rota][data-modo="loop"]';

    test('troca sozinha de parada e mostra o painel dela', async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto('/');
      await page.locator(seletor).scrollIntoViewIfNeeded();
      // No começo o carro ainda entra (nenhuma placa acesa ou a primeira); o painel à vista é o da primeira parada.
      expect([-1, 0]).toContain(await indiceAtivo(page, seletor));
      expect(await painelVisivel(page, seletor)).toBe(0);
      await expect.poll(() => indiceAtivo(page, seletor), { timeout: 8_000 }).toBe(1);
      await expect.poll(() => painelVisivel(page, seletor)).toBe(1);
    });

    test('a placa clicada mostra o painel dela, pausa e o carro para sob ela, sem mudar a altura', async ({ page }) => {
      await page.goto('/');
      const rota = page.locator(seletor);
      await rota.scrollIntoViewIfNeeded();
      const altura = () => rota.evaluate((el) => Math.round(el.getBoundingClientRect().height));
      const antes = await altura();
      await rota.locator('[data-placa-botao]').nth(3).click();
      await expect.poll(() => painelVisivel(page, seletor)).toBe(3);
      await expect(rota.locator('[data-placa-botao]').nth(3)).toHaveAttribute('aria-current', 'step');
      await expect(rota.locator('[data-rota-pausa]')).toHaveText('Continuar');
      await expect(rota).not.toHaveAttribute('data-andando', '', { timeout: 2000 });
      const [carro, placa] = await Promise.all([rota.locator('.carro').boundingBox(), rota.locator('.placa').nth(3).boundingBox()]);
      const centro = carro!.x + carro!.width / 2;
      expect(centro).toBeGreaterThan(placa!.x);
      expect(centro).toBeLessThan(placa!.x + placa!.width);
      await page.waitForTimeout(1500);
      expect(await indiceAtivo(page, seletor)).toBe(3);
      expect(await altura()).toBe(antes);
    });

    test('o vídeo da parada ativa tem controles e está tocando', async ({ page }) => {
      await page.goto('/');
      const rota = page.locator(seletor);
      await rota.scrollIntoViewIfNeeded();
      const video = rota.locator('[data-painel]').first().locator('video');
      await expect(video).toHaveJSProperty('controls', true);
      await expect.poll(() => video.evaluate((v) => !(v as HTMLVideoElement).paused), { timeout: 5000 }).toBe(true);
      // Os vídeos das outras paradas ficam parados.
      expect(await rota.locator('[data-painel]:not([data-ativa]) video').evaluateAll((vs) => vs.filter((v) => !(v as HTMLVideoElement).paused).length)).toBe(0);
    });

    test('com o carro fora da rota, a placa do painel à mostra continua com aria-current', async ({ page }) => {
      await page.goto('/');
      const rota = page.locator(seletor);
      // Antes de a rota aparecer o carro está fora (antes da entrada); depois, observa cada quadro durante a entrada.
      const ativas = () => rota.locator('[data-placa-botao][aria-current="step"]').count();
      expect(await ativas()).toBe(1);
      await rota.scrollIntoViewIfNeeded();
      const falhas = await rota.evaluate(
        (el) =>
          new Promise<string[]>((resolve) => {
            const ruins: string[] = [];
            const fim = performance.now() + 1500;
            const olhar = () => {
              const botoes = [...el.querySelectorAll('[data-placa-botao]')];
              const atual = botoes.flatMap((b, i) => (b.getAttribute('aria-current') === 'step' ? [i] : []));
              const lit = [...el.querySelectorAll('.placa')].flatMap((p, i) => (p.hasAttribute('data-ativa') ? [i] : []));
              const painel = [...el.querySelectorAll('[data-painel]')].findIndex((p) => p.hasAttribute('data-ativa'));
              if (atual.length !== 1 || atual[0] !== painel || lit.length !== 1 || lit[0] !== painel) ruins.push(`u=${el.style.getPropertyValue('--pos')} atual=${atual} acesa=${lit} painel=${painel}`);
              if (performance.now() < fim) requestAnimationFrame(olhar);
              else resolve(ruins);
            };
            requestAnimationFrame(olhar);
          }),
      );
      expect(falhas).toEqual([]);
    });

    test('o vídeo que a pessoa pausou continua pausado ao a rota sair e voltar à tela', async ({ page }) => {
      await page.goto('/');
      const rota = page.locator(seletor);
      await rota.scrollIntoViewIfNeeded();
      const video = rota.locator('[data-painel]').first().locator('video');
      await expect.poll(() => video.evaluate((v) => !(v as HTMLVideoElement).paused), { timeout: 5000 }).toBe(true);
      await video.evaluate((v) => (v as HTMLVideoElement).pause()); // a pessoa pausa
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await rota.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      expect(await video.evaluate((v) => (v as HTMLVideoElement).paused)).toBe(true);
    });

    test('o ponteiro na vitrine com o carro a caminho: ele chega à placa e não sai dela', async ({ page }) => {
      test.setTimeout(90_000);
      await page.goto('/');
      const rota = page.locator(seletor);
      await rota.scrollIntoViewIfNeeded();
      const andando = () => rota.evaluate((el) => el.hasAttribute('data-andando'));
      // Espera a entrada acabar, o carro parar na primeira placa e sair para o próximo trecho.
      await expect.poll(andando, { timeout: 8_000 }).toBe(false);
      await expect.poll(andando, { timeout: 8_000 }).toBe(true);
      const caixa = (await rota.locator('.vitrine').boundingBox())!;
      await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
      await expect.poll(andando, { timeout: 5000 }).toBe(false);
      const parada = await indiceAtivo(page, seletor);
      expect(parada).toBeGreaterThanOrEqual(0);
      // Mais que uma parada inteira (4 s): sem o ponteiro, teria saído.
      await page.waitForTimeout(6000);
      expect(await indiceAtivo(page, seletor)).toBe(parada);
      expect(await painelVisivel(page, seletor)).toBe(parada);
      expect(await andando()).toBe(false);
    });

    test('Continuar pelo teclado: o foco fica no botão e a rota volta a avançar', async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto('/');
      const rota = page.locator(seletor);
      await rota.scrollIntoViewIfNeeded();
      const pausa = rota.locator('[data-rota-pausa]');
      // Clicar numa placa pausa a rota numa parada firme (sem o carro entrando).
      await rota.locator('[data-placa-botao]').nth(2).click();
      await expect(pausa).toHaveText('Continuar');
      await expect.poll(() => indiceAtivo(page, seletor)).toBe(2);
      // Uma tecla antes, para o foco por script contar como foco de teclado (:focus-visible), como no Tab.
      await page.keyboard.press('Shift');
      await pausa.focus();
      expect(await pausa.evaluate((el) => el.matches(':focus-visible'))).toBe(true);
      await page.keyboard.press('Enter');
      await expect(pausa).toHaveText('Pausar');
      await expect(pausa).toBeFocused();
      await expect.poll(() => indiceAtivo(page, seletor), { timeout: 25_000 }).not.toBe(2);
      await expect(pausa).toBeFocused();
    });

    test('a dica de que dá para escolher a parada aparece ao lado do título', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator(`${seletor} .rota-dica`)).toHaveText('Escolha uma parada');
    });
  });

  test('os números do hero contam até o valor final', async ({ page }) => {
    // O caso normal: o script começa antes de os números aparecerem. Sob carga, o script pode chegar depois
    // da entrada; aí ele não conta (teste seguinte), então a entrada fica segurada aqui para o teste não depender da máquina.
    await entradaDosNumeros(page, 'escondidos');
    await registrarContagem(page);
    await page.goto('/');
    // Espera a contagem terminar: o último texto registrado é o final, depois de ter passado por outros.
    await expect
      .poll(async () => {
        const textos = await textosDaContagem(page);
        return textos.length > 1 && textos[textos.length - 1] === '~1.000';
      }, { timeout: 8000 })
      .toBe(true);
    expect(new Set(await textosDaContagem(page)).size).toBeGreaterThan(3);
  });

  test('os números do hero não contam se já estão à vista quando o script começa', async ({ page }) => {
    await entradaDosNumeros(page, 'visiveis');
    await registrarContagem(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2500);
    expect(await textosDaContagem(page)).toEqual(['~1.000']);
  });

  test('na estrada do hero a rua corre e o carro fica no lugar, mesmo rolando', async ({ page }) => {
    await page.goto('/');
    const estrada = page.locator('[data-estrada]').first();
    await estrada.scrollIntoViewIfNeeded();
    const desloc = () => estrada.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
    // Posição do carro dentro da estrada (descontando a rolagem).
    const carro = () =>
      estrada.evaluate((el) => {
        const e = el.getBoundingClientRect();
        const c = el.querySelector('.estrada-carro')!.getBoundingClientRect();
        return Math.round(c.left - e.left);
      });
    await expect.poll(desloc).not.toBe('');
    const antes = await desloc();
    await expect.poll(desloc, { timeout: 3000 }).not.toBe(antes);
    const posicao = await carro();
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(400);
    const depois = await desloc();
    await page.waitForTimeout(300);
    expect(await desloc()).not.toBe(depois);
    expect(await carro()).toBe(posicao);
  });
});

// Uma pausa só para a página: o botão da estrada do topo e o da rota grande mostram e mudam o mesmo estado.
for (const modo of ['reduce', 'no-preference'] as const) {
  test.describe(`pausa da página (${modo === 'reduce' ? 'movimento reduzido' : 'movimento permitido'})`, () => {
    test.use({ reducedMotion: modo });

    const desloc = (page: Page) => page.locator('[data-estrada]').first().evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
    const seletorRota = '#projetos [data-rota][data-modo="loop"]';
    const pos = (page: Page) => page.locator(seletorRota).evaluate((el) => (el as HTMLElement).style.getPropertyValue('--pos'));

    test('o botão da estrada para a rua e o carro da rota; Continuar na rota retoma os dois', async ({ page }) => {
      test.setTimeout(90_000);
      await page.goto('/');
      const estrada = page.locator('[data-estrada]').first();
      const botaoEstrada = page.locator('[data-estrada-pausa]');
      const rota = page.locator(seletorRota);
      const botaoRota = rota.locator('[data-rota-pausa]');
      await estrada.scrollIntoViewIfNeeded();
      await expect(botaoEstrada).toHaveAttribute('aria-label', 'Pausar animações');
      await expect.poll(() => desloc(page)).not.toBe('');
      // A rota precisa estar rodando de verdade antes da pausa: sem isso, "o carro parou" não provaria nada.
      await rota.scrollIntoViewIfNeeded();
      await expect(rota).toHaveAttribute('data-andando', '', { timeout: 25_000 });
      // O botão da estrada ficou fora da tela: o clique vai por script.
      await botaoEstrada.evaluate((b) => (b as HTMLButtonElement).click());
      await expect(botaoEstrada).toHaveAttribute('aria-label', 'Continuar animações');
      await expect(rota).not.toHaveAttribute('data-andando');
      const carroNaPausa = await pos(page);
      await page.waitForTimeout(1500);
      expect(await pos(page)).toBe(carroNaPausa);
      // De volta ao topo, com a estrada à vista: a rua continua parada.
      await estrada.scrollIntoViewIfNeeded();
      const rua = await desloc(page);
      await page.waitForTimeout(1500);
      expect(await desloc(page)).toBe(rua);
      // A pausa vale para a página: os loops feitos em CSS (selo piscando, print flutuando, halo) também param.
      const loopsRodando = () =>
        page.evaluate(
          () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length,
        );
      expect(await loopsRodando()).toBe(0);

      await rota.scrollIntoViewIfNeeded();
      await expect(botaoRota).toHaveText('Continuar');
      const carro = await pos(page);
      await page.waitForTimeout(1500);
      expect(await pos(page)).toBe(carro);
      await expect(rota).not.toHaveAttribute('data-andando');

      await botaoRota.click();
      await expect(botaoRota).toHaveText('Pausar');
      await expect.poll(() => pos(page), { timeout: 25_000 }).not.toBe(carro);
      await estrada.scrollIntoViewIfNeeded();
      await expect(botaoEstrada).toHaveAttribute('aria-label', 'Pausar animações');
      const rua2 = await desloc(page);
      await expect.poll(() => desloc(page), { timeout: 3000 }).not.toBe(rua2);
    });

    test('depois de ir a um estudo de caso e voltar pelo site, a página começa rodando', async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto('/');
      const botaoEstrada = page.locator('[data-estrada-pausa]');
      await botaoEstrada.click();
      await expect(botaoEstrada).toHaveAttribute('aria-label', 'Continuar animações');
      await page.evaluate(() => {
        (window as unknown as { __marca: number }).__marca = 1;
      });
      await page.locator('#projetos').getByRole('link', { name: /ver estudo de caso/i }).click();
      await expect(page).toHaveURL(/\/projetos\/rodoviariaos\/$/);
      // A estrada do estudo de caso não tem botão e corre: a pausa da home não veio junto.
      await page.locator('[data-estrada]').first().scrollIntoViewIfNeeded();
      await expect.poll(() => desloc(page)).not.toBe('');
      const ruaCaso = await desloc(page);
      await expect.poll(() => desloc(page), { timeout: 3000 }).not.toBe(ruaCaso);

      await page.locator('.nav-logo').click();
      await expect(page).toHaveURL(/\/$/);
      expect(await page.evaluate(() => (window as unknown as { __marca?: number }).__marca)).toBe(1);
      await expect(botaoEstrada).toHaveAttribute('aria-label', 'Pausar animações');
      await expect(page.locator(`${seletorRota} [data-rota-pausa]`)).toHaveText('Pausar');
      await expect(page.locator(seletorRota)).not.toHaveAttribute('data-pausada');
      await page.locator('[data-estrada]').first().scrollIntoViewIfNeeded();
      await expect.poll(() => desloc(page)).not.toBe('');
      const rua = await desloc(page);
      await expect.poll(() => desloc(page), { timeout: 3000 }).not.toBe(rua);
    });
  });
}

// A rota grande da home mostra logo que anda: com a seção à vista, o carro chega à primeira placa em cerca de 1 s e parte
// para a segunda em cerca de 5 s (4 s por parada), nos dois modos de movimento.
for (const modo of ['reduce', 'no-preference'] as const) {
  test(`rota grande da home: primeira placa em ~1 s e saída para a segunda em ~5 s (${modo})`, async ({ page }) => {
    test.setTimeout(30_000);
    await page.emulateMedia({ reducedMotion: modo });
    await page.goto('/');
    const rota = page.locator('#projetos [data-rota][data-modo="loop"]');
    await rota.evaluate((el) => {
      const w = window as unknown as { __marcas: Array<[number, boolean]> };
      w.__marcas = [];
      el.scrollIntoView({ block: 'center' });
      const t0 = performance.now();
      new MutationObserver(() => w.__marcas.push([performance.now() - t0, el.hasAttribute('data-andando')])).observe(el, { attributes: true, attributeFilter: ['data-andando'] });
    });
    // Espera a saída da primeira placa (segunda vez que fica "andando").
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __marcas: Array<[number, boolean]> }).__marcas.filter(([, a]) => !a).length), { timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __marcas: Array<[number, boolean]> }).__marcas.filter(([, a]) => a).length), { timeout: 10_000 })
      .toBeGreaterThan(1);
    const marcas = await page.evaluate(() => (window as unknown as { __marcas: Array<[number, boolean]> }).__marcas);
    const chegou = marcas.find(([, a]) => !a)![0];
    const saiu = marcas.filter(([, a]) => a).find(([t]) => t > chegou)![0];
    expect(chegou).toBeLessThan(2000);
    expect(saiu).toBeGreaterThan(4300);
    expect(saiu).toBeLessThan(6500);
  });
}
