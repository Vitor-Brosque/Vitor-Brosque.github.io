import { describe, expect, it } from 'vitest';
import { caixaDoNo, caminhoDaFaixa, dimensoesDoMapa, faixasDoNo, type NoMapa } from '../../src/lib/mapa';

const no = (id: string, col: number, lin: number): NoMapa => ({ id, rotulo: id, detalhe: '', explicacao: '', col, lin });

describe('caixaDoNo', () => {
  it('posiciona pela grade e transpõe', () => {
    expect(caixaDoNo(no('a', 2, 1))).toEqual({ x: 408, y: 118, w: 168, h: 60 });
    expect(caixaDoNo(no('a', 2, 1), true)).toEqual({ x: 208, y: 228, w: 168, h: 60 });
  });
});

describe('dimensoesDoMapa', () => {
  it('cobre todos os nós com margem', () => {
    expect(dimensoesDoMapa([no('a', 0, 0), no('b', 4, 1)])).toEqual({ largura: 984, altura: 186 });
  });
});

describe('caminhoDaFaixa', () => {
  it('liga lado direito ao esquerdo na mesma linha', () => {
    expect(caminhoDaFaixa(caixaDoNo(no('a', 0, 0)), caixaDoNo(no('b', 1, 0)))).toBe('M 176 38 C 192 38, 192 38, 208 38');
  });
  it('mantém o sentido de -> para quando volta para a esquerda', () => {
    expect(caminhoDaFaixa(caixaDoNo(no('a', 1, 0)), caixaDoNo(no('b', 0, 0)))).toBe('M 208 38 C 192 38, 192 38, 176 38');
  });
  it('liga de baixo para cima na mesma coluna', () => {
    expect(caminhoDaFaixa(caixaDoNo(no('a', 0, 0)), caixaDoNo(no('b', 0, 1)))).toBe('M 92 68 C 92 93, 92 93, 92 118');
  });
});

describe('faixasDoNo', () => {
  it('lista as faixas que tocam o nó', () => {
    const faixas = [{ de: 'a', para: 'b' }, { de: 'b', para: 'c' }, { de: 'c', para: 'd' }];
    expect(faixasDoNo('b', faixas)).toEqual([0, 1]);
    expect(faixasDoNo('x', faixas)).toEqual([]);
  });
});
