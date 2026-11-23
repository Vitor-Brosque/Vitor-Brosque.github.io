// @ts-check

const BINARIOS = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.bmp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.webm', '.mov', '.mp3', '.ogg', '.wav',
  '.zip', '.gz', '.br', '.pdf',
]);

/** @param {string} conteudo @returns {string[]} */
export function lerTermos(conteudo) {
  return conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/** @param {string} s @returns {string} */
const normalizar = (s) => s.normalize('NFC').toLowerCase();

/** @param {string} texto @param {string[]} termos @returns {string[]} */
export function encontrarTermos(texto, termos) {
  const base = normalizar(texto);
  return termos.filter((termo) => base.includes(normalizar(termo)));
}

/** @param {string} nomeDoArquivo @returns {boolean} */
export function ehBinario(nomeDoArquivo) {
  const i = nomeDoArquivo.lastIndexOf('.');
  return i > 0 && BINARIOS.has(nomeDoArquivo.slice(i).toLowerCase());
}
