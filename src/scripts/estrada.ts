import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { aoMudarPausa, estaPausado } from './pausa';
import { proximoDeslocamento } from './estrada-calculo';

aoCarregarPagina(() => {
  const estradas = [...document.querySelectorAll<HTMLElement>('[data-estrada]')];
  if (estradas.length === 0) return;
  // Exceção escolhida à regra dos dois modos: com movimento reduzido a rua também corre, devagar e sem acelerar com a rolagem.
  const reduzido = movimentoReduzido();

  const visiveis = new Set<HTMLElement>();
  let desloc = 0;
  let ultimoTempo = performance.now();
  let ultimoScroll = window.scrollY;
  let raf = 0;

  const passo = (agora: number) => {
    const dt = Math.min(agora - ultimoTempo, 64);
    const dy = window.scrollY - ultimoScroll;
    ultimoTempo = agora;
    ultimoScroll = window.scrollY;
    desloc = proximoDeslocamento(desloc, dt, dy, reduzido);
    // Só a rua corre (tracejado e tachões); o carro fica no lugar.
    for (const e of visiveis) e.style.setProperty('--desloc', `${desloc.toFixed(2)}px`);
    raf = visiveis.size && !estaPausado() ? requestAnimationFrame(passo) : 0;
  };

  /** O quadro a quadro só corre com alguma estrada visível e a página sem pausa. */
  const sincronizar = () => {
    const rodar = visiveis.size > 0 && !estaPausado();
    if (rodar && !raf) {
      ultimoTempo = performance.now();
      ultimoScroll = window.scrollY;
      raf = requestAnimationFrame(passo);
    } else if (!rodar && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  const obs = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      const e = en.target as HTMLElement;
      if (en.isIntersecting) visiveis.add(e);
      else visiveis.delete(e);
    }
    sincronizar();
  });
  estradas.forEach((e) => obs.observe(e));
  const pararPausa = aoMudarPausa(sincronizar);

  return () => {
    pararPausa();
    obs.disconnect();
    cancelAnimationFrame(raf);
  };
});
