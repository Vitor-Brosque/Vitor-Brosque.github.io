import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { estadoDaRota, type EstadoRota } from './rota-estado';

gsap.registerPlugin(ScrollTrigger);

function aplicar(raiz: HTMLElement, placas: HTMLElement[], estado: EstadoRota) {
  raiz.style.setProperty('--pos', estado.posicao.toFixed(4));
  placas.forEach((p, i) => p.toggleAttribute('data-ativa', i === estado.ativa));
}

function iniciarLoop(raiz: HTMLElement, placas: HTMLElement[]): () => void {
  const n = placas.length;
  const duracao = n * 2200;
  let inicio = performance.now();
  let raf = 0;
  const passo = (agora: number) => {
    aplicar(raiz, placas, estadoDaRota(((agora - inicio) % duracao) / duracao, n));
    raf = requestAnimationFrame(passo);
  };
  const obs = new IntersectionObserver(([entrada]) => {
    if (entrada.isIntersecting && !raf) {
      inicio = performance.now();
      raf = requestAnimationFrame(passo);
    } else if (!entrada.isIntersecting && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  obs.observe(raiz);
  aplicar(raiz, placas, estadoDaRota(0, n));
  return () => {
    obs.disconnect();
    cancelAnimationFrame(raf);
  };
}

function iniciarRolagem(raiz: HTMLElement, placas: HTMLElement[]): () => void {
  const n = placas.length;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    ScrollTrigger.create({
      trigger: raiz,
      pin: true,
      start: 'top top+=80',
      end: () => `+=${Math.round(n * window.innerHeight * 0.6)}`,
      scrub: 0.4,
      onUpdate: (st) => aplicar(raiz, placas, estadoDaRota(st.progress, n)),
    });
  });
  mm.add('(max-width: 899px)', () => {
    ScrollTrigger.create({
      trigger: raiz,
      start: 'top 60%',
      end: 'bottom 60%',
      scrub: 0.3,
      onUpdate: (st) => aplicar(raiz, placas, estadoDaRota(st.progress, n)),
    });
  });
  aplicar(raiz, placas, estadoDaRota(0, n));
  return () => mm.revert();
}

aoCarregarPagina(() => {
  const rotas = [...document.querySelectorAll<HTMLElement>('[data-rota]')];
  if (rotas.length === 0) return;
  const reduzido = movimentoReduzido();
  const limpezas: Array<() => void> = [];
  for (const raiz of rotas) {
    const placas = [...raiz.querySelectorAll<HTMLElement>('.placa')];
    if (reduzido) {
      raiz.setAttribute('data-estatico', '');
      continue;
    }
    limpezas.push(raiz.dataset.modo === 'loop' ? iniciarLoop(raiz, placas) : iniciarRolagem(raiz, placas));
  }
  return () => limpezas.forEach((f) => f());
});
