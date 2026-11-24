/** Quanto da página já foi lido, de 0 (topo) a 1 (fim). Página que cabe na janela conta como lida. */
export function fracaoDeLeitura(rolagem: number, alturaDoc: number, alturaJanela: number): number {
  const total = alturaDoc - alturaJanela;
  if (total <= 0) return 1;
  return Math.min(Math.max(rolagem / total, 0), 1);
}

/** Largura preenchida da barra de XP, em px: só blocos inteiros, e o trilho todo quando a leitura chega ao fim. */
export function larguraDaBarra(fracao: number, trilho: number, bloco: number): number {
  if (fracao >= 1) return trilho;
  return Math.floor((fracao * trilho) / bloco) * bloco;
}
