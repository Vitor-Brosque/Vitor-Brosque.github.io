// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vitor-brosque.github.io',
  compressHTML: true,
  integrations: [
    react(),
    sitemap({ i18n: { defaultLocale: 'pt', locales: { pt: 'pt-BR', en: 'en' } } }),
  ],
  i18n: {
    locales: ['pt', 'en'],
    defaultLocale: 'pt',
    routing: { prefixDefaultLocale: false },
  },
});
