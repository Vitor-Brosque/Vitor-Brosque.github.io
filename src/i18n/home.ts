import type { Idioma } from './ui';

export interface TextosHome {
  meta: { titulo: string; descricao: string };
  hero: {
    selo: string;
    tituloAntes: string;
    tituloDestaque: string;
    tituloDepois: string;
    apresentacao: string;
    numeros: Array<{ numero: number; prefixo?: string; sufixo?: string; rotulo: string }>;
    ctaPrincipal: string;
    ctaLinkedin: string;
    rotuloPrint: string;
  };
  outros: { titulo: string };
  trajetoria: { titulo: string; intro: string; marcos: Array<{ quando: string; titulo: string; texto: string }> };
  ferramentas: { titulo: string; intro: string; grupos: Array<{ nome: string; itens: string[] }> };
  contato: { titulo: string; texto: string; linkedin: string; github: string };
}

export const LINKEDIN = 'https://www.linkedin.com/in/vitorbrosque';
export const GITHUB = 'https://github.com/Vitor-Brosque';

export const textosHome: Record<Idioma, TextosHome> = {
  pt: {
    meta: {
      titulo: 'Vitor Brosque · Backend e Dados',
      descricao:
        'Estudante de Sistemas de Informação na UNESP. Construí o RodoviariaOS, sistema em produção numa revenda de carros, e o Life RPG, PWA offline-first de código aberto.',
    },
    hero: {
      selo: 'Aberto a estágio · Backend e Dados',
      tituloAntes: 'Do balcão da revenda ',
      tituloDestaque: 'ao sistema',
      tituloDepois: ' que roda nela.',
      apresentacao:
        'Sou o Vitor, estudante de Sistemas de Informação na UNESP, em Bauru. Comecei atendendo clientes na loja de carros da minha família e hoje construo o software que organiza a loja.',
      numeros: [
        { numero: 1000, prefixo: '~', rotulo: 'leads recebidos pelo sistema que eu construí, desde jul/2026' },
        { numero: 13000, prefixo: '~', rotulo: 'mensagens de WhatsApp registradas por ele desde julho de 2026' },
        { numero: 3, rotulo: 'projetos: 1 em produção e 2 de código aberto' },
      ],
      ctaPrincipal: 'Ver o RodoviariaOS',
      ctaLinkedin: 'LinkedIn',
      rotuloPrint: 'RodoviariaOS · em produção',
    },
    outros: { titulo: 'Outros projetos' },
    trajetoria: {
      titulo: 'Trajetória',
      intro: 'Cheguei à tecnologia pelo lado do negócio, e isso muda como eu olho para um sistema.',
      marcos: [
        { quando: '2026 a 2029', titulo: 'Sistemas de Informação na UNESP', texto: 'Graduação em andamento, em Bauru.' },
        {
          quando: 'ago. 2025 até hoje',
          titulo: 'CRM, operações digitais e automação na Rodoviária Veículos',
          texto:
            'Na revenda da minha família, cuido de leads, anúncios, estoque, atendimento e indicadores. Foi vendo os gargalos do dia a dia que comecei a construir o sistema que hoje organiza a loja.',
        },
        {
          quando: 'jan. a ago. 2025',
          titulo: 'Formação de oficiais no Exército Brasileiro',
          texto: 'Planejamento e execução com prazo e recursos curtos, trabalho em equipe e decisão sob pressão.',
        },
      ],
    },
    ferramentas: {
      titulo: 'Ferramentas',
      intro: 'O que eu uso nos projetos acima.',
      grupos: [
        { nome: 'Linguagens', itens: ['TypeScript', 'Python', 'SQL'] },
        { nome: 'Backend', itens: ['Node.js', 'Fastify', 'Zod', 'APIs REST e webhooks', 'Server-Sent Events'] },
        { nome: 'Dados', itens: ['PostgreSQL (RLS, migrations)', 'SQLite', 'Drizzle ORM', 'psycopg', 'Pipelines de ingestão'] },
        { nome: 'Front-end', itens: ['React', 'Next.js', 'Astro'] },
        { nome: 'Infraestrutura', itens: ['Linux', 'systemd', 'Caddy', 'Docker', 'Tailscale', 'Git'] },
        { nome: 'Testes', itens: ['Vitest', 'Testing Library', 'Playwright'] },
      ],
    },
    contato: {
      titulo: 'Vamos conversar',
      texto:
        'Se você tem uma vaga de estágio ou júnior em Backend ou Dados, ou quer trocar uma ideia sobre algum projeto, me chama no LinkedIn.',
      linkedin: 'Falar comigo no LinkedIn',
      github: 'Ver meu GitHub',
    },
  },
  en: {
    meta: {
      titulo: 'Vitor Brosque · Backend and Data',
      descricao:
        'Information Systems student at UNESP. I built RodoviariaOS, a system running in production at a car dealership, and Life RPG, an open-source offline-first PWA.',
    },
    hero: {
      selo: 'Open to internships · Backend and Data',
      tituloAntes: 'From the dealership counter ',
      tituloDestaque: 'to the system',
      tituloDepois: ' that runs it.',
      apresentacao:
        "I'm Vitor, an Information Systems student at UNESP, in Brazil. I started out serving customers at my family's car dealership, and now I build the software that keeps the dealership organized.",
      numeros: [
        { numero: 1000, prefixo: '~', rotulo: 'leads received by the system I built, since Jul 2026' },
        { numero: 13000, prefixo: '~', rotulo: 'WhatsApp messages logged by it since July 2026' },
        { numero: 3, rotulo: 'projects: 1 in production and 2 open source' },
      ],
      ctaPrincipal: 'See RodoviariaOS',
      ctaLinkedin: 'LinkedIn',
      rotuloPrint: 'RodoviariaOS · in production',
    },
    outros: { titulo: 'Other projects' },
    trajetoria: {
      titulo: 'Journey',
      intro: 'I came to tech from the business side, and that shapes how I look at a system.',
      marcos: [
        { quando: '2026 to 2029', titulo: 'Information Systems at UNESP', texto: 'Undergraduate degree in progress, in Bauru, Brazil.' },
        {
          quando: 'Aug 2025 to now',
          titulo: 'CRM, digital operations and automation at Rodoviária Veículos',
          texto:
            "At my family's dealership I handle leads, ads, inventory, customer service and metrics. Seeing the daily bottlenecks is what got me building the system that now runs the dealership.",
        },
        {
          quando: 'Jan to Aug 2025',
          titulo: 'Officer training in the Brazilian Army',
          texto: 'Planning and execution with tight deadlines and resources, teamwork and decisions under pressure.',
        },
      ],
    },
    ferramentas: {
      titulo: 'Tools',
      intro: 'What I use in the projects above.',
      grupos: [
        { nome: 'Languages', itens: ['TypeScript', 'Python', 'SQL'] },
        { nome: 'Backend', itens: ['Node.js', 'Fastify', 'Zod', 'REST APIs and webhooks', 'Server-Sent Events'] },
        { nome: 'Data', itens: ['PostgreSQL (RLS, migrations)', 'SQLite', 'Drizzle ORM', 'psycopg', 'Ingestion pipelines'] },
        { nome: 'Front-end', itens: ['React', 'Next.js', 'Astro'] },
        { nome: 'Infrastructure', itens: ['Linux', 'systemd', 'Caddy', 'Docker', 'Tailscale', 'Git'] },
        { nome: 'Testing', itens: ['Vitest', 'Testing Library', 'Playwright'] },
      ],
    },
    contato: {
      titulo: "Let's talk",
      texto:
        'If you have an internship or junior role in Backend or Data, or just want to talk about a project, reach out on LinkedIn.',
      linkedin: 'Message me on LinkedIn',
      github: 'See my GitHub',
    },
  },
};
