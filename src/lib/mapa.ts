export interface NoMapa {
  id: string;
  rotulo: string;
  detalhe: string;
  explicacao: string;
  col: number;
  lin: number;
  destaque?: boolean;
}
export interface FaixaMapa { de: string; para: string }
export interface Caixa { x: number; y: number; w: number; h: number }

export const LARGURA_NO = 168;
export const ALTURA_NO = 60;
export const PASSO_X = 200;
export const PASSO_Y = 110;
export const MARGEM = 8;

export function caixaDoNo(n: NoMapa, transposto = false): Caixa {
  const col = transposto ? n.lin : n.col;
  const lin = transposto ? n.col : n.lin;
  return { x: MARGEM + col * PASSO_X, y: MARGEM + lin * PASSO_Y, w: LARGURA_NO, h: ALTURA_NO };
}

export function dimensoesDoMapa(nos: NoMapa[], transposto = false): { largura: number; altura: number } {
  const caixas = nos.map((n) => caixaDoNo(n, transposto));
  return {
    largura: Math.max(...caixas.map((c) => c.x + c.w)) + MARGEM,
    altura: Math.max(...caixas.map((c) => c.y + c.h)) + MARGEM,
  };
}

/** Curva da faixa, sempre no sentido a -> b (os pacotes andam nesse sentido). */
export function caminhoDaFaixa(a: Caixa, b: Caixa): string {
  const mesmaColuna = a.x < b.x + b.w && b.x < a.x + a.w;
  if (mesmaColuna) {
    const desce = a.y <= b.y;
    const x1 = a.x + a.w / 2;
    const x2 = b.x + b.w / 2;
    const y1 = desce ? a.y + a.h : a.y;
    const y2 = desce ? b.y : b.y + b.h;
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }
  const paraDireita = a.x <= b.x;
  const x1 = paraDireita ? a.x + a.w : a.x;
  const x2 = paraDireita ? b.x : b.x + b.w;
  const y1 = a.y + a.h / 2;
  const y2 = b.y + b.h / 2;
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function faixasDoNo(id: string, faixas: FaixaMapa[]): number[] {
  return faixas.flatMap((f, i) => (f.de === id || f.para === id ? [i] : []));
}
