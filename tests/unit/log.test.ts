import { describe, expect, it } from 'vitest';
import { partesDoLog } from '../../src/lib/log';

describe('partesDoLog', () => {
  it('separa data, nível e mensagem de uma linha no formato do TechNews', () => {
    expect(partesDoLog('2026-11-23 10:12:09,131 | INFO | EXTRACAO_OK | ID = 46013377')).toEqual({
      tipo: 'log',
      data: '2026-11-23 10:12:09,131',
      nivel: 'INFO',
      mensagem: 'EXTRACAO_OK | ID = 46013377',
    });
  });
  it('aceita a linha sem data (a da etapa da rota)', () => {
    expect(partesDoLog('WARNING | SEM_URL_OU_TITULO | ID = 46012907')).toEqual({
      tipo: 'log',
      data: '',
      nivel: 'WARNING',
      mensagem: 'SEM_URL_OU_TITULO | ID = 46012907',
    });
    expect(partesDoLog('ERROR | NOTICIA_REJEITADA | ID = 1')).toMatchObject({ tipo: 'log', nivel: 'ERROR' });
  });
  it('reconhece um comando de shell', () => {
    expect(partesDoLog('$ python scr/main.py')).toEqual({ tipo: 'comando', comando: 'python scr/main.py' });
  });
  it('o que não é log nem comando volta como texto', () => {
    expect(partesDoLog('qualquer coisa')).toEqual({ tipo: 'texto', texto: 'qualquer coisa' });
    expect(partesDoLog('DEBUG | X')).toEqual({ tipo: 'texto', texto: 'DEBUG | X' });
  });
});
