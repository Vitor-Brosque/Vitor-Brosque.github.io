import { aoCarregarPagina } from './ciclo';

aoCarregarPagina(() => {
  const dialogo = document.querySelector<HTMLDialogElement>('[data-ampliador]');
  const img = dialogo?.querySelector<HTMLImageElement>('img');
  if (!dialogo || !img) return;

  const aoClicar = (ev: MouseEvent) => {
    const botao = (ev.target as Element | null)?.closest<HTMLButtonElement>('[data-ampliar]');
    if (!botao) return;
    img.src = botao.dataset.ampliar ?? '';
    img.alt = botao.querySelector('img')?.alt ?? '';
    dialogo.showModal();
  };
  const aoClicarNoDialogo = (ev: MouseEvent) => {
    const alvo = ev.target as Element;
    if (alvo === dialogo || alvo.closest('[data-fechar]')) dialogo.close();
  };

  document.addEventListener('click', aoClicar);
  dialogo.addEventListener('click', aoClicarNoDialogo);
  return () => {
    document.removeEventListener('click', aoClicar);
    dialogo.removeEventListener('click', aoClicarNoDialogo);
  };
});
