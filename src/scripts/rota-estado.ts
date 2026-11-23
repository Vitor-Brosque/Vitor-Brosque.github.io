export interface EstadoRota {
  /** Índice da placa acesa. */
  ativa: number;
  /** Posição do carro de 0 a 1 ao longo da estrada (o centro da placa i é (i + 0.5) / total). */
  posicao: number;
}

const PARADO = 0.6;

export function estadoDaRota(progresso: number, total: number): EstadoRota {
  if (total <= 1) return { ativa: 0, posicao: 0.5 };
  const p = Math.min(Math.max(progresso, 0), 1);
  const centro = (i: number) => Math.round(((i + 0.5) / total) * 1e6) / 1e6;
  const trecho = Math.min(total - 1, Math.floor(p * total));
  const local = p * total - trecho;
  if (trecho === total - 1 || local <= PARADO) return { ativa: trecho, posicao: centro(trecho) };
  const t = (local - PARADO) / (1 - PARADO);
  const suave = t * t * (3 - 2 * t);
  return {
    ativa: t < 0.5 ? trecho : trecho + 1,
    posicao: Math.min(centro(trecho + 1), centro(trecho) + (centro(trecho + 1) - centro(trecho)) * suave),
  };
}
