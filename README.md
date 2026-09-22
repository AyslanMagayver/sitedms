# DMS | Desempenho Socioambiental — Site institucional

Site institucional da DMS (consultoria em desempenho socioambiental e ESG), com página de time e formulário de contato.

- **Produção:** https://dmsocioambiental.com
- **Stack:** HTML + CSS + JavaScript puro (ES modules) no frontend; Node.js sem dependências externas no backend.

O projeto é dividido em duas aplicações isoladas, cada uma com seu próprio `package.json`:

| Pasta | O que é | Onde roda |
| --- | --- | --- |
| [`frontend/`](frontend/) | Site estático (HTML, CSS, JS e imagens) | GitHub Pages, publicado pelo GitHub Actions (domínio e DNS na GoDaddy) |
| [`backend/`](backend/) | API do formulário de contato (`POST /api/contact`), envia e-mail via SMTP | Serviço Node.js (Render, Railway, VPS...) |

O frontend chama a API por HTTP; o endereço da API fica em [`frontend/public/js/config.js`](frontend/public/js/config.js) e os domínios autorizados a chamá-la ficam na variável `ALLOWED_ORIGINS` do backend (CORS).

## Estrutura

```text
.
├── .github/workflows/
│   └── deploy-pages.yml        # publica frontend/public no GitHub Pages
├── frontend/
│   ├── package.json            # npm run dev
│   ├── .env.example            # FRONTEND_PORT
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
│   │   ├── config.js           # leitura e validação das variáveis de ambiente
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
cp .env.example .env   # preencha todas as variáveis
npm start              # API na porta definida em PORT
```

**Frontend** (Node.js 20 ou superior):

```bash
cd frontend
cp .env.example .env   # define FRONTEND_PORT
npm run dev            # site na porta definida em FRONTEND_PORT
```

Rodando em `localhost`, o frontend usa automaticamente a API local (`http://localhost:3000`, definido em `frontend/public/js/config.js`). Os dois servidores só sobem com todas as variáveis do respectivo `.env` preenchidas e válidas; caso contrário, listam no terminal o que falta.

## Deploy

**Frontend (GitHub Pages):** a cada push na `main`, o workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) publica o conteúdo de `frontend/public/`. Ele também pode ser executado manualmente na aba **Actions** ("Run workflow").

- **Configuração única no GitHub:** em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. Em **Custom domain**, mantenha `dmsocioambiental.com` e deixe **Enforce HTTPS** marcado (com o deploy pelo Actions, o domínio vale pelo que está nessa tela; o arquivo `CNAME` não é lido).
- **Domínio:** registrado na GoDaddy; o DNS aponta para o GitHub Pages (registros A 185.199.108.153 a 185.199.111.153 e `www` para o GitHub). Não é preciso alterar nada na GoDaddy.
- **Hospedagem estática:** o GitHub Pages não executa Node.js nem lê o `.htaccess`; o formulário depende da API do backend.

Se a API mudar de endereço, atualize `frontend/public/js/config.js` e o `action` do formulário em `index.html`.

**reCAPTCHA v2:** registre o domínio do site no [console do reCAPTCHA](https://www.google.com/recaptcha/admin) (tipo "Caixa de seleção Não sou um robô") e use o par de chaves gerado: a chave do site em `RECAPTCHA_SITE_KEY` (`frontend/public/js/config.js`) e a chave secreta em `RECAPTCHA_SECRET_KEY` (`.env` do backend / painel do Render).

**Backend (Render):**

| Configuração | Valor |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Variáveis de ambiente: todas as do [`backend/.env.example`](backend/.env.example), sem exceção. Em produção defina `ALLOWED_ORIGINS` com o(s) domínio(s) do site e `TRUST_PROXY=true`. Detalhes em [`backend/README.md`](backend/README.md).

> O arquivo `docs/guia-deploy-dms-landing.pdf` descreve a arquitetura antiga (um único servidor Node servindo site e API) e está desatualizado.

## Documentação

- [`docs/frontend.md`](docs/frontend.md) — design system, como editar conteúdo, performance e SEO.
- [`backend/README.md`](backend/README.md) — API, variáveis de ambiente e anexos.
- `docs/security-lgpd-audit.md`, `docs/audits/` — relatórios gerados durante o desenvolvimento.
