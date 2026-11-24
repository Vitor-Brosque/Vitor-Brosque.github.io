/** Níveis que o log do TechNews usa (`logging` do Python, formato `%(asctime)s | %(levelname)s | %(message)s`). */
export type NivelDoLog = 'INFO' | 'WARNING' | 'ERROR';

export type ParteDoLog =
  | { tipo: 'log'; data: string; nivel: NivelDoLog; mensagem: string }
  | { tipo: 'comando'; comando: string }
  | { tipo: 'texto'; texto: string };

const LINHA = /^(?:(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) \| )?(INFO|WARNING|ERROR) \| (.+)$/;

/** Separa uma linha do log (com ou sem a data) em data, nível e mensagem, para o nível ganhar a cor; `$ ...` é comando. */
export function partesDoLog(linha: string): ParteDoLog {
  if (linha.startsWith('$ ')) return { tipo: 'comando', comando: linha.slice(2) };
  const m = linha.match(LINHA);
  if (!m) return { tipo: 'texto', texto: linha };
  return { tipo: 'log', data: m[1] ?? '', nivel: m[2] as NivelDoLog, mensagem: m[3] };
}
