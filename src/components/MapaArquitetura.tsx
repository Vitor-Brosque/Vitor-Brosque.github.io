import { useEffect, useId, useMemo, useRef, useState } from 'react';
import '../styles/mapa.css';
import { ALTURA_NO, LARGURA_NO, caixaDoNo, caminhoDaFaixa, dimensoesDoMapa, faixasDoNo, type FaixaMapa, type NoMapa } from '../lib/mapa';

interface Props {
  nos: NoMapa[];
  faixas: FaixaMapa[];
  rotulo: string;
  dica: string;
  todas: string;
}

interface SvgProps {
  nos: NoMapa[];
  faixas: FaixaMapa[];
  rotulo: string;
  transposto: boolean;
  prefixo: string;
  animar: boolean;
  selecionado: string | null;
  ativas: Set<number>;
  porId: Map<string, NoMapa>;
  aoSelecionar: (id: string) => void;
}

function SvgMapa({ nos, faixas, rotulo, transposto, prefixo, animar, selecionado, ativas, porId, aoSelecionar }: SvgProps) {
  const { largura, altura } = dimensoesDoMapa(nos, transposto);
  return (
    <svg
      className={`mapa-svg ${transposto ? 'mapa-svg--vertical' : 'mapa-svg--largo'}`}
      viewBox={`0 0 ${largura} ${altura}`}
      role="group"
      aria-label={rotulo}
    >
        {faixas.map((f, i) => {
          const de = porId.get(f.de);
          const para = porId.get(f.para);
          if (!de || !para) return null;
          const d = caminhoDaFaixa(caixaDoNo(de, transposto), caixaDoNo(para, transposto));
          const id = `${prefixo}-f${i}`;
          return (
            <g key={id} className={`mapa-faixa${ativas.has(i) ? ' is-ativa' : ''}`}>
              <path id={id} d={d} className="mapa-asfalto" />
              <path d={d} className="mapa-tracejado" />
              {animar && (
                <rect className="mapa-pacote" width="10" height="10" x="-5" y="-5" rx="1">
                  <animateMotion dur={`${2 + (i % 3) * 0.5}s`} begin={`${((i * 0.37) % 1.5).toFixed(2)}s`} repeatCount="indefinite">
                    <mpath href={`#${id}`} />
                  </animateMotion>
                </rect>
              )}
            </g>
          );
        })}
        {nos.map((n) => {
          const c = caixaDoNo(n, transposto);
          const ativo = selecionado === n.id;
          return (
            <g
              key={n.id}
              className={`mapa-no${n.destaque ? ' is-destaque' : ''}${ativo ? ' is-ativo' : ''}`}
              transform={`translate(${c.x} ${c.y})`}
              tabIndex={0}
              role="button"
              aria-pressed={ativo}
              aria-label={`${n.rotulo}: ${n.detalhe}`}
              onMouseEnter={() => aoSelecionar(n.id)}
              onFocus={() => aoSelecionar(n.id)}
              onClick={() => aoSelecionar(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  aoSelecionar(n.id);
                }
              }}
            >
              <rect width={LARGURA_NO} height={ALTURA_NO} rx="8" />
              <text x="14" y="27" className="mapa-rotulo">{n.rotulo}</text>
              <text x="14" y="46" className="mapa-detalhe">{n.detalhe}</text>
            </g>
          );
        })}
    </svg>
  );
}

export default function MapaArquitetura({ nos, faixas, rotulo, dica, todas }: Props) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [movimentoOk, setMovimentoOk] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const prefixo = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const atualizar = () => setMovimentoOk(!mq.matches);
    atualizar();
    mq.addEventListener('change', atualizar);
    return () => mq.removeEventListener('change', atualizar);
  }, []);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const porId = useMemo(() => new Map(nos.map((n) => [n.id, n])), [nos]);
  const ativas = useMemo(() => new Set(selecionado ? faixasDoNo(selecionado, faixas) : []), [selecionado, faixas]);
  const atual = selecionado ? porId.get(selecionado) : undefined;
  const animar = movimentoOk && visivel;
  const comum = { nos, faixas, rotulo, animar, selecionado, ativas, porId, aoSelecionar: setSelecionado };

  return (
    <div className="mapa" ref={caixa}>
      <SvgMapa {...comum} transposto={false} prefixo={`${prefixo}-l`} />
      <SvgMapa {...comum} transposto prefixo={`${prefixo}-v`} />
      <div className="mapa-explicacao" aria-live="polite">
        {atual ? (
          <>
            <strong>{atual.rotulo}</strong>
            <p>{atual.explicacao}</p>
          </>
        ) : (
          <p className="mapa-dica">{dica}</p>
        )}
      </div>
      <details className="mapa-todas">
        <summary>{todas}</summary>
        <dl>
          {nos.map((n) => (
            <div key={n.id}>
              <dt>{n.rotulo}</dt>
              <dd>{n.explicacao}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
