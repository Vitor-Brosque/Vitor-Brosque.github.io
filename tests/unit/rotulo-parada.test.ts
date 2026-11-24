import { describe, expect, it } from 'vitest';
import { rotuloDaParada } from '../../src/i18n/ui';

describe('rotuloDaParada', () => {
  it('na rodovia é KM, a partir do zero, nos dois idiomas', () => {
    expect(rotuloDaParada('pt', 'rodovia', 0)).toEqual({ prefixo: 'KM', numero: 0 });
    expect(rotuloDaParada('en', 'rodovia', 3)).toEqual({ prefixo: 'KM', numero: 3 });
  });
  it('no tema rpg é o marco da jornada, contado a partir de 1', () => {
    expect(rotuloDaParada('pt', 'rpg', 0)).toEqual({ prefixo: 'Marco', numero: 1 });
    expect(rotuloDaParada('en', 'rpg', 4)).toEqual({ prefixo: 'Milestone', numero: 5 });
  });
  it('no tema terminal é a etapa do pipeline, contada a partir de 1', () => {
    expect(rotuloDaParada('pt', 'terminal', 0)).toEqual({ prefixo: 'Etapa', numero: 1 });
    expect(rotuloDaParada('en', 'terminal', 2)).toEqual({ prefixo: 'Stage', numero: 3 });
  });
});
