export interface EstadoVideo {
  visivel: boolean;
  movimentoReduzido: boolean;
  escolhaDoUsuario: 'tocar' | 'pausar' | null;
}

export function deveTocar(e: EstadoVideo): boolean {
  if (!e.visivel) return false;
  if (e.escolhaDoUsuario) return e.escolhaDoUsuario === 'tocar';
  return !e.movimentoReduzido;
}
