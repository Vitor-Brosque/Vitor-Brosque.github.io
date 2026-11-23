// @ts-check
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { encontrarTermos, lerTermos } from './vazamento.mjs';

const obrigatorio = process.argv.includes('--obrigatorio');
const caminhoLista = process.env.TERMOS_PROIBIDOS ?? resolve('..', 'portfolio-conteudo', 'termos-proibidos.txt');
const pasta = resolve('dist');
const EXTENSOES = new Set(['.html', '.xml', '.txt', '.js', '.json', '.css', '.svg']);

if (!existsSync(caminhoLista)) {
  const msg = `Lista de termos proibidos não encontrada em ${caminhoLista}.`;
  if (obrigatorio) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`${msg} Checagem ignorada.`);
  process.exit(0);
}
if (!existsSync(pasta)) {
  console.error('A pasta dist/ não existe. Rode npm run build antes.');
  process.exit(1);
}

const termos = lerTermos(await readFile(caminhoLista, 'utf8'));

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* arquivos(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(caminho);
    else if (EXTENSOES.has(extname(e.name))) yield caminho;
  }
}

let achados = 0;
for await (const arquivo of arquivos(pasta)) {
  for (const termo of encontrarTermos(await readFile(arquivo, 'utf8'), termos)) {
    console.error(`VAZAMENTO: "${termo}" em ${arquivo}`);
    achados++;
  }
}
if (achados > 0) {
  console.error(`${achados} ocorrência(s). Corrija antes de publicar.`);
  process.exit(1);
}
console.log(`Nenhum dos ${termos.length} termos proibidos aparece em dist/.`);
