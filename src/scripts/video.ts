import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { deveTocar, type EstadoVideo } from './video-estado';

aoCarregarPagina(() => {
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-video]')];
  if (videos.length === 0) return;
  const reduzido = movimentoReduzido();
  const estados = new Map<HTMLVideoElement, EstadoVideo>();

  const atualizarBotao = (v: HTMLVideoElement) => {
    const botao = v.parentElement?.querySelector<HTMLButtonElement>('[data-video-botao]');
    if (!botao) return;
    const tocando = !v.paused;
    botao.dataset.tocando = String(tocando);
    botao.setAttribute('aria-label', (tocando ? botao.dataset.rotuloPausar : botao.dataset.rotuloTocar) ?? '');
  };

  const aplicar = (v: HTMLVideoElement) => {
    const estado = estados.get(v);
    if (!estado) return;
    if (deveTocar(estado)) {
      if (v.paused) void v.play().catch(() => undefined);
    } else if (!v.paused) {
      v.pause();
    }
  };

  const obs = new IntersectionObserver(
    (entradas) => {
      for (const en of entradas) {
        const v = en.target as HTMLVideoElement;
        const estado = estados.get(v);
        if (!estado) continue;
        estado.visivel = en.isIntersecting;
        aplicar(v);
      }
    },
    { threshold: 0.35 },
  );

  const ouvintes: Array<() => void> = [];
  for (const v of videos) {
    estados.set(v, { visivel: false, movimentoReduzido: reduzido, escolhaDoUsuario: null });
    obs.observe(v);
    const aoMudar = () => atualizarBotao(v);
    v.addEventListener('play', aoMudar);
    v.addEventListener('pause', aoMudar);
    const botao = v.parentElement?.querySelector<HTMLButtonElement>('[data-video-botao]');
    const aoClicar = () => {
      const estado = estados.get(v);
      if (!estado) return;
      estado.escolhaDoUsuario = v.paused ? 'tocar' : 'pausar';
      aplicar(v);
    };
    botao?.addEventListener('click', aoClicar);
    ouvintes.push(() => {
      v.removeEventListener('play', aoMudar);
      v.removeEventListener('pause', aoMudar);
      botao?.removeEventListener('click', aoClicar);
    });
    atualizarBotao(v);
  }

  return () => {
    obs.disconnect();
    ouvintes.forEach((f) => f());
  };
});
