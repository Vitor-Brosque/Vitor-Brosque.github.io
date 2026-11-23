import { describe, expect, it } from 'vitest';
import { PERIODO, proximoDeslocamento } from '../../src/scripts/estrada-calculo';

describe('proximoDeslocamento', () => {
  it('anda devagar sem rolagem', () => {
    expect(proximoDeslocamento(0, 16, 0)).toBeCloseTo(-0.96);
  });
  it('acelera com a rolagem, com teto', () => {
    expect(proximoDeslocamento(0, 16, 10)).toBeCloseTo(-8.96);
    expect(proximoDeslocamento(0, 16, 5000)).toBeCloseTo(-40.96);
  });
  it('volta dentro de um período do tracejado', () => {
    const r = proximoDeslocamento(-67.5, 16, 10);
    expect(r).toBeCloseTo(-8.46);
    expect(r).toBeGreaterThan(-PERIODO);
  });
});
