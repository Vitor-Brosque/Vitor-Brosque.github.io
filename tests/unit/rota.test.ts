import { describe, expect, it } from 'vitest';
import { LOOP, estadoDaRolagem, estadoDoLoop, fracaoDoCarro, inicioDaParada, unidadesDoLoop } from '../../src/scripts/rota-estado';

describe('estadoDaRolagem', () => {
  it('começa parado na primeira placa', () => {
    expect(estadoDaRolagem(0, 5)).toEqual({ ativa: 0, u: 0, andando: false });
  });
  it('termina parado na última placa', () => {
    expect(estadoDaRolagem(1, 5)).toEqual({ ativa: 4, u: 4, andando: false });
  });
  it('fica parado na placa durante 60% do trecho', () => {
    expect(estadoDaRolagem(0.11, 5)).toEqual({ ativa: 0, u: 0, andando: false });
  });
  it('anda entre placas no fim do trecho e troca a ativa na metade do caminho', () => {
    const indo = estadoDaRolagem(0.15, 5);
    expect(indo.andando).toBe(true);
    expect(indo.u).toBeGreaterThan(0);
    expect(indo.u).toBeLessThan(1);
    expect(indo.ativa).toBe(0);
    expect(estadoDaRolagem(0.19, 5).ativa).toBe(1);
  });
  it('u nunca volta para trás', () => {
    let anterior = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.005) {
      const { u } = estadoDaRolagem(p, 4);
      expect(u).toBeGreaterThanOrEqual(anterior);
      anterior = u;
    }
  });
  it('com uma placa só fica nela', () => {
    expect(estadoDaRolagem(0.7, 1)).toMatchObject({ ativa: 0, u: 0 });
  });
  it('limita progresso fora de 0..1', () => {
    expect(estadoDaRolagem(-3, 3)).toEqual(estadoDaRolagem(0, 3));
    expect(estadoDaRolagem(7, 3)).toEqual(estadoDaRolagem(1, 3));
  });
});

describe('estadoDoLoop', () => {
  it('começa antes da entrada, sem placa acesa', () => {
    expect(estadoDoLoop(0, 5)).toMatchObject({ u: -1, ativa: -1, andando: true });
  });
  it('termina depois da saída, sem placa acesa', () => {
    expect(estadoDoLoop(1, 5)).toMatchObject({ u: 5, ativa: -1 });
  });
  it('para em todas as placas, na ordem', () => {
    const paradas: number[] = [];
    for (let p = 0; p <= 1; p += 0.001) {
      const e = estadoDoLoop(p, 5);
      if (!e.andando) {
        expect(Number.isInteger(e.u)).toBe(true);
        expect(e.ativa).toBe(e.u);
        if (paradas[paradas.length - 1] !== e.u) paradas.push(e.u);
      }
    }
    expect(paradas).toEqual([0, 1, 2, 3, 4]);
  });
  it('u nunca volta para trás numa volta', () => {
    let anterior = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.002) {
      const { u } = estadoDoLoop(p, 4);
      expect(u).toBeGreaterThanOrEqual(anterior);
      anterior = u;
    }
  });
  it('a placa acesa percorre 0..total-1', () => {
    const acesas = new Set<number>();
    for (let p = 0; p <= 1; p += 0.002) acesas.add(estadoDoLoop(p, 4).ativa);
    expect([...acesas].sort()).toEqual([-1, 0, 1, 2, 3]);
  });
  it('a volta soma entrada, paradas, trechos e saída', () => {
    expect(unidadesDoLoop(5)).toBeCloseTo(0.7 + 5 + 4 * 0.6 + 0.7);
  });
});

describe('fracaoDoCarro', () => {
  const centros = [0.1, 0.3, 0.5, 0.7, 0.9];
  it('antes da entrada fica fora, à esquerda', () => {
    expect(fracaoDoCarro(-1, centros, 0.05)).toBeCloseTo(-0.05);
  });
  it('depois da saída fica fora, à direita', () => {
    expect(fracaoDoCarro(5, centros, 0.05)).toBeCloseTo(1.05);
  });
  it('em cada placa fica no centro dela', () => {
    centros.forEach((c, i) => expect(fracaoDoCarro(i, centros, 0.05)).toBeCloseTo(c));
  });
  it('no meio do caminho fica na média dos centros', () => {
    expect(fracaoDoCarro(1.5, [0.1, 0.2, 0.6], 0.05)).toBeCloseTo(0.4);
  });
  it('sem placas fica no meio', () => {
    expect(fracaoDoCarro(2, [], 0.05)).toBe(0.5);
  });
});

describe('tempos do loop', () => {
  const longos = { entrada: 0.7, parada: 7000 / 1500, trecho: 0.6, saida: 0.7 };
  it('aceita tempos diferentes do padrão', () => {
    expect(unidadesDoLoop(6, longos)).toBeCloseTo(0.7 + 6 * (7000 / 1500) + 5 * 0.6 + 0.7);
    expect(unidadesDoLoop(6)).toBeCloseTo(unidadesDoLoop(6, LOOP));
  });
  it('com tempos longos também para em todas as placas, na ordem', () => {
    const paradas: number[] = [];
    for (let p = 0; p <= 1; p += 0.0005) {
      const e = estadoDoLoop(p, 6, longos);
      if (!e.andando && paradas[paradas.length - 1] !== e.u) paradas.push(e.u);
    }
    expect(paradas).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it('a parada longa ocupa mais da volta que a padrão', () => {
    // Em unidades de tempo, de uma placa à seguinte: a parada mais o trecho.
    const fatia = (t?: typeof longos) => (inicioDaParada(1, 6, t) - inicioDaParada(0, 6, t)) * unidadesDoLoop(6, t);
    expect(fatia(longos)).toBeCloseTo(7000 / 1500 + 0.6, 4);
    expect(fatia()).toBeCloseTo(1.6, 4);
    // Pouco depois do início da parada 0, com a parada longa o carro ainda está nela.
    expect(estadoDoLoop(inicioDaParada(0, 6, longos) + 0.1, 6, longos)).toEqual({ ativa: 0, u: 0, andando: false });
  });
});

describe('inicioDaParada', () => {
  it('a parada 0 começa logo depois da entrada', () => {
    expect(inicioDaParada(0, 5)).toBeCloseTo(LOOP.entrada / unidadesDoLoop(5), 6);
  });
  for (const [nome, tempos] of [
    ['padrão', undefined],
    ['longos', { entrada: 0.7, parada: 7000 / 1500, trecho: 0.6, saida: 0.7 }],
    ['estranhos', { entrada: 0.3, parada: 2.2, trecho: 1.1, saida: 0.4 }],
  ] as const) {
    it(`no início de cada parada o carro está parado nela (tempos ${nome})`, () => {
      for (const total of [1, 4, 6]) {
        for (let i = 0; i < total; i++) {
          expect(estadoDoLoop(inicioDaParada(i, total, tempos), total, tempos)).toEqual({ ativa: i, u: i, andando: false });
        }
      }
    });
  }
  it('cresce com a parada e fica dentro de 0..1', () => {
    const inicios = [0, 1, 2, 3, 4, 5].map((i) => inicioDaParada(i, 6));
    inicios.forEach((v, i) => {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
      if (i) expect(v).toBeGreaterThan(inicios[i - 1]);
    });
  });
});
