import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';

aoCarregarPagina(() => {
  const alvos = [...document.querySelectorAll<HTMLElement>('.revelar:not(.visivel)')];
  if (movimentoReduzido() || !('IntersectionObserver' in window)) {
    alvos.forEach((a) => a.classList.add('visivel'));
    return;
  }
  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('visivel');
        obs.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  alvos.forEach((a) => obs.observe(a));
  return () => obs.disconnect();
});
