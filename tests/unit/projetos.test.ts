import { describe, expect, it } from 'vitest';
import { idiomaDe, ordenarPorOrdem, outrosDaLista, slugDe } from '../../src/lib/projetos-puro';

describe('slugDe / idiomaDe', () => {
  it('extrai slug e idioma do id da entrada', () => {
    expect(slugDe('pt/life-rpg')).toBe('life-rpg');
    expect(idiomaDe('pt/life-rpg')).toBe('pt');
    expect(idiomaDe('en/technews')).toBe('en');
  });
});

describe('ordenarPorOrdem', () => {
  it('ordena sem mudar a lista original', () => {
    const lista = [{ data: { ordem: 3 } }, { data: { ordem: 1 } }, { data: { ordem: 2 } }];
    expect(ordenarPorOrdem(lista).map((p) => p.data.ordem)).toEqual([1, 2, 3]);
    expect(lista[0].data.ordem).toBe(3);
  });
});

describe('outrosDaLista', () => {
  it('traz os outros, na ordem, a partir do seguinte ao atual', () => {
    expect(outrosDaLista(['a', 'b', 'c'], 0)).toEqual(['b', 'c']);
    expect(outrosDaLista(['a', 'b', 'c'], 1)).toEqual(['c', 'a']);
    expect(outrosDaLista(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });
  it('com um item só não há outros', () => {
    expect(outrosDaLista(['a'], 0)).toEqual([]);
  });
});
