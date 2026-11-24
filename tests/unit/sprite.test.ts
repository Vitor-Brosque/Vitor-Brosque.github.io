import { describe, expect, it } from 'vitest';
import { lerSvg, spriteInline, spriteQuadros } from '../../src/lib/sprite';

const exportado = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="128" height="128" shape-rendering="crispEdges">
<title>Faísca, quadro 1</title>
<rect x="6" y="0" width="4" height="1" fill="#9a5c1c"/>
<rect x="5" y="1" width="1" height="1" fill="#1a1220"/>
</svg>
`;

describe('lerSvg', () => {
  it('pega o viewBox e só os retângulos, sem título nem tamanho fixo', () => {
    const { viewBox, corpo } = lerSvg(exportado);
    expect(viewBox).toBe('0 0 16 16');
    expect(corpo).toBe('<rect x="6" y="0" width="4" height="1" fill="#9a5c1c"/><rect x="5" y="1" width="1" height="1" fill="#1a1220"/>');
  });
  it('recusa um arquivo sem viewBox', () => {
    expect(() => lerSvg('<svg><rect/></svg>')).toThrow(/viewBox/);
  });
});

describe('spriteInline', () => {
  it('monta um SVG decorativo, nítido, com a classe pedida', () => {
    const svg = spriteInline(exportado, 'lanterna');
    expect(svg).toMatch(/^<svg class="lanterna" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" focusable="false">/);
    expect(svg).not.toMatch(/<title>|width="128"/);
    expect(svg.match(/<rect /g)).toHaveLength(2);
  });
});

describe('spriteQuadros', () => {
  it('põe cada quadro num grupo numerado, no mesmo SVG', () => {
    const svg = spriteQuadros([exportado, exportado.replace('#9a5c1c', '#ffd447')], 'lanterna');
    expect(svg).toContain('<g class="quadro quadro-1"><rect x="6"');
    expect(svg).toContain('<g class="quadro quadro-2"><rect x="6" y="0" width="4" height="1" fill="#ffd447"/>');
  });
  it('recusa quadros de tamanhos diferentes', () => {
    expect(() => spriteQuadros([exportado, exportado.replace('0 0 16 16', '0 0 24 24')], 'x')).toThrow(/tamanho/);
  });
});
