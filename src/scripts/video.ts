import { aoCarregarPagina } from './ciclo';
import { movimentoReduzido } from './movimento';
import { deveTocar, type EstadoVideo } from './video-estado';

type VideoComPrefixo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type DocumentoComPrefixo = Document & { webkitFullscreenElement?: Element | null };

/**
 * Botão de tela cheia de todos os vídeos (inclusive os da vitrine): aparece só onde o navegador tem a API.
 * Em tela cheia o vídeo ganha os controles nativos (fora da vitrine o script tirou os controles, e o botão de tocar fica
 * fora do elemento em tela cheia: com movimento reduzido o vídeo não toca sozinho e não haveria como iniciá-lo). Ao sair,
 * volta ao estado de antes.
 */
aoCarregarPagina(() => {
  const botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-video-tela-cheia]')];
  const limpezas: Array<() => void> = [];
  /** Vídeo em tela cheia agora e se ele já tinha controles antes de entrar. */
  let emTelaCheia: { v: HTMLVideoElement; tinhaControles: boolean } | null = null;
  const sair = () => {
    if (!emTelaCheia) return;
    if (!emTelaCheia.tinhaControles) emTelaCheia.v.removeAttribute('controls');
    emTelaCheia = null;
  };
  const aoMudarTelaCheia = () => {
    const doc = document as DocumentoComPrefixo;
    const el = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
    if (emTelaCheia && emTelaCheia.v !== el) sair();
    if (el instanceof HTMLVideoElement && el.matches('video[data-video]') && !emTelaCheia) {
      emTelaCheia = { v: el, tinhaControles: el.hasAttribute('controls') };
      el.setAttribute('controls', '');
    }
  };
  document.addEventListener('fullscreenchange', aoMudarTelaCheia);
  document.addEventListener('webkitfullscreenchange', aoMudarTelaCheia);
  limpezas.push(() => {
    document.removeEventListener('fullscreenchange', aoMudarTelaCheia);
    document.removeEventListener('webkitfullscreenchange', aoMudarTelaCheia);
    sair();
  });
  for (const b of botoes) {
    const v = b.parentElement?.querySelector<VideoComPrefixo>('video');
    if (!v) continue;
    const pode = (document.fullscreenEnabled && typeof v.requestFullscreen === 'function') || typeof v.webkitEnterFullscreen === 'function';
    if (!pode) continue;
    b.hidden = false;
    const abrir = () => {
      if (document.fullscreenEnabled && v.requestFullscreen) void v.requestFullscreen().catch(() => undefined);
      else v.webkitEnterFullscreen?.();
    };
    b.addEventListener('click', abrir);
    limpezas.push(() => {
      b.removeEventListener('click', abrir);
      b.hidden = true;
    });
  }
  return () => limpezas.forEach((f) => f());
});

aoCarregarPagina(() => {
  // Os vídeos da vitrine da rota ficam com os controles nativos e quem decide quando tocam é rota.ts (só o da parada ativa).
  const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-video]')].filter((v) => !v.closest('[data-vitrine]'));
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
    // Sem JavaScript o vídeo usa os controles nativos; aqui o botão próprio assume.
    const tinhaControles = v.hasAttribute('controls');
    v.removeAttribute('controls');
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
      if (tinhaControles) v.setAttribute('controls', '');
    });
    atualizarBotao(v);
  }

  return () => {
    obs.disconnect();
    ouvintes.forEach((f) => f());
  };
});
