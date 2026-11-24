import { aoCarregarPagina } from './ciclo';
import { fracaoDeLeitura, larguraDaBarra } from './leitura-calculo';

/**
 * Barra de leitura dos temas próprios (a barra de XP do rpg, a barra de progresso do terminal): enche em blocos
 * inteiros conforme a leitura. A largura de um bloco vem do CSS (`--bloco` na barra), para cada tema ter o seu.
 * Responde direto à rolagem, por isso vale nos dois modos de movimento (não há deslocamento nem loop).
 */
aoCarregarPagina(() => {
  const barra = document.querySelector<HTMLElement>('[data-leitura]');
  if (!barra) return;
  const bloco = parseFloat(getComputedStyle(barra).getPropertyValue('--bloco')) || 1;
  let raf = 0;
  const atualizar = () => {
    raf = 0;
    const doc = document.documentElement;
    const f = fracaoDeLeitura(window.scrollY, doc.scrollHeight, window.innerHeight);
    barra.style.setProperty('--lido', `${larguraDaBarra(f, barra.clientWidth, bloco)}px`);
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
