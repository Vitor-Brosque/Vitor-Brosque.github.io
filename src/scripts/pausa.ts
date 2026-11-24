import { aoCarregarPagina } from './ciclo';

/**
 * Uma pausa só para a página: para a rua da estrada e as rotas em loop. Os botões de pausa
 * (o da rota grande, com texto, e o da estrada do topo, só com ícone) mostram e mudam o mesmo estado.
 * Começa rodando a cada carregamento e volta a rodar na limpeza, antes da troca de página do ClientRouter.
 */
type Ouvinte = (pausado: boolean) => void;

let pausado = false;
let botoes: HTMLButtonElement[] = [];
const ouvintes = new Set<Ouvinte>();

export const estaPausado = (): boolean => pausado;

/** Avisa `f` a cada troca do estado. Devolve a função que para de avisar (chame na limpeza de quem ouve). */
export function aoMudarPausa(f: Ouvinte): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

function mostrar() {
  for (const b of botoes) {
    const texto = (pausado ? b.dataset.continuar : b.dataset.pausar) ?? '';
    // O botão só com ícone troca o aria-label; o outro, o texto. Sem aria-pressed: o leitor de tela diria "Continuar, pressionado".
    if (b.hasAttribute('aria-label')) b.setAttribute('aria-label', texto);
    else b.textContent = texto;
    b.toggleAttribute('data-pausada', pausado);
  }
}

export function definirPausa(valor: boolean): void {
  if (pausado === valor) return;
  pausado = valor;
  mostrar();
  ouvintes.forEach((f) => f(pausado));
}

const alternar = () => definirPausa(!pausado);

aoCarregarPagina(() => {
  pausado = false;
  botoes = [...document.querySelectorAll<HTMLButtonElement>('[data-rota-pausa], [data-estrada-pausa]')];
  mostrar();
  botoes.forEach((b) => b.addEventListener('click', alternar));
  return () => {
    botoes.forEach((b) => b.removeEventListener('click', alternar));
    botoes = [];
    pausado = false;
    ouvintes.clear();
  };
});
