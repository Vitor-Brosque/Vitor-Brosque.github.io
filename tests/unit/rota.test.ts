import { describe, expect, it } from 'vitest';
import { estadoDaRota } from '../../src/scripts/rota-estado';

describe('estadoDaRota', () => {
  it('começa parado na primeira placa', () => {
    expect(estadoDaRota(0, 5)).toEqual({ ativa: 0, posicao: 0.1 });
  });
  it('termina parado na última placa', () => {
    expect(estadoDaRota(1, 5)).toEqual({ ativa: 4, posicao: 0.9 });
  });
  it('fica parado na placa durante 60% do trecho', () => {
    expect(estadoDaRota(0.11, 5)).toEqual({ ativa: 0, posicao: 0.1 });
  });
  it('anda entre placas no fim do trecho e troca a ativa na metade do caminho', () => {
    const indo = estadoDaRota(0.15, 5);
    expect(indo.posicao).toBeGreaterThan(0.1);
    expect(indo.posicao).toBeLessThan(0.3);
    expect(indo.ativa).toBe(0);
    expect(estadoDaRota(0.19, 5).ativa).toBe(1);
  });
  it('a posição nunca volta para trás', () => {
    let anterior = -1;
    for (let p = 0; p <= 1; p += 0.01) {
      const { posicao } = estadoDaRota(p, 4);
      expect(posicao).toBeGreaterThanOrEqual(anterior);
      anterior = posicao;
    }
  });
  it('limita progresso fora de 0..1', () => {
    expect(estadoDaRota(-3, 3)).toEqual(estadoDaRota(0, 3));
    expect(estadoDaRota(7, 3)).toEqual(estadoDaRota(1, 3));
  });
});
