import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineCollection, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const midia = (image: ImageFunction) =>
  z
    .object({
      imagem: image().optional(),
      video: z
        .string()
        .regex(/^\/media\/[\w/-]+\.mp4$/)
        // O caminho do vídeo é só texto: sem esta conferência, um arquivo que não existe só apareceria quebrado no site publicado.
        .refine((v) => existsSync(join(process.cwd(), 'public', v)), { error: 'Este vídeo não existe na pasta public/.' })
        .optional(),
      proporcao: z.string().regex(/^\d+\/\d+$/).optional(),
      alt: z.string().min(1),
      legenda: z.string().optional(),
      moldura: z.enum(['navegador', 'celular', 'nenhuma']).default('navegador'),
    })
    .refine((m) => Boolean(m.imagem || m.video), { error: 'A mídia precisa de imagem ou vídeo.' })
    .refine((m) => !m.video || Boolean(m.imagem || m.proporcao), { error: 'Vídeo sem imagem precisa de proporcao.' });

const no = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  rotulo: z.string(),
  detalhe: z.string(),
  explicacao: z.string(),
  col: z.number().int().min(0).max(5),
  lin: z.number().int().min(0).max(5),
  destaque: z.boolean().default(false),
});

const faixa = z.object({ de: z.string(), para: z.string() });

const projetos = defineCollection({
  loader: glob({ base: './src/content/projetos', pattern: '**/*.yaml' }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string(),
      ordem: z.number().int(),
      destaque: z.boolean().default(false),
      frase: z.string(),
      status: z.enum(['producao', 'aberto', 'desenvolvimento']),
      statusTexto: z.string(),
      statusDetalhe: z.string().optional(),
      papel: z.string(),
      periodo: z.string(),
      stack: z.array(z.string()).min(1),
      links: z.object({ codigo: z.url().optional(), vitrine: z.url().optional() }).default({}),
      cartao: z.enum(['capa', 'rota']).default('capa'),
      /** Cara da página: `rodovia` (asfalto, placas de KM e o carrinho) ou `rpg` (a cara do jogo, só no Life RPG). */
      tema: z.enum(['rodovia', 'rpg']).default('rodovia'),
      capa: midia(image).optional(),
      emResumo: z.string(),
      resumo: z.object({ problema: z.string(), construi: z.string(), orgulho: z.string() }),
      problema: z.string(),
      rota: z.object({
        titulo: z.string(),
        paradas: z
          .array(z.object({ titulo: z.string(), texto: z.string(), curto: z.string().optional(), midia: midia(image).optional() }))
          .min(2)
          .max(6),
      }),
      funcionalidades: z.array(z.object({ titulo: z.string(), texto: z.string(), midia: midia(image) })).default([]),
      arquitetura: z
        .object({ titulo: z.string(), texto: z.string(), nos: z.array(no).min(2), faixas: z.array(faixa).min(1) })
        .refine(
          (a) => a.faixas.every((f) => a.nos.some((n) => n.id === f.de) && a.nos.some((n) => n.id === f.para)),
          { error: 'Uma faixa aponta para um nó que não existe.' },
        )
        .optional(),
      decisoes: z
        .array(z.object({ titulo: z.string(), resumo: z.string(), escolha: z.string(), porque: z.string(), deixeiDeLado: z.string() }))
        .min(1),
      numeros: z.array(z.object({ valor: z.string(), rotulo: z.string() })).default([]),
      numerosFonte: z.string().optional(),
      proximos: z.array(z.string()).default([]),
      seo: z.object({ descricao: z.string().max(160) }),
    }),
});

export const collections = { projetos };
