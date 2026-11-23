import { getCollection, type CollectionEntry } from 'astro:content';
import type { Idioma } from '../i18n/ui';
import { idiomaDe, ordenarPorOrdem } from './projetos-puro';

export type Projeto = CollectionEntry<'projetos'>;
export type DadosProjeto = Projeto['data'];
export type Midia = NonNullable<DadosProjeto['capa']>;
export type Parada = DadosProjeto['rota']['paradas'][number];

export async function projetosDoIdioma(idioma: Idioma): Promise<Projeto[]> {
  const todos = await getCollection('projetos', (e: Projeto) => idiomaDe(e.id) === idioma);
  return ordenarPorOrdem(todos);
}
