import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { proximoDeslocamento } from './estrada-calculo';

aoCarregarPagina(() => {
  const estradas = [...document.querySelectorAll<HTMLElement>('[data-estrada]')];
  if (estradas.length === 0 || movimentoReduzido()) return;

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
    desloc = proximoDeslocamento(desloc, dt, dy);
    // Com carro, ele avança e sai pela direita conforme a página rola.
    const avanco = Math.min(Math.max(window.scrollY / (window.innerHeight * 0.9), 0), 1).toFixed(4);
    for (const e of visiveis) {
      e.style.setProperty('--desloc', `${desloc.toFixed(2)}px`);
      if (e.classList.contains('estrada--carro')) e.style.setProperty('--avanco', avanco);
    }
    raf = visiveis.size ? requestAnimationFrame(passo) : 0;
  };

  const obs = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      const e = en.target as HTMLElement;
      if (en.isIntersecting) visiveis.add(e);
      else visiveis.delete(e);
    }
    if (visiveis.size && !raf) {
      ultimoTempo = performance.now();
      ultimoScroll = window.scrollY;
      raf = requestAnimationFrame(passo);
    }
  });
  estradas.forEach((e) => obs.observe(e));

  return () => {
    obs.disconnect();
    cancelAnimationFrame(raf);
  };
});
