# Frontend — guia de manutenção

Todos os caminhos abaixo são relativos a `frontend/public/`, a pasta publicada na hospedagem. O servidor de desenvolvimento fica fora dela, em `frontend/scripts/dev-server.js`.

## Arquivos principais

| Caminho | Função |
| --- | --- |
| `index.html` | Página principal (quem somos, valores, atuação, padrões, padrões IFC, soluções, setores, clientes, projetos na prática, contato) |
| `time.html` | Página da equipe |
| `css/styles.css` | Todos os estilos. As seções redesenhadas ficam em blocos próprios no fim do arquivo (atuação, padrões, IFC, soluções, setores, clientes, projetos, contato e rodapé); ajustes de uma seção devem ser feitos no bloco dela |
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
- **Breakpoints principais:** 1080/1081px (colapso de grids e menu hambúrguer), 900/901px (setores e títulos), 860/861px (mapa de atuação), 700px (layout mobile), 480px (listas em coluna única, títulos menores), 1440px e 1920px (telas largas).
- **Animações:** reveals de 420ms com stagger via `nth-child`; tudo respeita `prefers-reduced-motion`.

## Como editar conteúdo

- **Membro do time:** duplique um `<article class="team-card">` em `time.html`. Foto em `assets/team/` (usar `.webp`, ~640px de largura). LinkedIn: `<a class="team-link" href="URL">` (com link) ou `<span class="team-link">` (oculto).
- **Logos de clientes/parceiros:** salve o arquivo em `assets/logos/<setor>/<clientes|parceiros>/` (ou `assets/logos/geral/`) e adicione um `<img>` na grade correspondente em `index.html`: dentro do detalhe do setor (`.sector-logo-grid` / `.sector-partner-logos`) e, se for o caso, na nuvem `.logo-cloud`. O `alt` é o nome exibido.
- **Vídeos de Projetos na prática:** duplique um `<article class="project-card">` dentro de `.projects-gallery` em `index.html` e troque:
  - o ID do vídeo do YouTube em `data-video-id` e na URL da miniatura (`https://i.ytimg.com/vi/<ID>/maxresdefault.jpg`);
  - o título (`h3`), o parágrafo de descrição e o texto do `aria-label` do botão (`Assistir ao vídeo: <título>`);
  - a imagem do QR Code, salva em `assets/experiences/qrcodes/` e apontando para `https://youtu.be/<ID>`, e seu `alt`.

  O vídeo só é carregado quando a pessoa clica na miniatura, e apenas um toca por vez (`js/modules/project-videos.js`). No celular o QR Code fica oculto, já que a pessoa já está no próprio aparelho.
- **Assuntos do formulário:** atualize o `<select>` em `index.html` **e** `CONTACT_SUBJECTS` em `backend/src/validators/contact.validator.js`.
- **Endereço da API:** `js/config.js` (e o `action` do formulário em `index.html`).
- **reCAPTCHA v2:** a chave do site fica em `RECAPTCHA_SITE_KEY`, em `js/config.js` (é pública por natureza); a chave secreta fica só no `.env` do backend (`RECAPTCHA_SECRET_KEY`). O widget é carregado quando o formulário se aproxima da tela e o botão de envio só habilita depois da confirmação (`js/modules/recaptcha.js`).

## Performance

- Imagens grandes foram convertidas/redimensionadas (WebP para fotos do time, mapa e ilustrações; JPEG progressivo para fundos). Ao adicionar imagens novas, mantenha **≤200 KB** e largura ≤1600px.
- `loading="lazy"` + `decoding="async"` em tudo que fica abaixo da dobra.
- Compressão e cache são configurados no `.htaccess` (Apache).
- Fontes com `display=swap` e `preconnect`.

## SEO

- Meta description, canonical, Open Graph/Twitter cards e JSON-LD (`ProfessionalService`) nos `<head>` das duas páginas. Os dois blocos JSON-LD usam o mesmo `@id` (`https://dmsocioambiental.com/#organization`); o de `time.html` lista também a equipe em `employee` (nome, cargo, foto e LinkedIn) — ao incluir, remover ou alterar alguém no time, atualize também esse bloco.
- `robots.txt` e `sitemap.xml` na raiz de `public/` — atualize o sitemap ao criar páginas novas e o `<lastmod>` da página ao alterar o conteúdo dela.
- `demo.html` e `_qa-viewport.html` têm `noindex` e não entram no sitemap.
- Imagem de compartilhamento: `assets/og-image.jpg` (1200×630).
- Se o domínio mudar, buscar/substituir `dmsocioambiental.com` em `index.html`, `time.html`, `robots.txt`, `sitemap.xml` e `CNAME`, e atualizar `ALLOWED_ORIGINS` no backend.
