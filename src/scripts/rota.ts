import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { estadoDaRolagem, estadoDoLoop, fracaoDoCarro, unidadesDoLoop, type EstadoRota } from './rota-estado';

gsap.registerPlugin(ScrollTrigger);

/** Duração de uma unidade do loop (parada numa placa), em ms. */
const UNIDADE_MS = 1500;
/** Com movimento reduzido, a placa acesa avança a cada tanto, sem o carro andar. */
const TROCA_MS = 2600;
const FADE_CARRO_MS = 220;

interface Medida {
  centros: number[];
  margem: number;
}

/** Uma rota na página: mede as placas sobre o asfalto e aplica um estado. */
class Rota {
  readonly placas: HTMLElement[];
  private medida: Medida = { centros: [], margem: 0 };
  private ultimo: EstadoRota | null = null;
  private readonly obsTamanho: ResizeObserver | null;
  private vivo = true;

  constructor(readonly raiz: HTMLElement) {
    this.placas = [...raiz.querySelectorAll<HTMLElement>('.placa')];
    this.medir();
    this.obsTamanho = 'ResizeObserver' in window ? new ResizeObserver(() => this.remedir()) : null;
    this.obsTamanho?.observe(raiz);
    document.fonts?.ready.then(() => this.vivo && this.remedir());
  }

  /** Centros das placas ao longo do eixo do asfalto, como fração do comprimento dele. */
  private medir() {
    const asfalto = this.raiz.querySelector<HTMLElement>('.asfalto');
    const carro = this.raiz.querySelector<HTMLElement>('.carro');
    if (!asfalto) return;
    const caixa = asfalto.getBoundingClientRect();
    const vertical = caixa.height > caixa.width;
    const comprimento = vertical ? caixa.height : caixa.width;
    if (comprimento === 0) return;
    const centros = this.placas.map((p) => {
      const r = p.getBoundingClientRect();
      return vertical ? (r.top + r.height / 2 - caixa.top) / comprimento : (r.left + r.width / 2 - caixa.left) / comprimento;
    });
    this.medida = { centros, margem: (carro?.offsetWidth ?? 0) / comprimento };
  }

  private remedir() {
    this.medir();
    if (this.ultimo) this.aplicar(this.ultimo);
  }

  /** Só a posição do carro e o trecho percorrido. */
  posicionar(u: number) {
    const f = fracaoDoCarro(u, this.medida.centros, this.medida.margem);
    this.raiz.style.setProperty('--pos', f.toFixed(4));
    this.raiz.style.setProperty('--feito', Math.min(Math.max(f, 0), 1).toFixed(4));
  }

  acender(ativa: number) {
    this.placas.forEach((p, i) => p.toggleAttribute('data-ativa', i === ativa));
  }

  aplicar(estado: EstadoRota) {
    this.ultimo = estado;
    this.posicionar(estado.u);
    this.acender(estado.ativa);
    this.raiz.toggleAttribute('data-andando', estado.andando);
  }

  desligar() {
    this.vivo = false;
    this.obsTamanho?.disconnect();
  }
}

/** Observa se a rota está na tela. */
function aoAparecer(raiz: HTMLElement, mudou: (visivel: boolean) => void): () => void {
  if (!('IntersectionObserver' in window)) {
    mudou(true);
    return () => {};
  }
  const obs = new IntersectionObserver((entradas) => mudou(entradas[entradas.length - 1].isIntersecting));
  obs.observe(raiz);
  return () => obs.disconnect();
}

interface Pausa {
  pausado: boolean;
}

/** Loop com movimento: o carro entra, para em cada placa e sai. O tempo só corre visível e sem pausa. */
function loopAndando(rota: Rota, pausa: Pausa): () => void {
  const n = rota.placas.length;
  const duracao = unidadesDoLoop(n) * UNIDADE_MS;
  let decorrido = 0;
  let anterior = 0;
  let visivel = false;
  let raf = 0;
  const passo = (agora: number) => {
    if (!pausa.pausado) decorrido = (decorrido + Math.min(agora - anterior, 64)) % duracao;
    anterior = agora;
    rota.aplicar(estadoDoLoop(decorrido / duracao, n));
    raf = requestAnimationFrame(passo);
  };
  const pararObs = aoAparecer(rota.raiz, (v) => {
    visivel = v;
    if (visivel && !raf) {
      anterior = performance.now();
      raf = requestAnimationFrame(passo);
    } else if (!visivel && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  rota.aplicar(estadoDoLoop(0, n));
  return () => {
    pararObs();
    cancelAnimationFrame(raf);
  };
}

/** Loop com movimento reduzido: o carro não anda; a placa acesa avança e o carro troca de lugar com fade. */
function loopTrocando(rota: Rota, pausa: Pausa): () => void {
  const n = rota.placas.length;
  let ativa = 0;
  let visivel = false;
  let fade = 0;
  rota.aplicar({ ativa, u: ativa, andando: false });
  const pararObs = aoAparecer(rota.raiz, (v) => {
    visivel = v;
  });
  const relogio = window.setInterval(() => {
    if (!visivel || pausa.pausado || n < 2) return;
    ativa = (ativa + 1) % n;
    rota.acender(ativa);
    rota.raiz.setAttribute('data-trocando', '');
    window.clearTimeout(fade);
    fade = window.setTimeout(() => {
      rota.aplicar({ ativa, u: ativa, andando: false });
      rota.raiz.removeAttribute('data-trocando');
    }, FADE_CARRO_MS);
  }, TROCA_MS);
  return () => {
    pararObs();
    window.clearInterval(relogio);
    window.clearTimeout(fade);
  };
}

/** Estudo de caso com movimento: presa no desktop, guiada pela rolagem no celular. */
function rolagemAndando(rota: Rota): () => void {
  const n = rota.placas.length;
  const atualizar = (st: ScrollTrigger) => rota.aplicar(estadoDaRolagem(st.progress, n));
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    ScrollTrigger.create({
      trigger: rota.raiz,
      pin: true,
      start: 'top top+=80',
      end: () => `+=${Math.round(n * window.innerHeight * 0.6)}`,
      scrub: 0.4,
      onUpdate: atualizar,
    });
    rota.aplicar(estadoDaRolagem(0, n));
  });
  mm.add('(max-width: 899px)', () => {
    const gatilho = ScrollTrigger.create({
      trigger: rota.raiz,
      start: 'top 60%',
      end: 'bottom 60%',
      scrub: 0.3,
      onUpdate: atualizar,
      onRefresh: atualizar,
    });
    atualizar(gatilho);
  });
  return () => mm.revert();
}

/** Estudo de caso com movimento reduzido: lista com tudo visível; acende a placa que cruza o meio da janela. */
function rolagemEstatica(rota: Rota): () => void {
  rota.raiz.setAttribute('data-estatico', '');
  rota.acender(0);
  if (!('IntersectionObserver' in window)) return () => {};
  const cruzando = new Set<HTMLElement>();
  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) cruzando.add(e.target as HTMLElement);
        else cruzando.delete(e.target as HTMLElement);
      }
      // Se nenhuma cruza o meio, fica acesa a última que cruzou.
      const acesa = rota.placas.findLast((p) => cruzando.has(p));
      if (acesa) rota.acender(rota.placas.indexOf(acesa));
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  rota.placas.forEach((p) => obs.observe(p));
  return () => obs.disconnect();
}

aoCarregarPagina(() => {
  const raizes = [...document.querySelectorAll<HTMLElement>('[data-rota]')];
  if (raizes.length === 0) return;
  const reduzido = movimentoReduzido();
  const pausa: Pausa = { pausado: false };
  const limpezas: Array<() => void> = [];

  const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-rota-pausa]')];
  const alternar = () => {
    pausa.pausado = !pausa.pausado;
    for (const b of botoes) {
      b.setAttribute('aria-pressed', String(pausa.pausado));
      b.textContent = (pausa.pausado ? b.dataset.continuar : b.dataset.pausar) ?? b.textContent;
    }
    raizes.forEach((r) => r.dataset.modo === 'loop' && r.toggleAttribute('data-pausada', pausa.pausado));
  };
  botoes.forEach((b) => b.addEventListener('click', alternar));
  limpezas.push(() => botoes.forEach((b) => b.removeEventListener('click', alternar)));

  for (const raiz of raizes) {
    const rota = new Rota(raiz);
    limpezas.push(() => rota.desligar());
    if (raiz.dataset.modo === 'loop') limpezas.push(reduzido ? loopTrocando(rota, pausa) : loopAndando(rota, pausa));
    else limpezas.push(reduzido ? rolagemEstatica(rota) : rolagemAndando(rota));
  }
  return () => limpezas.forEach((f) => f());
});
