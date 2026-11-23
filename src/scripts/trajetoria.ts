import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';

gsap.registerPlugin(ScrollTrigger);

aoCarregarPagina(() => {
  const raiz = document.querySelector<HTMLElement>('[data-trajetoria]');
  if (!raiz) return;
  const marcos = [...raiz.querySelectorAll<HTMLElement>('.traj-marco')];
  if (movimentoReduzido()) {
    // Faixa cheia e sem carro; os marcos acendem (só cor) ao cruzar 62% da altura da janela e não apagam mais.
    raiz.setAttribute('data-estatico', '');
    if (!('IntersectionObserver' in window)) {
      marcos.forEach((m) => m.setAttribute('data-alcancado', ''));
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
          // Os marcos anteriores também (um salto pode pulá-los sem aviso do observador).
          for (const m of marcos.slice(0, marcos.indexOf(e.target as HTMLElement) + 1)) {
            m.setAttribute('data-alcancado', '');
            obs.unobserve(m);
          }
        }
      },
      { rootMargin: '0px 0px -38% 0px' },
    );
    marcos.forEach((m) => obs.observe(m));
    return () => obs.disconnect();
  }
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
