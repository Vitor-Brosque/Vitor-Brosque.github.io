export interface EstadoRota {
  /** Índice da placa acesa, ou -1 quando o carro está fora da rota (entrando ou saindo). */
  ativa: number;
  /** Posição do carro em unidades de placa: i é o centro da placa i; -1 é antes da entrada; total é depois da saída. */
  u: number;
  /** O carro está andando (entre placas, entrando ou saindo). */
  andando: boolean;
}

const PARADO = 0.6;
const suave = (t: number) => t * t * (3 - 2 * t);
const limitar = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/** Rolagem (estudo de caso): o progresso de 0 a 1 leva o carro da primeira à última placa, parando em cada uma. */
export function estadoDaRolagem(progresso: number, total: number): EstadoRota {
  if (total <= 1) return { ativa: 0, u: 0, andando: false };
  const p = limitar(progresso, 0, 1);
  const trecho = Math.min(total - 1, Math.floor(p * total));
  const local = p * total - trecho;
  if (trecho === total - 1 || local <= PARADO) return { ativa: trecho, u: trecho, andando: false };
  const t = (local - PARADO) / (1 - PARADO);
  return { ativa: t < 0.5 ? trecho : trecho + 1, u: trecho + suave(t), andando: true };
}

/** Tempos do loop, em unidades: entrada, parada em cada placa, trecho entre placas e saída. */
export interface TemposDoLoop {
  entrada: number;
  parada: number;
  trecho: number;
  saida: number;
}
export const LOOP: Readonly<TemposDoLoop> = { entrada: 0.7, parada: 1, trecho: 0.6, saida: 0.7 };

/** Duração de uma unidade do loop (parada numa placa da rota compacta), em ms. */
export const UNIDADE_MS = 1500;
/**
 * Na rota grande (com a vitrine), cada parada dura 4 s: o tempo de olhar a tela sem demorar para mostrar que a rota anda.
 * Com a entrada (0,7 unidade), o carro chega à primeira placa em cerca de 1 s e parte para a segunda em cerca de 5 s.
 */
export const PARADA_GRANDE_MS = 4000;
export const TEMPOS_GRANDE: Readonly<TemposDoLoop> = { ...LOOP, parada: PARADA_GRANDE_MS / UNIDADE_MS };

export function unidadesDoLoop(total: number, tempos: TemposDoLoop = LOOP): number {
  const n = Math.max(total, 1);
  return tempos.entrada + n * tempos.parada + (n - 1) * tempos.trecho + tempos.saida;
}

/** Loop (home): o carro entra por um lado, para em cada placa e sai pelo outro. O progresso de 0 a 1 é uma volta. */
export function estadoDoLoop(progresso: number, total: number, tempos: TemposDoLoop = LOOP): EstadoRota {
  const n = Math.max(total, 1);
  let t = limitar(progresso, 0, 1) * unidadesDoLoop(n, tempos);
  if (t < tempos.entrada) {
    const f = t / tempos.entrada;
    const u = -1 + (1 - (1 - f) * (1 - f));
    return { ativa: u > -0.5 ? 0 : -1, u, andando: true };
  }
  t -= tempos.entrada;
  for (let i = 0; i < n; i++) {
    if (t < tempos.parada) return { ativa: i, u: i, andando: false };
    t -= tempos.parada;
    if (i === n - 1) break;
    if (t < tempos.trecho) {
      const f = suave(t / tempos.trecho);
      return { ativa: f < 0.5 ? i : i + 1, u: i + f, andando: true };
    }
    t -= tempos.trecho;
  }
  const f = Math.min(t / tempos.saida, 1);
  const u = n - 1 + f * f;
  return { ativa: u < n - 0.5 ? n - 1 : -1, u, andando: true };
}

/** Progresso (0 a 1) em que o carro chega à placa `i` e para nela. Um fio de folga evita cair no fim do trecho anterior por arredondamento. */
export function inicioDaParada(i: number, total: number, tempos: TemposDoLoop = LOOP): number {
  const n = Math.max(total, 1);
  const k = limitar(Math.round(i), 0, n - 1);
  const folga = Math.min(1e-6, tempos.parada / 2);
  return (tempos.entrada + k * (tempos.parada + tempos.trecho) + folga) / unidadesDoLoop(n, tempos);
}

/** Converte `u` na fração (0 a 1) ao longo do asfalto, usando os centros medidos das placas. A margem deixa o carro sair inteiro. */
export function fracaoDoCarro(u: number, centros: number[], margem: number): number {
  const n = centros.length;
  if (n === 0) return 0.5;
  if (u <= 0) return centros[0] + (centros[0] + margem) * limitar(u, -1, 0);
  if (u >= n - 1) return centros[n - 1] + (1 + margem - centros[n - 1]) * limitar(u - (n - 1), 0, 1);
  const k = Math.floor(u);
  return centros[k] + (centros[k + 1] - centros[k]) * (u - k);
}
