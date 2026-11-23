/** Valor mostrado na contagem: progresso de 0 a 1, com desaceleração no fim. */
export function valorDaContagem(progresso: number, alvo: number): number {
  const p = Math.min(Math.max(progresso, 0), 1);
  return Math.round(alvo * (1 - Math.pow(1 - p, 3)));
}
