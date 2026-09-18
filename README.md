# DMS | Desempenho Socioambiental — Site institucional

Site institucional da DMS (consultoria em desempenho socioambiental e ESG), com página de time e formulário de contato.

- **Produção:** https://dmsocioambiental.com
- **Stack:** HTML + CSS + JavaScript puro (ES modules) no frontend; Node.js sem dependências externas no backend.

O projeto é dividido em duas aplicações isoladas, cada uma com seu próprio `package.json`:

| Pasta | O que é | Onde roda |
| --- | --- | --- |
| [`frontend/`](frontend/) | Site estático (HTML, CSS, JS e imagens) | Qualquer hospedagem estática (Apache/GoDaddy, GitHub Pages, Netlify...) |
| [`backend/`](backend/) | API do formulário de contato (`POST /api/contact`), envia e-mail via SMTP | Serviço Node.js (Render, Railway, VPS...) |

O frontend chama a API por HTTP; o endereço da API fica em [`frontend/public/js/config.js`](frontend/public/js/config.js) e os domínios autorizados a chamá-la ficam na variável `ALLOWED_ORIGINS` do backend (CORS).

## Estrutura

```text
.
├── frontend/
│   ├── package.json            # npm run dev
│   ├── scripts/dev-server.js   # servidor estático só para desenvolvimento
│   └── public/                 # site — o conteúdo desta pasta é o que vai para a hospedagem
│       ├── index.html, time.html
│       ├── css/styles.css
│       ├── js/
│       │   ├── main.js         # ponto de entrada: inicializa os módulos
│       │   ├── config.js       # URL da API
│       │   ├── modules/        # header, reveal, soluções, vídeos, formulário, setores, rodapé
│       │   └── utils/
│       ├── assets/, assets_new/
│       └── .htaccess, CNAME, robots.txt, sitemap.xml
├── backend/
│   ├── package.json            # npm start
│   ├── src/
│   │   ├── server.js           # ponto de entrada (sobe o servidor HTTP)
│   │   ├── app.js              # roteamento, CORS, tratamento de erros
│   │   ├── config.js           # leitura das variáveis de ambiente
│   │   ├── routes/             # handlers das rotas
│   │   ├── validators/         # validação do formulário
│   │   ├── services/mail/      # cliente SMTP e montagem da mensagem MIME
│   │   ├── templates/          # corpo do e-mail
│   │   ├── middleware/         # CORS, rate limit, headers de segurança
│   │   └── http/               # utilitários de requisição/resposta
│   └── .env.example
└── docs/                       # guia do frontend, auditorias, capturas de QA, guia de deploy antigo
```

## Como executar localmente

Não há dependências para instalar. Cada aplicação roda dentro da sua pasta, em terminais separados.

**Backend** (Node.js 20.12 ou superior):

```bash
cd backend
cp .env.example .env   # preencha o SMTP (opcional para navegar)
npm start              # API em http://localhost:3000
```

**Frontend** (Node.js 20 ou superior):

```bash
cd frontend
npm run dev            # site em http://localhost:5500
```

Rodando em `localhost`, o frontend usa automaticamente a API local. Sem SMTP configurado, tudo funciona exceto o envio real do formulário (a API responde 503).

## Deploy

**Frontend:** publique o **conteúdo** da pasta `frontend/public/` na raiz da hospedagem estática (ex.: via FTP/File Manager na GoDaddy). Se a API mudar de endereço, atualize `frontend/public/js/config.js` e o `action` do formulário em `index.html`.

**Backend (Render):**

| Configuração | Valor |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Variáveis de ambiente: as do [`backend/.env.example`](backend/.env.example). Em produção defina `ALLOWED_ORIGINS` com o(s) domínio(s) do site e `TRUST_PROXY=true`. Detalhes em [`backend/README.md`](backend/README.md).

> O arquivo `docs/guia-deploy-dms-landing.pdf` descreve a arquitetura antiga (um único servidor Node servindo site e API) e está desatualizado.

## Documentação

- [`docs/frontend.md`](docs/frontend.md) — design system, como editar conteúdo, performance e SEO.
- [`backend/README.md`](backend/README.md) — API, variáveis de ambiente e anexos.
- `docs/security-lgpd-audit.md`, `docs/audits/` — relatórios gerados durante o desenvolvimento.
