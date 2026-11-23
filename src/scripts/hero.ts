import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { valorDaContagem } from './contagem';

gsap.registerPlugin(SplitText);

const CONTAGEM_MS = 1600;
/** A contagem começa quando os números terminam de entrar (atraso da entrada por CSS, ver Hero.astro). */
const CONTAGEM_ATRASO_MS = 450;
const INCLINACAO_MAX = 6;

/**
 * Cada número do hero conta de 0 até o valor final. O leitor de tela lê só o valor final (span.sr-only).
 * O servidor já entrega o valor final: se o script roda tarde e os números já estão à vista, não conta
 * (senão a pessoa veria valor final, 0 e a contagem).
 */
function contarNumeros(): () => void {
  const item = document.querySelector<HTMLElement>('[data-hero-prova]');
  if (item && Number(getComputedStyle(item).opacity) >= 0.5) return () => {};
  const alvos = [...document.querySelectorAll<HTMLElement>('[data-contar]')].map((el) => ({
    el,
    alvo: Number(el.dataset.contar),
    formato: new Intl.NumberFormat(el.dataset.locale),
    prefixo: el.dataset.prefixo ?? '',
    sufixo: el.dataset.sufixo ?? '',
  }));
  if (alvos.length === 0) return () => {};
  const mostrar = (p: number) => {
    for (const a of alvos) a.el.textContent = a.prefixo + a.formato.format(valorDaContagem(p, a.alvo)) + a.sufixo;
  };
  mostrar(0);
  let inicio = 0;
  let raf = 0;
  const passo = (agora: number) => {
    inicio ||= agora;
    const p = (agora - inicio - CONTAGEM_ATRASO_MS) / CONTAGEM_MS;
    mostrar(p);
    raf = p < 1 ? requestAnimationFrame(passo) : 0;
  };
  raf = requestAnimationFrame(passo);
  return () => {
    cancelAnimationFrame(raf);
    mostrar(1);
  };
}

/** O print inclina seguindo o ponteiro sobre o hero (só com mouse). */
function inclinarPrint(hero: HTMLElement, print: HTMLElement): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  gsap.set(print, { transformPerspective: 900 });
  const rx = gsap.quickTo(print, 'rotationX', { duration: 0.6, ease: 'power3.out' });
  const ry = gsap.quickTo(print, 'rotationY', { duration: 0.6, ease: 'power3.out' });
  const mover = (ev: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5;
    const y = (ev.clientY - r.top) / r.height - 0.5;
    ry(x * 2 * INCLINACAO_MAX);
    rx(-y * 2 * INCLINACAO_MAX);
  };
  const sair = () => {
    rx(0);
    ry(0);
  };
  hero.addEventListener('pointermove', mover);
  hero.addEventListener('pointerleave', sair);
  return () => {
    hero.removeEventListener('pointermove', mover);
    hero.removeEventListener('pointerleave', sair);
  };
}

aoCarregarPagina(() => {
  const titulo = document.querySelector<HTMLElement>('[data-hero-titulo]');
  if (!titulo) return;
  const mostrar = () => {
    titulo.style.visibility = 'visible';
  };
  // Com movimento reduzido os blocos entram só com fade (CSS, [data-entrada]) e o título aparece direto.
  if (movimentoReduzido()) {
    mostrar();
    return;
  }
  // Rede de segurança: se a divisão do texto demorar ou falhar, o título aparece mesmo assim.
  const seguranca = window.setTimeout(mostrar, 1500);
  const hero = titulo.closest<HTMLElement>('.hero');
  const print = document.querySelector<HTMLElement>('[data-hero-print]');
  const limpezas: Array<() => void> = [() => window.clearTimeout(seguranca)];
  try {
    const ctx = gsap.context(() => {
      SplitText.create(titulo, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (s) => {
          mostrar();
          return gsap.from(s.lines, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.1 });
        },
      });
      // A entrada do print é CSS (Hero.astro); aqui fica só a inclinação pelo ponteiro.
      if (print && hero) limpezas.push(inclinarPrint(hero, print));
    });
    limpezas.push(() => ctx.revert());
  } catch {
    mostrar();
  }
  limpezas.push(contarNumeros());
  return () => limpezas.forEach((f) => f());
});
