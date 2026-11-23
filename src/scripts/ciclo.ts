type Limpeza = () => void;
const limpezas: Limpeza[] = [];
let ouvindoTroca = false;

/** Roda `iniciar` em cada carregamento de página (inclusive o primeiro) e a limpeza que ele devolver antes da próxima troca. */
export function aoCarregarPagina(iniciar: () => Limpeza | void): void {
  document.addEventListener('astro:page-load', () => {
    const limpar = iniciar();
    if (limpar) limpezas.push(limpar);
  });
  if (!ouvindoTroca) {
    ouvindoTroca = true;
    document.addEventListener('astro:before-swap', () => {
      while (limpezas.length) limpezas.pop()?.();
    });
  }
}
