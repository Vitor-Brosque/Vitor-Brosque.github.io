import { aoCarregarPagina } from './ciclo';
import { aoMudarPausa } from './pausa';

/**
 * Log do topo (tema terminal): a pausa da página dá a entrada das linhas por encerrada. Só congelar não basta: ao
 * continuar, as linhas que ainda esperavam a vez sumiriam de novo até o atraso delas passar. Encerrada, a animação
 * fica no estado final (todas à vista) e continuar não esconde nada. O cursor (em loop) segue a regra geral da pausa.
 */
aoCarregarPagina(() => {
  const linhas = [...document.querySelectorAll<HTMLElement>('.log-janela .log-linha')];
  if (linhas.length === 0) return;
  return aoMudarPausa((pausado) => {
    if (pausado) linhas.forEach((l) => l.getAnimations().forEach((a) => a.finish()));
  });
});
