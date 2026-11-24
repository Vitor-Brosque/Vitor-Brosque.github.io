/** Comprimento de um traço + espaço do tracejado, em px. Precisa bater com o CSS de Estrada.astro (40px + 28px). */
export const PERIODO = 68;

/** Velocidade da rua, em px/ms: com movimento permitido e, mais devagar, com movimento reduzido. */
const VELOCIDADE = 0.14;
const VELOCIDADE_REDUZIDA = 0.05;

/** Próximo deslocamento do tracejado. Com movimento reduzido a rua anda devagar e não acelera com a rolagem. */
export function proximoDeslocamento(atual: number, dtMs: number, deltaScroll: number, reduzido = false): number {
  const base = (reduzido ? VELOCIDADE_REDUZIDA : VELOCIDADE) * dtMs;
  const extra = reduzido ? 0 : Math.min(Math.abs(deltaScroll) * 0.8, 40);
  return (atual - base - extra) % PERIODO;
}
