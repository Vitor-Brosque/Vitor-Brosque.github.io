import { describe, expect, it } from 'vitest';
import { encontrarTermos, lerTermos } from '../../scripts/vazamento.mjs';

describe('lerTermos', () => {
  it('ignora linhas vazias e comentários', () => {
    expect(lerTermos('# comentário\nfoo\n\n  Bar  \r\n#outro\n')).toEqual(['foo', 'Bar']);
  });
});

describe('encontrarTermos', () => {
  it('acha sem diferenciar maiúsculas', () => {
    expect(encontrarTermos('Texto com SEGREDO aqui', ['segredo', 'outro'])).toEqual(['segredo']);
  });
  it('devolve vazio quando não há nada', () => {
    expect(encontrarTermos('limpo', ['segredo'])).toEqual([]);
  });
});
