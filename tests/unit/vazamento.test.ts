import { describe, expect, it } from 'vitest';
import { ehBinario, encontrarTermos, lerTermos } from '../../scripts/vazamento.mjs';

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
  it('acha termo composto em texto decomposto e vice-versa', () => {
    const composto = 'não simples';
    const decomposto = 'nao simples'.replace('a', 'ã');
    expect(decomposto).not.toBe(composto);
    expect(encontrarTermos(`texto ${decomposto} aqui`, [composto])).toEqual([composto]);
    expect(encontrarTermos(`texto ${composto} aqui`, [decomposto])).toEqual([decomposto]);
  });
});

describe('ehBinario', () => {
  it.each(['foto.PNG', 'fonte.woff2', 'demo.mp4'])('%s é binário', (n) => {
    expect(ehBinario(n)).toBe(true);
  });
  it.each(['index.html', 'site.webmanifest', 'CNAME', 'legenda.vtt'])('%s não é binário', (n) => {
    expect(ehBinario(n)).toBe(false);
  });
});
