import { describe, expect, it } from 'vitest';
import { deveTocar } from '../../src/scripts/video-estado';

describe('deveTocar', () => {
  it('nunca toca fora da tela', () => {
    expect(deveTocar({ visivel: false, movimentoReduzido: false, escolhaDoUsuario: 'tocar' })).toBe(false);
  });
  it('toca sozinho quando visível e com movimento liberado', () => {
    expect(deveTocar({ visivel: true, movimentoReduzido: false, escolhaDoUsuario: null })).toBe(true);
  });
  it('não toca sozinho com movimento reduzido', () => {
    expect(deveTocar({ visivel: true, movimentoReduzido: true, escolhaDoUsuario: null })).toBe(false);
  });
  it('a escolha do usuário vence quando visível', () => {
    expect(deveTocar({ visivel: true, movimentoReduzido: true, escolhaDoUsuario: 'tocar' })).toBe(true);
    expect(deveTocar({ visivel: true, movimentoReduzido: false, escolhaDoUsuario: 'pausar' })).toBe(false);
  });
});
