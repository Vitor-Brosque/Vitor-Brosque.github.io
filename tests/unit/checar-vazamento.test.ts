import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const caminhoDoScript = resolve(__dirname, '..', '..', 'scripts', 'checar-vazamento.mjs');
const TERMO = 'segredo-de-teste';
const temporarios: string[] = [];

function novoDir() {
  const dir = mkdtempSync(join(tmpdir(), 'vazamento-'));
  temporarios.push(dir);
  return dir;
}

function lista(dir: string, conteudo: string) {
  const caminho = join(dir, 'termos.txt');
  writeFileSync(caminho, conteudo);
  return caminho;
}

function rodar(dir: string, termos: string, ...args: string[]) {
  return spawnSync(process.execPath, [caminhoDoScript, ...args], {
    cwd: dir,
    env: { ...process.env, TERMOS_PROIBIDOS: termos },
    encoding: 'utf8',
  });
}

function dist(dir: string, arquivos: Record<string, string | Buffer> = {}) {
  mkdirSync(join(dir, 'dist'));
  for (const [nome, conteudo] of Object.entries(arquivos)) writeFileSync(join(dir, 'dist', nome), conteudo);
}

afterEach(() => {
  for (const d of temporarios.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('checar-vazamento CLI', () => {
  it('lista ausente com --obrigatorio falha', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'ok' });
    expect(rodar(dir, join(dir, 'nao-existe.txt'), '--obrigatorio').status).toBe(1);
  });
  it('lista ausente sem a flag passa', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'ok' });
    expect(rodar(dir, join(dir, 'nao-existe.txt')).status).toBe(0);
  });
  it('lista só com comentários e --obrigatorio falha', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'ok' });
    expect(rodar(dir, lista(dir, '# nada\n\n'), '--obrigatorio').status).toBe(1);
  });
  it('lista só com comentários sem a flag avisa e passa', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'ok' });
    expect(rodar(dir, lista(dir, '# nada\n')).status).toBe(0);
  });
  it('dist/ ausente falha', () => {
    const dir = novoDir();
    expect(rodar(dir, lista(dir, TERMO), '--obrigatorio').status).toBe(1);
  });
  it('dist/ vazio falha', () => {
    const dir = novoDir();
    dist(dir);
    expect(rodar(dir, lista(dir, TERMO), '--obrigatorio').status).toBe(1);
    expect(rodar(dir, lista(dir, TERMO)).status).toBe(1);
  });
  it('dist/ limpo passa e relata contagens', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'limpo', 'foto.png': Buffer.from([137, 80, 78, 71]) });
    const r = rodar(dir, lista(dir, TERMO), '--obrigatorio');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('1 arquivos lidos, 1 binários ignorados');
  });
  it('termo em index.html falha com VAZAMENTO', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': `x ${TERMO} y` });
    const r = rodar(dir, lista(dir, TERMO), '--obrigatorio');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('VAZAMENTO');
  });
  it.each(['site.webmanifest', 'CNAME'])('termo em %s falha', (nome) => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'limpo', [nome]: TERMO });
    expect(rodar(dir, lista(dir, TERMO), '--obrigatorio').status).toBe(1);
  });
  it('termo só em arquivo binário não é detectado (limite documentado)', () => {
    const dir = novoDir();
    dist(dir, { 'index.html': 'limpo', 'foto.png': TERMO });
    expect(rodar(dir, lista(dir, TERMO), '--obrigatorio').status).toBe(0);
  });
});
