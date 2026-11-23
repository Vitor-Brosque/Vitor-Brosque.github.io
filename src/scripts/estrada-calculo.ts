/** Comprimento de um traço + espaço do tracejado, em px. Precisa bater com o CSS de Estrada.astro (40px + 28px). */
export const PERIODO = 68;

export function proximoDeslocamento(atual: number, dtMs: number, deltaScroll: number): number {
  const base = 0.14 * dtMs;
  const extra = Math.min(Math.abs(deltaScroll) * 0.8, 40);
  return (atual - base - extra) % PERIODO;
}
