import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { aoMudarPausa, definirPausa, estaPausado } from './pausa';
import {
  LOOP,
  estadoDaRolagem,
  estadoDoLoop,
  fracaoDoCarro,
  inicioDaParada,
  unidadesDoLoop,
  type EstadoRota,
  type TemposDoLoop,
} from './rota-estado';

gsap.registerPlugin(ScrollTrigger);

/** Duração de uma unidade do loop (parada numa placa da rota compacta), em ms. */
const UNIDADE_MS = 1500;
/** Na rota grande (com a vitrine), cada parada fica bem mais tempo: é o tempo de olhar a tela. */
const PARADA_GRANDE_MS = 7000;
const TEMPOS_GRANDE: TemposDoLoop = { ...LOOP, parada: PARADA_GRANDE_MS / UNIDADE_MS };
/** Ao clicar numa placa, o carro anda até ela nesse tempo. */
const IDA_MS = 600;

interface Medida {
  centros: number[];
  margem: number;
}

/** Uma rota na página: mede as placas sobre o asfalto e aplica um estado. Na rota grande, também troca o painel da vitrine. */
class Rota {
  readonly placas: HTMLElement[];
  readonly botoes: HTMLButtonElement[];
  readonly paineis: HTMLElement[];
  /** Marcos da estrada (só no tema rpg): acendem quando a lanterna passa por eles. */
  readonly marcos: HTMLElement[];
  /** Painel da vitrine à mostra; fica o último enquanto o carro está fora da rota. */
  painel = 0;
  /** A troca automática espera (ponteiro sobre a vitrine ou foco de teclado dentro da rota). */
  segurando = false;
  aoTrocarPainel: ((i: number) => void) | null = null;
  private medida: Medida = { centros: [], margem: 0 };
  private ultimo: EstadoRota | null = null;
  private readonly obsTamanho: ResizeObserver | null;
  private vivo = true;

  constructor(readonly raiz: HTMLElement) {
    this.placas = [...raiz.querySelectorAll<HTMLElement>('.placa')];
    this.botoes = [...raiz.querySelectorAll<HTMLButtonElement>('[data-placa-botao]')];
    this.paineis = [...raiz.querySelectorAll<HTMLElement>('[data-painel]')];
    this.marcos = [...raiz.querySelectorAll<HTMLElement>('.marco')];
    this.mostrarPainel(0, true);
    this.medir();
    this.obsTamanho = 'ResizeObserver' in window ? new ResizeObserver(() => this.remedir()) : null;
    this.obsTamanho?.observe(raiz);
    document.fonts?.ready.then(() => this.vivo && this.remedir());
  }

  get u(): number {
    return this.ultimo?.u ?? 0;
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
    // Cada marco fica sob a sua placa (no celular, ao lado dela).
    this.marcos.forEach((m, i) => centros[i] !== undefined && m.style.setProperty('--c', centros[i].toFixed(4)));
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
    this.marcos.forEach((m, i) => m.toggleAttribute('data-aceso', f >= (this.medida.centros[i] ?? Infinity) - 0.001));
  }

  acender(estadoAtiva: number) {
    // Na rota grande, com o carro fora da rota (entrando ou saindo) o painel da última parada continua à mostra: a placa dele fica acesa.
    const ativa = estadoAtiva < 0 && this.paineis.length > 0 ? this.painel : estadoAtiva;
    this.placas.forEach((p, i) => p.toggleAttribute('data-ativa', i === ativa));
    // Na lista (movimento reduzido) a lanterna não anda: acendem os marcos até a parada ativa.
    if (this.raiz.hasAttribute('data-estatico')) this.marcos.forEach((m, i) => m.toggleAttribute('data-aceso', i <= ativa));
    this.botoes.forEach((b, i) => (i === ativa ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    if (ativa >= 0) this.mostrarPainel(ativa);
  }

  /** Só o painel ativo fica à vista; os outros saem da árvore de acessibilidade (visibility no CSS e inert aqui). */
  private mostrarPainel(i: number, forcar = false) {
    if (this.paineis.length === 0 || (i === this.painel && !forcar)) return;
    this.painel = i;
    this.paineis.forEach((p, k) => {
      p.toggleAttribute('data-ativa', k === i);
      p.inert = k !== i;
    });
    if (!forcar) this.aoTrocarPainel?.(i);
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
    this.aoTrocarPainel = null;
    this.paineis.forEach((p) => (p.inert = false));
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

/** Um loop em andamento: `irPara` leva o carro a uma placa (a pausa fica com quem chama). */
interface Loop {
  irPara(i: number): void;
  limpar(): void;
}

const suavizar = (t: number) => 1 - (1 - t) ** 3;

/** Loop (nos dois modos): o carro entra, para em cada placa e sai. O tempo e o quadro só correm visível e sem pausa. */
function loopAndando(rota: Rota, tempos: TemposDoLoop): Loop {
  const n = rota.placas.length;
  const duracao = unidadesDoLoop(n, tempos) * UNIDADE_MS;
  let decorrido = 0;
  let anterior = 0;
  let visivel = false;
  let raf = 0;
  let ida = 0;
  let fimDaIda: (() => void) | null = null;
  const passo = (agora: number) => {
    const dt = Math.min(agora - anterior, 64);
    anterior = agora;
    // Segurando: o carro termina o trecho em que está, mas não sai da placa em que parou.
    const parado = !estadoDoLoop(decorrido / duracao, n, tempos).andando;
    if (!(rota.segurando && parado)) decorrido = (decorrido + dt) % duracao;
    rota.aplicar(estadoDoLoop(decorrido / duracao, n, tempos));
    raf = requestAnimationFrame(passo);
  };
  /** Liga o quadro a quadro só quando a rota está visível e sem pausa; parada, ela não fica "andando". */
  const sincronizar = () => {
    const rodar = visivel && !estaPausado();
    if (rodar && fimDaIda) fimDaIda();
    if (rodar && !raf) {
      anterior = performance.now();
      raf = requestAnimationFrame(passo);
    } else if (!rodar) {
      cancelAnimationFrame(raf);
      raf = 0;
      if (!fimDaIda) rota.raiz.removeAttribute('data-andando');
    }
  };
  const pararPausa = aoMudarPausa(sincronizar);
  const pararObs = aoAparecer(rota.raiz, (v) => {
    visivel = v;
    sincronizar();
  });
  rota.aplicar(estadoDoLoop(0, n, tempos));

  /** O carro anda da posição atual até a placa i num trecho curto; o loop retoma dali depois. */
  const irPara = (i: number) => {
    fimDaIda?.();
    const de = Math.min(Math.max(rota.u, -1), n);
    decorrido = inicioDaParada(i, n, tempos) * duracao;
    const chegar = () => {
      cancelAnimationFrame(ida);
      fimDaIda = null;
      rota.aplicar({ ativa: i, u: i, andando: false });
    };
    if (Math.abs(de - i) < 0.01) return chegar();
    fimDaIda = chegar;
    const inicio = performance.now();
    const andar = (agora: number) => {
      const t = Math.min((agora - inicio) / IDA_MS, 1);
      if (t >= 1) return chegar();
      rota.aplicar({ ativa: i, u: de + (i - de) * suavizar(t), andando: true });
      ida = requestAnimationFrame(andar);
    };
    rota.aplicar({ ativa: i, u: de, andando: true });
    ida = requestAnimationFrame(andar);
  };

  return {
    irPara,
    limpar: () => {
      pararPausa();
      pararObs();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(ida);
    },
  };
}

/**
 * A vitrine da rota grande: placas que levam o carro até elas e pausam, a troca automática que espera o ponteiro
 * ou o foco de teclado, e os vídeos (o da parada ativa toca do início com movimento; com movimento reduzido nenhum toca sozinho).
 */
function vitrineViva(rota: Rota, loop: Loop, pausar: () => void, reduzido: boolean): () => void {
  const vitrine = rota.raiz.querySelector<HTMLElement>('[data-vitrine]');
  const limpezas: Array<() => void> = [];
  const ouvir = <K extends keyof HTMLElementEventMap>(alvo: HTMLElement, tipo: K, f: (ev: HTMLElementEventMap[K]) => void) => {
    alvo.addEventListener(tipo, f);
    limpezas.push(() => alvo.removeEventListener(tipo, f));
  };

  rota.botoes.forEach((b, i) =>
    ouvir(b, 'click', () => {
      pausar();
      loop.irPara(i);
    }),
  );

  let ponteiro = false;
  let foco = false;
  const segurar = () => (rota.segurando = ponteiro || foco);
  if (vitrine) {
    ouvir(vitrine, 'pointerenter', (ev) => {
      if (ev.pointerType !== 'mouse' && ev.pointerType !== 'pen') return;
      ponteiro = true;
      segurar();
    });
    ouvir(vitrine, 'pointerleave', () => {
      ponteiro = false;
      segurar();
    });
    // Mexer na tela (tocar, pausar ou avançar o vídeo, ampliar o print) pausa a rota: a parada não troca por baixo de quem está olhando.
    ouvir(vitrine, 'pointerdown', (ev) => {
      if ((ev.target as Element).closest('.moldura')) pausar();
    });
  }
  // Foco de teclado (não o de um clique) dentro da rota segura a troca.
  ouvir(rota.raiz, 'focusin', (ev) => {
    // O botão de pausa não segura: quem aperta "Continuar" pelo teclado fica com o foco nele e a rota precisa andar.
    const alvo = ev.target as Element;
    foco = !alvo.closest('[data-rota-pausa]') && alvo.matches(':focus-visible');
    segurar();
  });
  ouvir(rota.raiz, 'focusout', (ev) => {
    if (!rota.raiz.contains(ev.relatedTarget as Node | null)) foco = false;
    segurar();
  });

  const videos = rota.paineis.map((p) => p.querySelector<HTMLVideoElement>('video'));
  let visivel = false;
  const tocarDoInicio = new Set<HTMLVideoElement>();
  // A escolha da pessoa (play ou pausa nos controles do vídeo) vale até a parada trocar.
  // Para distinguir da do script, cada play/pause que o script pede fica anotado até o evento chegar.
  const escolha = new Map<HTMLVideoElement, 'tocar' | 'pausar'>();
  const pedido = new Map<HTMLVideoElement, 'play' | 'pause'>();
  const tocarPeloScript = (v: HTMLVideoElement) => {
    if (!v.paused) return;
    pedido.set(v, 'play');
    v.play().catch(() => pedido.delete(v));
  };
  const pausarPeloScript = (v: HTMLVideoElement) => {
    if (v.paused) return;
    pedido.set(v, 'pause');
    v.pause();
  };
  for (const v of videos) {
    if (!v) continue;
    ouvir(v, 'play', () => {
      if (pedido.get(v) === 'play') return void pedido.delete(v);
      escolha.set(v, 'tocar');
      tocarDoInicio.delete(v);
    });
    ouvir(v, 'pause', () => {
      if (pedido.get(v) === 'pause') return void pedido.delete(v);
      if (v.ended) return;
      escolha.set(v, 'pausar');
      tocarDoInicio.delete(v);
    });
  }
  const sincronizarVideos = () => {
    videos.forEach((v, i) => {
      if (!v) return;
      const e = escolha.get(v);
      const tocar = i === rota.painel && visivel && (e === 'tocar' || (e !== 'pausar' && !reduzido));
      if (tocar) {
        if (tocarDoInicio.delete(v)) v.currentTime = 0;
        tocarPeloScript(v);
      } else pausarPeloScript(v);
    });
  };
  rota.aoTrocarPainel = (i) => {
    escolha.clear();
    const v = videos[i];
    if (v) tocarDoInicio.add(v);
    sincronizarVideos();
  };
  const v0 = videos[rota.painel];
  if (v0) tocarDoInicio.add(v0);
  limpezas.push(
    aoAparecer(vitrine ?? rota.raiz, (v) => {
      visivel = v;
      sincronizarVideos();
    }),
  );
  limpezas.push(() => {
    rota.segurando = false;
    videos.forEach((v) => v?.pause());
  });
  return () => limpezas.forEach((f) => f());
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
  const limpezas: Array<() => void> = [];

  // A pausa é da página (pausa.ts): os botões dela trocam o texto lá; aqui as rotas em loop só mostram o estado.
  const marcarPausa = (pausado: boolean) => raizes.forEach((r) => r.dataset.modo === 'loop' && r.toggleAttribute('data-pausada', pausado));
  marcarPausa(estaPausado());
  limpezas.push(aoMudarPausa(marcarPausa));

  for (const raiz of raizes) {
    const rota = new Rota(raiz);
    limpezas.push(() => rota.desligar());
    if (raiz.dataset.modo === 'loop') {
      const grande = rota.paineis.length > 0;
      // O carro anda nos dois modos (exceção escolhida à regra dos dois modos); quique, tracejado correndo e placa subindo ficam no CSS só com movimento.
      const loop = loopAndando(rota, grande ? TEMPOS_GRANDE : LOOP);
      limpezas.push(() => loop.limpar());
      if (grande) limpezas.push(vitrineViva(rota, loop, () => definirPausa(true), reduzido));
    } else limpezas.push(reduzido ? rolagemEstatica(rota) : rolagemAndando(rota));
  }
  return () => limpezas.forEach((f) => f());
});
