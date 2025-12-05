@echo off
echo ========================================
echo Push vers GitHub - Authentification requise
echo ========================================
echo.

cd /d "%~dp0"

echo Suppression des credentials en cache...
git credential reject <<EOF
protocol=https
host=github.com
EOF

echo.
echo Configuration du remote...
git remote set-url origin https://MorganGIT3@github.com/MorganGIT3/Zero-To-App.git

echo.
echo Verification des fichiers a pousser...
git add -A
git status --short

echo.
echo ========================================
echo Appuyez sur Entree pour pousser vers GitHub
echo GitHub vous demandera vos identifiants
echo ========================================
pause

echo.
echo Push en cours...
git push -u origin main

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo Push reussi!
) else (
    echo Erreur lors du push. Verifiez vos identifiants.
)
echo ========================================
pause
