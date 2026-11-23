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

const indiceAtivo = (page: Page, seletor: string) =>
  page.locator(seletor).first().locator('.placa').evaluateAll((ps) => ps.findIndex((p) => p.hasAttribute('data-ativa')));

test.describe('com movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const caminho of ['/', '/projetos/rodoviariaos/']) {
    test(`${caminho}: nada desliza e nada fica em loop`, async ({ page }) => {
      await page.goto(caminho);
      const ruins = new Set<string>();
      const juntar = async () => (await animacoesProibidas(page)).forEach((r) => ruins.add(r));
      await juntar();
      await rolarAteOFim(page, 400, juntar);
      expect([...ruins]).toEqual([]);
    });
  }

  test('a estrada fica parada', async ({ page }) => {
    await page.goto('/');
    const estrada = page.locator('[data-estrada]').first();
    await estrada.scrollIntoViewIfNeeded();
    const desloc = () => estrada.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
    const antes = await desloc();
    await page.waitForTimeout(1000);
    expect(await desloc()).toBe(antes);
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

  test('a rota em loop troca o KM em destaque sozinha e o botão de pausa segura a troca', async ({ page }) => {
    await page.goto('/');
    const seletor = '#projetos [data-rota][data-modo="loop"]';
    await page.locator(seletor).scrollIntoViewIfNeeded();
    const inicial = await indiceAtivo(page, seletor);
    await expect.poll(() => indiceAtivo(page, seletor), { timeout: 8000 }).not.toBe(inicial);
    const pausa = page.locator(`${seletor} [data-rota-pausa]`);
    await pausa.click();
    await expect(pausa).toHaveText('Continuar');
    const pausado = await indiceAtivo(page, seletor);
    await page.waitForTimeout(3500);
    expect(await indiceAtivo(page, seletor)).toBe(pausado);
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

  test('os números do hero já estão no valor final', async ({ page }) => {
    await registrarContagem(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    // Dá tempo de sobra para uma contagem (atraso + 1,6 s) acontecer, se fosse acontecer.
    await page.waitForTimeout(2500);
    expect(await textosDaContagem(page)).toEqual(['~1.000']);
    expect(await page.locator('[data-contar]').nth(1).textContent()).toBe('1.400+');
  });
});

test.describe('com movimento permitido', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('o carro percorre a rota inteira e todas as placas acendem', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/');
    const rota = page.locator('#projetos [data-rota][data-modo="loop"]');
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
    await expect(rota).toHaveAttribute('data-andando', '', { timeout: 10_000 });
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
    await expect.poll(pos, { timeout: 5000 }).not.toBe(parado);
  });

  test('os números do hero contam até o valor final', async ({ page }) => {
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

  test('a estrada do hero anda', async ({ page }) => {
    await page.goto('/');
    const estrada = page.locator('[data-estrada]').first();
    await estrada.scrollIntoViewIfNeeded();
    const desloc = () => estrada.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--desloc'));
    await expect.poll(desloc).not.toBe('');
    const antes = await desloc();
    await expect.poll(desloc, { timeout: 3000 }).not.toBe(antes);
  });
});
