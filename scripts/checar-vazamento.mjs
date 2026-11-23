// @ts-check
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { ehBinario, encontrarTermos, lerTermos } from './vazamento.mjs';

const obrigatorio = process.argv.includes('--obrigatorio');
const caminhoLista = process.env.TERMOS_PROIBIDOS ?? resolve('..', 'portfolio-conteudo', 'termos-proibidos.txt');
const pasta = resolve('dist');

/** Lista inutilizável: falha com a flag, avisa e segue sem ela. @param {string} msg */
function listaInutil(msg) {
  if (obrigatorio) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(`${msg} Checagem ignorada.`);
  process.exit(0);
}

if (!existsSync(caminhoLista)) listaInutil(`Lista de termos proibidos não encontrada em ${caminhoLista}.`);
const termos = lerTermos(await readFile(caminhoLista, 'utf8'));
if (termos.length === 0) listaInutil(`Lista de termos proibidos vazia em ${caminhoLista}.`);
if (!existsSync(pasta)) {
  console.error('A pasta dist/ não existe. Rode npm run build antes.');
  process.exit(1);
}

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* arquivos(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) yield* arquivos(caminho);
    else yield caminho;
  }
}

let achados = 0;
let lidos = 0;
let ignorados = 0;
for await (const arquivo of arquivos(pasta)) {
  if (ehBinario(arquivo)) {
    ignorados++;
    continue;
  }
  lidos++;
  for (const termo of encontrarTermos(await readFile(arquivo, 'utf8'), termos)) {
    console.error(`VAZAMENTO: "${termo}" em ${arquivo}`);
    achados++;
  }
}
if (lidos === 0) {
  console.error('Nenhum arquivo foi lido em dist/ (build vazio). Rode npm run build antes.');
  process.exit(1);
}
if (achados > 0) {
  console.error(`${achados} ocorrência(s). Corrija antes de publicar.`);
  process.exit(1);
}
console.log(`Nenhum dos ${termos.length} termos proibidos aparece em dist/ (${lidos} arquivos lidos, ${ignorados} binários ignorados).`);
