/**
 * Sprites do Life RPG (SVG exportados do jogo, só com <rect>) para entrar inline na página, como o carrinho:
 * sem título nem tamanho fixo, decorativos e com shape-rendering="crispEdges" para os pixels ficarem nítidos.
 */

/** O viewBox e os retângulos de um SVG exportado. */
export function lerSvg(svg: string): { viewBox: string; corpo: string } {
  const viewBox = svg.match(/<svg[^>]*\sviewBox="([^"]+)"/)?.[1];
  if (!viewBox) throw new Error('SVG sem viewBox');
  const corpo = (svg.match(/<rect\b[^>]*\/>/g) ?? []).join('');
  return { viewBox, corpo };
}

const abrir = (classe: string, viewBox: string) =>
  `<svg class="${classe}" viewBox="${viewBox}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`;

/** Um sprite inline, decorativo. */
export function spriteInline(svg: string, classe: string): string {
  const { viewBox, corpo } = lerSvg(svg);
  return `${abrir(classe, viewBox)}${corpo}</svg>`;
}

/** Vários quadros de uma animação no mesmo SVG, cada um num <g class="quadro quadro-N"> (o CSS escolhe qual aparece). */
export function spriteQuadros(svgs: string[], classe: string): string {
  const quadros = svgs.map(lerSvg);
  const viewBox = quadros[0].viewBox;
  if (quadros.some((q) => q.viewBox !== viewBox)) throw new Error('Quadros de tamanho diferente');
  return `${abrir(classe, viewBox)}${quadros.map((q, i) => `<g class="quadro quadro-${i + 1}">${q.corpo}</g>`).join('')}</svg>`;
}
