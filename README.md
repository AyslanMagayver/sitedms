# DMS | Desempenho Socioambiental

Landing page institucional da DMS, com formulário de contato integrado a um backend próprio em Node.js (sem dependências externas) que envia o e-mail via SMTP, sem abrir `mailto`.

## Tecnologias

HTML, CSS e JavaScript no front-end. Node.js (módulo nativo `http`, sem framework) no backend, responsável por servir o site e processar o formulário de contato.

## Como executar

```bash
npm install
cp .env.example .env   # preencha as configurações SMTP
node server.js
```

Por padrão o site abre em `http://127.0.0.1:3000`.

## Variáveis de ambiente

O servidor lê as credenciais SMTP de um arquivo `.env` (não versionado). Configure pelo menos:

```env
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_STARTTLS=true
SMTP_USER=usuario@seudominio.com
SMTP_PASS=sua_senha_ou_app_password
CONTACT_TO=contato@dmsocioambiental.com
```

Veja `README-backend.md` para detalhes completos do backend e do formulário.

## Estrutura

`index.html`, `styles.css` e `script.js` são as páginas e estilos principais do site. `demo.html`/`demo-styles.css` e `time.html` são páginas auxiliares. `assets/` e `assets_new/` contêm as imagens e ícones do site. `server.js` serve os arquivos estáticos e expõe o endpoint do formulário de contato.

`security-lgpd-audit.md`, `conversion-audit/` e `multi-audit/` são relatórios de auditoria (segurança/LGPD, conversão e UX) gerados durante o desenvolvimento.
