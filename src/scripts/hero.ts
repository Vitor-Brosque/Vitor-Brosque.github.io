import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';

gsap.registerPlugin(SplitText);

aoCarregarPagina(() => {
  const titulo = document.querySelector<HTMLElement>('[data-hero-titulo]');
  if (!titulo || movimentoReduzido()) return;
  const ctx = gsap.context(() => {
    SplitText.create(titulo, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (s) => gsap.from(s.lines, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.08 }),
    });
    gsap.from('[data-hero-prova]', { opacity: 0, x: -12, duration: 0.5, stagger: 0.1, delay: 0.45 });
    gsap.from('[data-hero-print]', { opacity: 0, y: 40, rotate: 6, duration: 1.1, ease: 'power3.out', delay: 0.15 });
  });
  return () => ctx.revert();
});
