import { describe, expect, it } from 'vitest';
import { valorDaContagem } from '../../src/scripts/contagem';

describe('valorDaContagem', () => {
  it('começa em 0', () => {
    expect(valorDaContagem(0, 1000)).toBe(0);
  });
  it('termina no alvo', () => {
    expect(valorDaContagem(1, 1000)).toBe(1000);
    expect(valorDaContagem(1, 7)).toBe(7);
  });
  it('nunca passa do alvo e nunca diminui', () => {
    let anterior = 0;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const v = valorDaContagem(p, 1234);
      expect(v).toBeLessThanOrEqual(1234);
      expect(v).toBeGreaterThanOrEqual(anterior);
      anterior = v;
    }
  });
  it('desacelera no fim: na metade do tempo já passou da metade', () => {
    expect(valorDaContagem(0.5, 100)).toBeGreaterThan(50);
  });
  it('limita progresso fora de 0..1', () => {
    expect(valorDaContagem(-2, 50)).toBe(0);
    expect(valorDaContagem(3, 50)).toBe(50);
  });
});
