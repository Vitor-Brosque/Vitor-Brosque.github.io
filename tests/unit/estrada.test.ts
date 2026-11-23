import { describe, expect, it } from 'vitest';
import { PERIODO, proximoDeslocamento } from '../../src/scripts/estrada-calculo';

describe('proximoDeslocamento', () => {
  it('anda sozinho sem rolagem (0.14 px/ms)', () => {
    expect(proximoDeslocamento(0, 16, 0)).toBeCloseTo(-2.24);
  });
  it('acelera com a rolagem, com teto', () => {
    expect(proximoDeslocamento(0, 16, 10)).toBeCloseTo(-10.24);
    expect(proximoDeslocamento(0, 16, 5000)).toBeCloseTo(-42.24);
  });
  it('volta dentro de um período do tracejado', () => {
    const r = proximoDeslocamento(-67.5, 16, 10);
    expect(r).toBeCloseTo(-9.74);
    expect(r).toBeGreaterThan(-PERIODO);
  });
});
