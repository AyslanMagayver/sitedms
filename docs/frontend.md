# Frontend — guia de manutenção

Todos os caminhos abaixo são relativos a `frontend/public/`, a pasta publicada na hospedagem. O servidor de desenvolvimento fica fora dela, em `frontend/scripts/dev-server.js`.

## Arquivos principais

| Caminho | Função |
| --- | --- |
| `index.html` | Página principal (hero, valores, atuação, padrões IFC, soluções, setores, clientes, experiências, contato) |
| `time.html` | Página da equipe |
| `css/styles.css` | Todos os estilos. Organizado em camadas históricas; a camada final `CAMADA DE POLIMENTO PREMIUM` (fim do arquivo) concentra tipografia, microinterações e correções responsivas — **novos overrides devem ser adicionados lá** para vencer a cascata |
| `js/main.js` | Ponto de entrada; importa e inicializa cada módulo de `js/modules/` |
| `js/config.js` | URL da API (local em `localhost`, produção nos demais casos) |
| `assets/`, `assets_new/` | Imagens, ícones e logos |
| `robots.txt`, `sitemap.xml` | SEO técnico |
| `_qa-viewport.html` | Harness de QA: `http://localhost:5500/_qa-viewport.html?w=390` renderiza o site num iframe com a largura desejada |
| `demo.html`, `css/demo-styles.css` | Versão antiga de demonstração (`noindex`), não linkada no site |

O JavaScript usa ES modules (`<script type="module">`), então as páginas precisam ser abertas por um servidor HTTP (`npm run dev`, dentro de `frontend/`), não com duplo clique no arquivo.

## Design system (resumo)

- **Fontes:** [Archivo](https://fonts.google.com/specimen/Archivo) para títulos/botões e [Inter](https://fonts.google.com/specimen/Inter) para texto, via Google Fonts (`var(--font-display)` / `var(--font-body)`).
- **Cores (tokens em `:root`):** `--navy #002060`, `--blue #0165b6`, `--sky/--ice` para fundos claros, `--muted` para texto secundário.
- **Breakpoints principais:** 1080px (colapso de grids e menu hambúrguer), 850/760/700px (seções específicas), 480px (listas em coluna única, títulos menores), 380px (botões sociais empilhados), 1920px+ (cap de largura no hero).
- **Animações:** reveals de 420ms com stagger via `nth-child`; tudo respeita `prefers-reduced-motion`.

## Como editar conteúdo

- **Membro do time:** duplique um `<article class="team-card">` em `time.html`. Foto em `assets/team/` (usar `.webp`, ~640px de largura). LinkedIn: `<a class="team-link" href="URL">` (com link) ou `<span class="team-link">` (oculto).
- **Logos de clientes/parceiros:** salve o arquivo em `assets/logos/<setor>/<clientes|parceiros>/` (ou `assets/logos/geral/`) e adicione um `<img>` na grade correspondente em `index.html`: dentro do detalhe do setor (`.sector-logo-grid` / `.sector-partner-logos`) e, se for o caso, na nuvem `.logo-cloud`. O `alt` é o nome exibido.
- **Vídeos de experiências:** duplique um `<article class="experience-slide">` dentro de `.experience-track` em `index.html` (só o primeiro slide leva a classe `is-active`) e troque:
  - `experience-title-main` (linha principal, azul escuro) e `experience-title-sub` (linha secundária, azul mais claro);
  - o parágrafo de descrição;
  - a imagem do QR code, salva em `assets/experiences/qrcodes/`, e seu `alt`;
  - o ID do vídeo na URL do `iframe` (`https://www.youtube.com/embed/<ID>?enablejsapi=1&amp;cc_load_policy=0`) e o `title` do `iframe`.

  Os pontinhos de navegação são criados automaticamente conforme a quantidade de slides. Mantenha os parâmetros da URL: `enablejsapi=1` permite pausar um vídeo quando outro começa a tocar, e `cc_load_policy=0` deixa as legendas desligadas por padrão (o botão CC do player continua disponível). Evite títulos com uma palavra única muito longa (ex.: "REASSENTAMENTO") perto do limite da coluna; se cortar, encurte o texto ou ajuste o layout.
- **Assuntos do formulário:** atualize o `<select>` em `index.html` **e** `CONTACT_SUBJECTS` em `backend/src/validators/contact.validator.js`.
- **Endereço da API:** `js/config.js` (e o `action` do formulário em `index.html`).

## Performance

- Imagens grandes foram convertidas/redimensionadas (WebP para fotos do time, mapa e ilustrações; JPEG progressivo para fundos). Ao adicionar imagens novas, mantenha **≤200 KB** e largura ≤1600px.
- `loading="lazy"` + `decoding="async"` em tudo que fica abaixo da dobra.
- Compressão e cache são configurados no `.htaccess` (Apache).
- Fontes com `display=swap` e `preconnect`.

## SEO

- Meta description, canonical, Open Graph/Twitter cards e JSON-LD (`ProfessionalService`) nos `<head>` das duas páginas.
- `robots.txt` e `sitemap.xml` na raiz de `public/` — atualize o sitemap ao criar páginas novas.
- Imagem de compartilhamento: `assets/og-image.jpg` (1200×630).
- Se o domínio mudar, buscar/substituir `dmsocioambiental.com` em `index.html`, `time.html`, `robots.txt`, `sitemap.xml` e `CNAME`, e atualizar `ALLOWED_ORIGINS` no backend.
