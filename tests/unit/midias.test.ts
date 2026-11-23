import { readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONTEUDO = join('src', 'content', 'projetos');
const PRINTS = join('src', 'assets', 'projetos');
const VIDEOS = join('public', 'media');

/** Campos de mídia de um YAML de projeto, na ordem em que aparecem. O que muda por idioma (alt e legenda) fica de fora. */
function midiasDe(idioma: string, arquivo: string): string[] {
  const texto = readFileSync(join(CONTEUDO, idioma, arquivo), 'utf8');
  return [...texto.matchAll(/^\s*(imagem|video|proporcao|moldura):\s*(\S.*?)\s*$/gm)].map((m) => `${m[1]}: ${m[2]}`);
}

/** Todos os arquivos de uma pasta, com caminho relativo a ela e barras normais. */
function arquivosDe(pasta: string): string[] {
  return readdirSync(pasta, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => join(e.parentPath, e.name).slice(pasta.length + 1).split(sep).join('/'));
}

const projetos = readdirSync(join(CONTEUDO, 'pt')).filter((a) => a.endsWith('.yaml'));
const referencias = ['pt', 'en'].flatMap((idioma) => projetos.flatMap((p) => midiasDe(idioma, p)));
/** Caminhos usados nos YAML, no mesmo formato das pastas: `<projeto>/<arquivo>`. */
const usados = (campo: string, prefixo: string) =>
  new Set(
    referencias
      .filter((r) => r.startsWith(`${campo}: `) && r.includes(prefixo))
      .map((r) => r.slice(r.indexOf(prefixo) + prefixo.length)),
  );
const printsUsados = usados('imagem', '/assets/projetos/');
const videosUsados = usados('video', '/media/');

describe('mídias dos projetos', () => {
  it('encontra os projetos e as mídias (o teste não passa por lista vazia)', () => {
    expect(projetos.length).toBeGreaterThanOrEqual(3);
    expect(midiasDe('pt', 'rodoviariaos.yaml').length).toBeGreaterThan(5);
    expect(printsUsados.has('rodoviariaos/painel-do-dia.png')).toBe(true);
    expect(videosUsados.has('rodoviariaos/assistente.mp4')).toBe(true);
  });

  it.each(projetos)('%s usa as mesmas mídias em português e em inglês', (arquivo) => {
    expect(midiasDe('en', arquivo)).toEqual(midiasDe('pt', arquivo));
  });

  it('todo print da pasta de prints é usado por algum projeto', () => {
    const sobrando = arquivosDe(PRINTS).filter((a) => !printsUsados.has(a));
    expect(sobrando).toEqual([]);
  });

  it('todo vídeo publicado é usado por algum projeto', () => {
    const sobrando = arquivosDe(VIDEOS).filter((a) => a.endsWith('.mp4') && !videosUsados.has(a));
    expect(sobrando).toEqual([]);
  });
});
