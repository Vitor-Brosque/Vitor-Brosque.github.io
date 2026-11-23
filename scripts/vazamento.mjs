// @ts-check

/** @param {string} conteudo @returns {string[]} */
export function lerTermos(conteudo) {
  return conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/** @param {string} texto @param {string[]} termos @returns {string[]} */
export function encontrarTermos(texto, termos) {
  const minusculo = texto.toLowerCase();
  return termos.filter((termo) => minusculo.includes(termo.toLowerCase()));
}
