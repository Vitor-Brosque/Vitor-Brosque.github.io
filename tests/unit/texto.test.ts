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
  describe('links', () => {
    it('converte [texto](https://…) em âncora com rel="noopener"', () => {
      expect(textoRico('veja [as fontes](https://exemplo.com/a/b?x=1)')).toBe(
        'veja <a href="https://exemplo.com/a/b?x=1" rel="noopener">as fontes</a>',
      );
    });
    it('não vira link quando a URL é http:// ou outro esquema', () => {
      expect(textoRico('[x](http://exemplo.com)')).toBe('[x](http://exemplo.com)');
      expect(textoRico('[x](javascript:alert(1))')).toBe('[x](javascript:alert(1))');
      expect(textoRico('[x](/relativo)')).toBe('[x](/relativo)');
    });
    it('aspas na URL não quebram o atributo', () => {
      const html = textoRico('[x](https://exemplo.com/"onmouseover="alert(1))');
      expect(html).not.toContain('"onmouseover');
      expect(html).toBe('<a href="https://exemplo.com/&quot;onmouseover=&quot;alert(1" rel="noopener">x</a>)');
    });
    it('escapa HTML no texto do link', () => {
      expect(textoRico('[<b>x</b>](https://exemplo.com)')).toBe(
        '<a href="https://exemplo.com" rel="noopener">&lt;b&gt;x&lt;/b&gt;</a>',
      );
    });
    it('convive com código e negrito na mesma frase', () => {
      expect(textoRico('use `withTenant()` e **sempre** leia [o guia](https://exemplo.com/guia).')).toBe(
        'use <code>withTenant()</code> e <strong>sempre</strong> leia <a href="https://exemplo.com/guia" rel="noopener">o guia</a>.',
      );
    });
    it('aceita negrito dentro do texto do link', () => {
      expect(textoRico('[**64** fontes](https://exemplo.com)')).toBe(
        '<a href="https://exemplo.com" rel="noopener"><strong>64</strong> fontes</a>',
      );
    });
  });
});

describe('paragrafos', () => {
  it('separa por linha em branco e descarta vazios', () => {
    expect(paragrafos('um\n\ndois\n  \n\ntrês\n')).toEqual(['um', 'dois', 'três']);
  });
});
