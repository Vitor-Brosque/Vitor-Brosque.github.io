import { describe, expect, it } from 'vitest';
import { escaparHtml, paragrafos, textoRico } from '../../src/lib/texto';

describe('escaparHtml', () => {
  it('escapa os caracteres especiais', () => {
    expect(escaparHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});

describe('textoRico', () => {
  it('converte crase em <code> e asteriscos duplos em <strong>', () => {
    expect(textoRico('use `withTenant()` **sempre**')).toBe('use <code>withTenant()</code> <strong>sempre</strong>');
  });
  it('escapa HTML antes de formatar', () => {
    expect(textoRico('`<script>`')).toBe('<code>&lt;script&gt;</code>');
  });
});

describe('paragrafos', () => {
  it('separa por linha em branco e descarta vazios', () => {
    expect(paragrafos('um\n\ndois\n  \n\ntrês\n')).toEqual(['um', 'dois', 'três']);
  });
});
