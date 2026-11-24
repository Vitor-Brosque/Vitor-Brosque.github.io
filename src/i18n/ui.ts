export const idiomas = ['pt', 'en'] as const;
export type Idioma = (typeof idiomas)[number];

export const ui = {
  pt: {
    'nav.rotulo': 'Principal',
    'nav.inicio': 'Início',
    'nav.projetos': 'Projetos',
    'nav.trajetoria': 'Trajetória',
    'nav.contato': 'Contato',
    'nav.trocarIdioma': 'EN',
    'nav.trocarIdiomaAria': 'Ver esta página em inglês',
    pular: 'Pular para o conteúdo',
    'destaque.problema': 'O problema',
    'destaque.construi': 'O que eu construí',
    'destaque.orgulho': 'Do que me orgulho',
    'card.verCaso': 'Ver estudo de caso',
    'rota.aoVivo': 'ao vivo',
    'rota.pausar': 'Pausar',
    'rota.continuar': 'Continuar',
    'rota.dica': 'Escolha uma parada',
    'rota.marco': 'Marco',
    'rota.etapa': 'Etapa',
    'terminal.resumo': 'resumo',
    'terminal.logRotulo': 'Log do pipeline (technews.log)',
    'terminal.logLegenda': 'Formato real do log do projeto. IDs e horários de exemplo.',
    'animacoes.pausar': 'Pausar animações',
    'animacoes.continuar': 'Continuar animações',
    'midia.tocar': 'Tocar vídeo',
    'midia.pausar': 'Pausar vídeo',
    'midia.ampliar': 'Ampliar imagem',
    'midia.fechar': 'Fechar',
    'caso.voltar': 'Voltar para os projetos',
    'caso.papel': 'Papel',
    'caso.periodo': 'Período',
    'caso.stack': 'Stack',
    'caso.codigo': 'Ver o código no GitHub',
    'caso.vitrine': 'Ver a vitrine no GitHub',
    'caso.problema': 'O problema',
    'caso.oQueFaz': 'O que ele faz',
    'caso.decisoes': 'Decisões técnicas',
    'caso.detalhes': 'Detalhes técnicos',
    'caso.detalhesIntro': 'Para quem quer ver por dentro. Abra o que interessar.',
    'caso.emResumo': 'Em resumo',
    'caso.vitrineNota': 'Código fechado. A vitrine é um repositório separado, que só descreve o sistema.',
    'caso.escolhi': 'O que escolhi',
    'caso.porque': 'Por quê',
    'caso.deixei': 'O que deixei de lado',
    'caso.proximos': 'Próximos passos',
    'caso.proximoProjeto': 'Próximo projeto',
    'caso.estagios': 'Em que estágio está',
    'caso.hoje': 'Hoje',
    'caso.faltaCastelo': 'Falta para o castelo',
    'estagio.ruinas': 'Ruínas',
    'estagio.acampamento': 'Acampamento',
    'estagio.aldeia': 'Aldeia',
    'estagio.vila': 'Vila',
    'estagio.castelo': 'Castelo',
    'mapa.rotulo': 'Mapa da arquitetura',
    'mapa.dica': 'Toque ou passe o mouse num componente para ver o que ele faz.',
    'mapa.todas': 'Ver todas as explicações',
    'rodape.feito': 'Feito com Astro e publicado no GitHub Pages.',
  },
  en: {
    'nav.rotulo': 'Main',
    'nav.inicio': 'Home',
    'nav.projetos': 'Projects',
    'nav.trajetoria': 'Journey',
    'nav.contato': 'Contact',
    'nav.trocarIdioma': 'PT',
    'nav.trocarIdiomaAria': 'View this page in Portuguese',
    pular: 'Skip to content',
    'destaque.problema': 'The problem',
    'destaque.construi': 'What I built',
    'destaque.orgulho': "What I'm proud of",
    'card.verCaso': 'Read the case study',
    'rota.aoVivo': 'live',
    'rota.pausar': 'Pause',
    'rota.continuar': 'Resume',
    'rota.dica': 'Pick a stop',
    'rota.marco': 'Milestone',
    'rota.etapa': 'Stage',
    'terminal.resumo': 'summary',
    'terminal.logRotulo': 'Pipeline log (technews.log)',
    'terminal.logLegenda': "The project's real log format. Sample IDs and times.",
    'animacoes.pausar': 'Pause animations',
    'animacoes.continuar': 'Resume animations',
    'midia.tocar': 'Play video',
    'midia.pausar': 'Pause video',
    'midia.ampliar': 'Enlarge image',
    'midia.fechar': 'Close',
    'caso.voltar': 'Back to projects',
    'caso.papel': 'Role',
    'caso.periodo': 'Period',
    'caso.stack': 'Stack',
    'caso.codigo': 'View the code on GitHub',
    'caso.vitrine': 'View the showcase on GitHub',
    'caso.problema': 'The problem',
    'caso.oQueFaz': 'What it does',
    'caso.decisoes': 'Technical decisions',
    'caso.detalhes': 'Technical details',
    'caso.detalhesIntro': 'For those who want to look inside. Open whatever interests you.',
    'caso.emResumo': 'In short',
    'caso.vitrineNota': 'Closed source. The showcase is a separate repository that only describes the system.',
    'caso.escolhi': 'What I chose',
    'caso.porque': 'Why',
    'caso.deixei': 'What I gave up',
    'caso.proximos': 'Next steps',
    'caso.proximoProjeto': 'Next project',
    'caso.estagios': 'What stage it is at',
    'caso.hoje': 'Today',
    'caso.faltaCastelo': 'Left before the castle',
    'estagio.ruinas': 'Ruins',
    'estagio.acampamento': 'Camp',
    'estagio.aldeia': 'Village',
    'estagio.vila': 'Town',
    'estagio.castelo': 'Castle',
    'mapa.rotulo': 'Architecture map',
    'mapa.dica': 'Tap or hover over a component to see what it does.',
    'mapa.todas': 'See all explanations',
    'rodape.feito': 'Built with Astro and published on GitHub Pages.',
  },
} as const satisfies Record<Idioma, Record<string, string>>;

export type ChaveUi = keyof (typeof ui)['pt'];

export function paraIdioma(valor: string | undefined): Idioma {
  return valor === 'en' ? 'en' : 'pt';
}

export function langHtml(i: Idioma): 'pt-BR' | 'en' {
  return i === 'pt' ? 'pt-BR' : 'en';
}

export function t(i: Idioma, chave: ChaveUi): string {
  return ui[i][chave];
}

export function urlDaHome(i: Idioma, ancora?: string): string {
  const base = i === 'pt' ? '/' : '/en/';
  return ancora ? `${base}#${ancora}` : base;
}

export function urlDoProjeto(i: Idioma, slug: string): string {
  return i === 'pt' ? `/projetos/${slug}/` : `/en/projects/${slug}/`;
}

export function urlEquivalente(caminho: string, destino: Idioma): string {
  const normal = caminho.endsWith('/') ? caminho : `${caminho}/`;
  const projeto = normal.match(/^\/(?:projetos|en\/projects)\/([^/]+)\/$/);
  if (projeto) return urlDoProjeto(destino, projeto[1]);
  return urlDaHome(destino);
}

export type Tema = 'rodovia' | 'rpg' | 'terminal';

/** Prefixo do rótulo da parada em cada tema próprio (a rodovia usa "KM", igual nos dois idiomas). */
const prefixoDaParada = { rpg: 'rota.marco', terminal: 'rota.etapa' } as const satisfies Record<Exclude<Tema, 'rodovia'>, ChaveUi>;

/**
 * Rótulo de uma parada da rota: "KM 0, 1, 2…" na rodovia; nos temas próprios, contado a partir de 1, com o nome do tema
 * (o marco da jornada no rpg, a etapa do pipeline no terminal).
 */
export function rotuloDaParada(i: Idioma, tema: Tema, indice: number): { prefixo: string; numero: number } {
  return tema === 'rodovia' ? { prefixo: 'KM', numero: indice } : { prefixo: t(i, prefixoDaParada[tema]), numero: indice + 1 };
}
