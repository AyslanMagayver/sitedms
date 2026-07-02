# Backend/API do formulario DMS

O site agora usa uma API propria em Node.js para enviar o formulario sem abrir a janela de `mailto`.

## Como rodar

1. Copie `.env.example` para `.env`.
2. Preencha as configuracoes SMTP.
3. Rode:

```bash
node server.js
```

Por padrao, o site abre em:

```text
http://127.0.0.1:3000
```

## Variaveis obrigatorias

```env
SMTP_HOST=smtp.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_STARTTLS=true
SMTP_USER=usuario@seudominio.com
SMTP_PASS=sua_senha_ou_app_password
CONTACT_TO=contato@dmsocioambiental.com
CONTACT_FROM=usuario@seudominio.com
```

## Anexos

A API aceita um anexo opcional com limite de 5 MB.

Formatos aceitos:

- PDF
- DOC
- DOCX
- PPT
- PPTX

## Endpoint

```text
POST /api/contact
```

Campos esperados:

- `nome`
- `email`
- `assunto`
- `mensagem`
- `anexo` opcional

## Observacao importante

Para o envio automatico funcionar online, o site precisa ser hospedado em um ambiente que rode Node.js, como Render, Railway, VPS, servidor proprio, Azure App Service, DigitalOcean App Platform ou similar. Hospedagem puramente estatica nao executa esse backend.
