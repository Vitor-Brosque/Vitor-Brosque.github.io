import type { Idioma } from '../i18n/ui';

export function slugDe(id: string): string {
  const partes = id.split('/');
  return partes[partes.length - 1];
}

export function idiomaDe(id: string): Idioma {
  return id.startsWith('en/') ? 'en' : 'pt';
}

export function ordenarPorOrdem<T extends { data: { ordem: number } }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => a.data.ordem - b.data.ordem);
}

export function proximoDaLista<T>(lista: readonly T[], indiceAtual: number): T {
  if (lista.length === 0) throw new Error('lista vazia');
  return lista[(indiceAtual + 1) % lista.length];
}
