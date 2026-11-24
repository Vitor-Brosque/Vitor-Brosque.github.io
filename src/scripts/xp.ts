import { aoCarregarPagina } from './ciclo';
import { fracaoDeLeitura, larguraDaBarra } from './xp-calculo';

/** Largura de um bloco da barra (15 px de ouro + 3 de vão), igual ao CSS de EstudoDeCaso.astro. */
const BLOCO = 18;

/**
 * Barra de XP do tema rpg: enche em blocos conforme a leitura. Responde direto à rolagem, por isso vale nos dois
 * modos de movimento (não há deslocamento nem loop: a largura muda junto com a página).
 */
aoCarregarPagina(() => {
  const barra = document.querySelector<HTMLElement>('[data-xp]');
  if (!barra) return;
  let raf = 0;
  const atualizar = () => {
    raf = 0;
    const doc = document.documentElement;
    const f = fracaoDeLeitura(window.scrollY, doc.scrollHeight, window.innerHeight);
    barra.style.setProperty('--xp', `${larguraDaBarra(f, barra.clientWidth, BLOCO)}px`);
  };
  const pedir = () => {
    if (!raf) raf = requestAnimationFrame(atualizar);
  };
  atualizar();
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  return () => {
    window.removeEventListener('scroll', pedir);
    window.removeEventListener('resize', pedir);
    cancelAnimationFrame(raf);
  };
});
