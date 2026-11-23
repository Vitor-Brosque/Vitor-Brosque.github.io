import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';

gsap.registerPlugin(ScrollTrigger);

aoCarregarPagina(() => {
  const raiz = document.querySelector<HTMLElement>('[data-trajetoria]');
  if (!raiz) return;
  if (movimentoReduzido()) {
    raiz.setAttribute('data-estatico', '');
    return;
  }
  const marcos = [...raiz.querySelectorAll<HTMLElement>('.traj-marco')];
  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: raiz,
      start: 'top 70%',
      end: 'bottom 55%',
      scrub: 0.3,
      onUpdate: (st) => raiz.style.setProperty('--prog', st.progress.toFixed(4)),
    });
    for (const m of marcos) {
      ScrollTrigger.create({
        trigger: m,
        start: 'top 62%',
        onEnter: () => m.setAttribute('data-alcancado', ''),
        onLeaveBack: () => m.removeAttribute('data-alcancado'),
      });
    }
  });
  return () => ctx.revert();
});
