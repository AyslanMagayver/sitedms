# Auditoria Estrutural e LGPD - DMS Landing

Data: 2026-05-18

## Escopo

- Backend `server.js`.
- Formulário de contato com anexo.
- Área protegida DMS InTech.
- Exposição de arquivos no servidor estático.
- Pontos mínimos de LGPD relacionados a coleta de nome, email, mensagem e anexos.

## Correções aplicadas

1. Bloqueio de arquivos e diretórios sensíveis no servidor estático:
   - `.env`
   - `intech-users.json` e backups derivados
   - `server.js`
   - `package.json` e `package-lock.json`
   - `README*`
   - `*.log`
   - `*.backup`
   - `*.mjs`
   - `tools/`
   - `node_modules/`
   - perfis locais de browser e pastas de auditoria

2. Headers básicos de segurança adicionados:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

3. Headers aplicados também em respostas JSON, páginas protegidas, redirecionamentos e respostas de login/logout.

## Pontos positivos existentes

- Senhas dos clientes não ficam em texto claro; são armazenadas com `salt` e `passwordHash`.
- Comparação de senha usa `crypto.timingSafeEqual`.
- Cookie de sessão usa `HttpOnly` e `SameSite=Lax`.
- Em produção, o cookie adiciona `Secure` se `NODE_ENV=production`.
- O formulário de contato já limita tamanho do request e anexo.
- O formulário valida nome, email, assunto permitido, extensão/tipo de anexo e sinais simples de spam.
- O endpoint de contato tem rate limit por IP.
- O acesso à área do cliente exige sessão compatível com o usuário da rota.

## Riscos remanescentes

1. LGPD: ainda falta uma página ou seção formal de Política de Privacidade.
2. LGPD: o formulário coleta nome, email, mensagem e anexo, mas não informa claramente finalidade, base de tratamento, retenção, direitos do titular e canal de atendimento.
3. LGPD: anexos podem conter currículo, proposta ou dados pessoais sensíveis enviados espontaneamente; isso exige aviso claro antes do envio.
4. Sessões da DMS InTech ficam em memória. Em reinício do servidor, todos são deslogados. Para produção simples é aceitável, mas não é ideal para escala.
5. Não há rate limit no login da DMS InTech, o que permite tentativa de força bruta se o site ficar público.
6. Não há CSRF token. O risco é parcialmente reduzido por `SameSite=Lax`, mas endpoints POST ainda poderiam ser endurecidos.
7. A aplicação depende de `NODE_ENV=production` para adicionar `Secure` ao cookie. Em hospedagem real, confirmar essa variável.
8. Não há Content Security Policy. Uma CSP ajudaria a reduzir impacto de XSS e controlar fontes externas como Power BI.

## Recomendações prioritárias

1. Criar `privacidade.html` com política objetiva de privacidade.
2. Adicionar aviso curto no formulário: finalidade do contato, possibilidade de envio de anexos e link para política.
3. Adicionar checkbox obrigatório: "Li e concordo com a Política de Privacidade".
4. Adicionar rate limit também em `/api/intech/login`.
5. Adicionar CSP compatível com assets locais e `https://app.powerbi.com`.
6. Em produção, garantir HTTPS e `NODE_ENV=production`.
7. Definir rotina de retenção: por quanto tempo emails/anexos recebidos serão guardados e quem terá acesso.

## Validação técnica

- Sintaxe de `server.js` validada com Node.js empacotado do Codex.
- Novos bloqueios foram implementados diretamente no roteamento estático.

## Resultado

A estrutura ficou mais segura após os bloqueios e headers adicionados. Do ponto de vista LGPD, ainda falta a camada documental e informativa para o titular dos dados. A recomendação é não publicar o formulário como definitivo sem política de privacidade e aviso de tratamento de dados.
