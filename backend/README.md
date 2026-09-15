# Backend — API do site DMS

API em Node.js (sem dependências externas) que recebe o formulário de contato do site e envia a mensagem por e-mail via SMTP. Não serve páginas nem arquivos estáticos: o site fica em `../frontend/public/`.

## Como rodar

```bash
cp .env.example .env   # preencha as variáveis
npm start              # sobe a API
# ou
npm run watch          # sobe a API e reinicia ao salvar arquivos
```

A API sobe em `http://localhost:3000`.

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/contact` | Envia o formulário de contato (`multipart/form-data`) |
| `GET` | `/health` | Verificação de disponibilidade (retorna `{ "ok": true }`) |

### `POST /api/contact`

Campos:

- `nome` — obrigatório
- `email` — obrigatório
- `assunto` — obrigatório, deve ser uma das opções de `CONTACT_SUBJECTS` em `src/validators/contact.validator.js` (as mesmas do `<select>` do site)
- `mensagem` — obrigatório
- `anexo` — opcional, até 5 MB, formatos PDF, DOC, DOCX, PPT ou PPTX

Respostas: JSON `{ "ok": boolean, "message": string }`.

| Status | Quando |
| --- | --- |
| 200 | Mensagem aceita pelo servidor SMTP |
| 400 | Campos inválidos, assunto fora da lista, anexo com formato não permitido, suspeita de spam |
| 413 | Requisição acima de 8 MB ou anexo acima de 5 MB |
| 429 | Mais de 5 envios pelo mesmo IP em 15 minutos |
| 503 | Variáveis SMTP obrigatórias não configuradas |

## Variáveis de ambiente

Veja `.env.example`. Variáveis já definidas no ambiente (ex.: painel da hospedagem) têm prioridade sobre o `.env`.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `PORT` | não | Porta HTTP (padrão 3000) |
| `ALLOWED_ORIGINS` | recomendada | Domínios do frontend autorizados via CORS, separados por vírgula. Padrão: domínio de produção + `localhost:5500` |
| `TRUST_PROXY` | não | `true` atrás de proxy (Render, Nginx) para o rate limit usar o IP real do visitante |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | **sim** | Servidor e credenciais SMTP |
| `SMTP_SECURE` | não | `true` para TLS direto (porta 465) |
| `SMTP_STARTTLS` | não | `false` desliga o STARTTLS (padrão ligado) |
| `SMTP_DOMAIN` | não | Nome usado no `EHLO` (padrão `dmsocioambiental.com`) |
| `CONTACT_TO` | não | Destinatário das mensagens (padrão `contato@dmsocioambiental.com`) |
| `CONTACT_FROM` | não | Remetente (padrão `SMTP_USER`) |

## Organização do código

```text
src/
├── server.js                    # ponto de entrada: carrega config e sobe o servidor
├── app.js                       # roteamento, CORS, headers de segurança e tratamento de erros
├── config.js                    # leitura e validação das variáveis de ambiente
├── routes/                      # um handler por rota
├── validators/                  # regras de validação do formulário
├── services/mail/               # mailer, cliente SMTP e mensagem MIME
├── templates/                   # conteúdo do e-mail enviado
├── middleware/                  # CORS, rate limit, headers de segurança
└── http/                        # HttpError e utilitários de request/response
```

Para criar uma rota nova: crie o handler em `src/routes/`, registre-o no `Map` de rotas em `src/app.js`. Erros esperados devem ser lançados como `HttpError(status, mensagem)`; qualquer outro erro vira 500 com mensagem genérica.
