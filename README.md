# Portfolio de Vitor Brosque

Site estático em [Astro](https://astro.build) com a home e um estudo de caso por projeto (RodoviariaOS, Life RPG e TechNews), em português (`/`) e em inglês (`/en/`).

Publicado em <https://vitor-brosque.github.io> pelo GitHub Pages.

## Rodar na sua máquina

Precisa de Node 22.23.4 ou mais novo.

```bash
npm install
npm run dev
```

O site abre em <http://localhost:4321>.

## Onde fica cada coisa

| O quê | Onde |
|---|---|
| Textos e mídias de cada projeto | `src/content/projetos/pt/<projeto>.yaml` e `src/content/projetos/en/<projeto>.yaml` |
| Textos da home | `src/i18n/home.ts` |
| Textos de interface (botões, rótulos) | `src/i18n/ui.ts` |
| Prints | `src/assets/projetos/<projeto>/` |
| Vídeos | `public/media/<projeto>/` |
| Cores e fontes | `src/styles/tokens.css` |

Todo texto existe em português e em inglês. Ao mudar um, mude o outro.

## Trocar um print

1. Salve o print novo em `src/assets/projetos/<projeto>/` **com o mesmo nome** do antigo (por exemplo `painel-do-dia.png`).
2. Pronto. O tamanho pode ser outro: o site recorta e gera as versões menores sozinho.

Se o nome do arquivo mudar, atualize o campo `imagem:` nos dois YAML do projeto (`pt` e `en`). Se o que aparece no print mudou, atualize também o `alt:`, que descreve a imagem para quem usa leitor de tela.

## Trocar um vídeo

1. Salve o vídeo novo (`.mp4`, sem áudio, de preferência abaixo de 2 MB) em `public/media/<projeto>/` com o mesmo nome do antigo.
2. Gere a capa, que é a imagem parada mostrada antes de o vídeo tocar:

   ```bash
   npm run capa -- public/media/rodoviariaos/assistente.mp4 60%
   ```

   O comando usa o Chromium do Playwright (na primeira vez: `npx playwright install chromium`). O segundo valor é o instante do quadro: segundos (`3.5`) ou porcentagem do vídeo (`60%`). A capa vai para `src/assets/projetos/<projeto>/<nome do vídeo>.png`. Para gravar em outro lugar ou com outro nome, passe o caminho como terceiro valor.
3. Se o formato do vídeo mudou (de vertical para horizontal, por exemplo), copie para o campo `proporcao:` do YAML o valor que o comando imprime.

## Acrescentar uma mídia

Cada mídia é um bloco `midia:` no YAML do projeto:

```yaml
midia:
  imagem: ../../../assets/projetos/rodoviariaos/painel-do-dia.png # o print, ou a capa do vídeo
  video: /media/rodoviariaos/assistente.mp4 # opcional
  proporcao: 4/5 # opcional: largura/altura
  moldura: navegador # navegador, celular ou nenhuma
  alt: O que aparece na imagem, em uma frase
  legenda: Texto curto abaixo da mídia # opcional
```

Ela pode entrar em três lugares:

- `capa`: topo do estudo de caso, cartão da home e imagem que aparece quando o link é compartilhado. A capa do projeto em destaque também é o print do topo da home;
- `rota.paradas[].midia`: uma parada do caminho;
- `funcionalidades[].midia`: a seção "O que ele faz". As quatro primeiras do projeto em destaque também aparecem na home.

Coloque o mesmo bloco nos dois idiomas, traduzindo `alt` e `legenda`.

Erros comuns são pegos antes de publicar, e a mensagem diz o que está errado:

- campo faltando, imagem que não existe ou vídeo que não existe em `public/` fazem `npm run build` falhar;
- mídia diferente entre português e inglês faz `npm test` falhar;
- print ou vídeo que ficou na pasta sem ser usado também faz `npm test` falhar, para nenhum arquivo esquecido ir a público.

## Antes de publicar

```bash
npm test                  # testes unitários
npm run build             # confere tipos e conteúdo, e gera o site em dist/
npm run test:e2e          # testes no navegador (na primeira vez: npx playwright install chromium)
npm run publicar:checar   # gera o site e procura termos que não podem ir a público
```

`publicar:checar` procura, no site gerado e nos arquivos versionados, termos que não podem aparecer em público, como nomes reais de clientes. A lista fica fora do repositório: o caminho padrão é `../portfolio-conteudo/termos-proibidos.txt` e pode ser trocado pela variável de ambiente `TERMOS_PROIBIDOS`.

Os prints e vídeos do RodoviariaOS usam dados inventados. Antes de publicar uma mídia nova, confira se não aparece nome, telefone, placa ou valor real.

## Publicação

O merge na `main` roda os testes e publica no GitHub Pages (`.github/workflows/deploy.yml`). Pull requests rodam só os testes.

## Animações

O site respeita a preferência de movimento reduzido do sistema. Nesse modo ficam os fades e as transições de cor, e saem os deslocamentos e os loops. No Windows a opção fica em Configurações → Acessibilidade → Efeitos visuais → Efeitos de animação.
