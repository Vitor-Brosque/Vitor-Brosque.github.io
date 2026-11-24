import { describe, expect, it } from 'vitest';
import { fracaoDeLeitura, larguraDaBarra } from '../../src/scripts/leitura-calculo';

describe('fracaoDeLeitura', () => {
  it('vai de 0 no topo a 1 no fim da página', () => {
    expect(fracaoDeLeitura(0, 3000, 800)).toBe(0);
    expect(fracaoDeLeitura(1100, 3000, 800)).toBeCloseTo(0.5);
    expect(fracaoDeLeitura(2200, 3000, 800)).toBe(1);
  });
  it('fica entre 0 e 1 mesmo com rolagem elástica', () => {
    expect(fracaoDeLeitura(-40, 3000, 800)).toBe(0);
    expect(fracaoDeLeitura(2400, 3000, 800)).toBe(1);
  });
  it('página que cabe na janela já está lida', () => {
    expect(fracaoDeLeitura(0, 700, 800)).toBe(1);
  });
});

describe('larguraDaBarra', () => {
  it('enche em blocos inteiros, como a barra de XP do jogo', () => {
    // 1000 px de trilho, blocos de 20 px: 0,5 = 25 blocos.
    expect(larguraDaBarra(0.5, 1000, 20)).toBe(500);
    // 0,51 ainda é 25 blocos (o 26.º só entra cheio).
    expect(larguraDaBarra(0.51, 1000, 20)).toBe(500);
    expect(larguraDaBarra(0.529, 1000, 20)).toBe(520);
  });
  it('no fim enche o trilho inteiro, mesmo com sobra menor que um bloco', () => {
    expect(larguraDaBarra(1, 1010, 20)).toBe(1010);
  });
  it('vazia no topo', () => {
    expect(larguraDaBarra(0, 1000, 20)).toBe(0);
  });
});
