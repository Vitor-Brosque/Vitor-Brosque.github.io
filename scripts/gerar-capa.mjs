// Gera a capa (imagem parada) de um vídeo, na resolução original, a partir de um instante escolhido.
// Uso:  npm run capa -- <video.mp4> [instante] [saida.png]
//   instante: segundos (ex.: 3.5) ou fração do vídeo com % (ex.: 60%). Padrão: 5%.
//   saida:    padrão src/assets/projetos/<pasta do vídeo>/<nome do vídeo>.png
// Exemplo: npm run capa -- public/media/rodoviariaos/assistente.mp4 60%
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';

const [video, instante = '5%', saidaArg] = process.argv.slice(2);
if (!video || !existsSync(video)) {
  console.error('Uso: npm run capa -- <video.mp4> [instante em segundos ou em %] [saida.png]');
  console.error(video ? `Arquivo não encontrado: ${video}` : 'Faltou o caminho do vídeo.');
  process.exit(1);
}
const nome = basename(video, extname(video));
const projeto = basename(dirname(resolve(video)));
const saida = saidaArg ?? join('src', 'assets', 'projetos', projeto, `${nome}.png`);

const ORIGEM = 'http://capa.local';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // Serve o vídeo e uma página vazia da mesma origem, para o quadro poder ser exportado.
  await page.route(`${ORIGEM}/`, (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>capa</title>' }));
  // Atende pedidos de trecho (Range): sem isso o navegador não consegue pular para o instante pedido
  // e a capa sai sempre com o primeiro quadro.
  const bytes = readFileSync(resolve(video));
  await page.route(`${ORIGEM}/video`, (r) => {
    const faixa = /bytes=(\d*)-(\d*)/.exec(r.request().headers()['range'] ?? '');
    if (!faixa) return r.fulfill({ contentType: 'video/mp4', body: bytes, headers: { 'accept-ranges': 'bytes' } });
    const ini = faixa[1] ? parseInt(faixa[1], 10) : 0;
    const fim = faixa[2] ? Math.min(parseInt(faixa[2], 10), bytes.length - 1) : bytes.length - 1;
    // Trecho fora do arquivo: responde como um servidor de verdade, em vez de mandar um corpo vazio.
    if (ini > fim) return r.fulfill({ status: 416, headers: { 'content-range': `bytes */${bytes.length}` } });
    return r.fulfill({
      status: 206,
      contentType: 'video/mp4',
      body: bytes.subarray(ini, fim + 1),
      headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${ini}-${fim}/${bytes.length}` },
    });
  });
  await page.goto(`${ORIGEM}/`);
  const r = await page.evaluate(
    async ({ instante }) => {
      const v = document.createElement('video');
      v.muted = true;
      v.preload = 'auto';
      v.src = '/video';
      await new Promise((ok, erro) => {
        v.onloadeddata = ok;
        v.onerror = () => erro(new Error('O navegador não conseguiu abrir o vídeo (formato não suportado?).'));
      });
      const alvo = instante.endsWith('%') ? (v.duration * parseFloat(instante)) / 100 : parseFloat(instante);
      const t = Math.min(Math.max(alvo, 0), Math.max(v.duration - 0.05, 0));
      await new Promise((ok) => {
        v.onseeked = ok;
        v.currentTime = t;
      });
      const tela = document.createElement('canvas');
      tela.width = v.videoWidth;
      tela.height = v.videoHeight;
      tela.getContext('2d').drawImage(v, 0, 0);
      return { url: tela.toDataURL('image/png'), largura: v.videoWidth, altura: v.videoHeight, duracao: v.duration, t };
    },
    { instante },
  );
  mkdirSync(dirname(saida), { recursive: true });
  writeFileSync(saida, Buffer.from(r.url.split(',')[1], 'base64'));
  const mdc = (a, b) => (b ? mdc(b, a % b) : a);
  const d = mdc(r.largura, r.altura);
  console.log(`Capa gravada em ${saida} (${r.largura}×${r.altura}, quadro em ${r.t.toFixed(1)} s de ${r.duracao.toFixed(1)} s, ${(statSync(saida).size / 1024).toFixed(0)} KB).`);
  console.log(`No YAML do projeto: proporcao: "${r.largura / d}/${r.altura / d}"`);
} finally {
  await browser.close();
}
