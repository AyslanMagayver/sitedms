@echo off
REM ============================================================
REM  Envia o conteudo desta pasta para o repositorio sitedms
REM  (substitui tudo que esta la - force push na branch main)
REM ============================================================
cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
    echo [ERRO] Git nao encontrado neste computador.
    echo Instale em: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo [1/3] Salvando alteracoes locais (commit)...
git add -A
git commit -m "Publica versao v6 estavel"

echo.
echo [2/3] Enviando para github.com/AyslanMagayver/sitedms (main)...
git push --force https://github.com/AyslanMagayver/sitedms.git main:main

if errorlevel 1 (
    echo.
    echo [ERRO] O envio falhou. Causas mais comuns:
    echo   - Voce nao tem permissao de escrita no repositorio sitedms
    echo     ^(peca ao dono para te adicionar como colaborador^)
    echo   - A branch main do sitedms esta protegida contra force push
    echo   - Login do GitHub cancelado na janela do navegador
    pause
    exit /b 1
)

echo.
echo [3/3] SUCESSO! O sitedms agora esta identico a esta pasta.
pause
