import { describe, expect, it } from 'vitest';
import { langHtml, paraIdioma, t, ui, urlDaHome, urlDoProjeto, urlEquivalente } from '../../src/i18n/ui';

describe('paraIdioma', () => {
  it('usa pt como padrão', () => {
    expect(paraIdioma(undefined)).toBe('pt');
    expect(paraIdioma('pt')).toBe('pt');
    expect(paraIdioma('fr')).toBe('pt');
  });
  it('reconhece en', () => expect(paraIdioma('en')).toBe('en'));
});

describe('langHtml', () => {
  it('mapeia para o atributo lang', () => {
    expect(langHtml('pt')).toBe('pt-BR');
    expect(langHtml('en')).toBe('en');
  });
});

describe('t', () => {
  it('traduz chaves', () => {
    expect(t('pt', 'nav.projetos')).toBe('Projetos');
    expect(t('en', 'nav.projetos')).toBe('Projects');
  });
  it('tem as mesmas chaves nos dois idiomas', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.pt).sort());
  });
});

describe('urls', () => {
  it('monta a home com e sem âncora', () => {
    expect(urlDaHome('pt')).toBe('/');
    expect(urlDaHome('en')).toBe('/en/');
    expect(urlDaHome('pt', 'contato')).toBe('/#contato');
    expect(urlDaHome('en', 'contato')).toBe('/en/#contato');
  });
  it('monta a url do projeto', () => {
    expect(urlDoProjeto('pt', 'life-rpg')).toBe('/projetos/life-rpg/');
    expect(urlDoProjeto('en', 'life-rpg')).toBe('/en/projects/life-rpg/');
  });
});

describe('urlEquivalente', () => {
  it('troca a home', () => {
    expect(urlEquivalente('/', 'en')).toBe('/en/');
    expect(urlEquivalente('/en/', 'pt')).toBe('/');
    expect(urlEquivalente('/en', 'pt')).toBe('/');
  });
  it('troca a página do projeto mantendo o slug', () => {
    expect(urlEquivalente('/projetos/life-rpg/', 'en')).toBe('/en/projects/life-rpg/');
    expect(urlEquivalente('/en/projects/technews', 'pt')).toBe('/projetos/technews/');
    expect(urlEquivalente('/projetos/rodoviariaos/', 'pt')).toBe('/projetos/rodoviariaos/');
  });
  it('cai na home do destino quando não reconhece o caminho', () => {
    expect(urlEquivalente('/404/', 'en')).toBe('/en/');
    expect(urlEquivalente('/qualquer/coisa/', 'pt')).toBe('/');
  });
});
