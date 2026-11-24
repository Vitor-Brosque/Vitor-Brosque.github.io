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

/** Os outros projetos, na ordem da lista, começando pelo seguinte ao atual (e voltando ao início). */
export function outrosDaLista<T>(lista: readonly T[], indiceAtual: number): T[] {
  return Array.from({ length: Math.max(lista.length - 1, 0) }, (_, k) => lista[(indiceAtual + 1 + k) % lista.length]);
}
