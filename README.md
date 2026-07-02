# DMS | Desempenho Socioambiental — Site institucional

Landing page institucional da DMS (consultoria em desempenho socioambiental e ESG), com página de time e formulário de contato integrado a um backend próprio em Node.js (sem dependências externas) que envia e-mail via SMTP.

- **Produção:** https://dmsocioambiental.com
- **Stack:** HTML + CSS + JavaScript puro no front-end; Node.js (módulo nativo `http`) no backend.

## Como executar localmente

```bash
npm install
cp .env.example .env   # preencha as configurações SMTP (opcional para navegar)
node server.js
```

O site abre em `http://127.0.0.1:3000`. Sem `.env` configurado, tudo funciona exceto o envio real do formulário.

> Detalhes do backend (endpoint, anexos, variáveis SMTP): veja `README-backend.md`.

## Estrutura do projeto

| Caminho | Função |
| --- | --- |
| `index.html` | Página principal (hero, valores, atuação, padrões IFC, soluções, setores, clientes, experiências, contato) |
| `time.html` | Página da equipe |
| `styles.css` | Todos os estilos. Organizado em camadas históricas; a camada final `CAMADA DE POLIMENTO PREMIUM` (fim do arquivo) concentra tipografia, microinterações e correções responsivas — **novos overrides devem ser adicionados lá** para vencer a cascata |
| `script.js` | Header fixo, menu mobile, animações de reveal, cards de soluções, carrossel de experiências (YouTube), setores interativos, formulário e logos via API |
| `server.js` | Servidor estático (gzip + ETag + cache) e APIs `/api/contact`, `/api/logos`, `/api/experiences`, `/api/carousel` |
| `assets/`, `assets_new/` | Imagens, ícones e logos |
| `robots.txt`, `sitemap.xml` | SEO técnico |
| `_qa-viewport.html` | Harness de QA: `http://localhost:3000/_qa-viewport.html?w=390` renderiza o site num iframe com a largura desejada para testar responsividade |

## Design system (resumo)

- **Fontes:** [Archivo](https://fonts.google.com/specimen/Archivo) para títulos/botões e [Inter](https://fonts.google.com/specimen/Inter) para texto, via Google Fonts (`var(--font-display)` / `var(--font-body)`).
- **Cores (tokens em `:root`):** `--navy #002060`, `--blue #0165b6`, `--sky/--ice` para fundos claros, `--muted` para texto secundário.
- **Breakpoints principais:** 1080px (colapso de grids e menu hambúrguer), 850/760/700px (seções específicas), 480px (listas em coluna única, títulos menores), 380px (botões sociais empilhados), 1920px+ (cap de largura no hero).
- **Animações:** reveals de 420ms com stagger via `nth-child`; tudo respeita `prefers-reduced-motion`.

## Como editar conteúdo

- **Membro do time:** duplique um `<article class="team-card">` em `time.html`. Foto em `assets/team/` (usar `.webp`, ~640px de largura). LinkedIn: `<a class="team-link" href="URL">` (com link) ou `<span class="team-link">` (oculto).
- **Logos de clientes/parceiros:** basta adicionar o arquivo em `assets/logos/<setor>/<clientes|parceiros>/` ou `assets/logos/geral/` — a API `/api/logos` monta as grades automaticamente. Nomes de exibição em `assets/logos/_names.json`.
- **Vídeos de experiências:** edite `assets/experiences/experiences.json` (título, texto, `videoId` do YouTube e QR code).
- **Assuntos do formulário:** atualize o `<select>` em `index.html` **e** o conjunto `allowedSubjects` em `server.js`.

## Performance

- Imagens grandes foram convertidas/redimensionadas (WebP para fotos do time, mapa e ilustrações; JPEG progressivo para fundos). Ao adicionar imagens novas, mantenha **≤200 KB** e largura ≤1600px.
- `loading="lazy"` + `decoding="async"` em tudo que fica abaixo da dobra.
- `server.js` responde com gzip (HTML/CSS/JS/SVG), `ETag`/304 e `Cache-Control` de 7 dias para imagens.
- Fontes com `display=swap` e `preconnect`.

## SEO

- Meta description, canonical, Open Graph/Twitter cards e JSON-LD (`ProfessionalService`) nos `<head>` das duas páginas.
- `robots.txt` (bloqueia `/api/`) e `sitemap.xml` na raiz — atualize o sitemap ao criar páginas novas.
- Imagem de compartilhamento: `assets/og-image.jpg` (1200×630).
- Se o domínio mudar, buscar/substituir `dmsocioambiental.com` em `index.html`, `time.html`, `robots.txt` e `sitemap.xml`.

## Deploy

O backend precisa de ambiente Node.js (Render, Railway, VPS etc. — hospedagem puramente estática não executa o formulário). Passo a passo: `guia-deploy-dms-landing.pdf`.

## Auditorias e QA

`security-lgpd-audit.md`, `conversion-audit/` e `multi-audit/` são relatórios gerados durante o desenvolvimento. Para QA visual responsivo use `_qa-viewport.html` (ver Estrutura).
