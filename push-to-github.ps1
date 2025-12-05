# Script pour pousser vers GitHub avec authentification

# Fonction pour afficher une barre de chargement animée

function Show-ProgressBar {
    param(
        [string]$Activity = "Push vers GitHub",
        [string]$Status = "En cours...",
        [int]$PercentComplete = 0
    )
    
    Write-Progress -Activity $Activity -Status $Status -PercentComplete $PercentComplete
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Push vers GitHub - Authentification requise" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Aller dans le dossier du projet
Set-Location $PSScriptRoot

# Supprimer les credentials en cache
Write-Host "Suppression des credentials en cache..." -ForegroundColor Yellow
$env:GIT_TERMINAL_PROMPT = "1"
$env:GIT_ASKPASS = ""

# Supprimer les credentials Windows pour GitHub
$credentials = cmdkey /list | Select-String "github"
if ($credentials) {
    Write-Host "Credentials Windows trouves, suppression..." -ForegroundColor Yellow
    $credentials | ForEach-Object {
        if ($_ -match "Target: (.*)") {
            cmdkey /delete:$matches[1] 2>$null
        }
    }
}

# Configurer le remote avec le nom d'utilisateur
Write-Host "Configuration du remote..." -ForegroundColor Yellow
git remote set-url origin https://MorganGIT3@github.com/MorganGIT3/Zero-To-App.git

# Désactiver le credential helper pour forcer la demande
git config --local credential.helper ""
git config --local --unset credential.helper

# Ajouter tous les fichiers
Write-Host "Ajout des fichiers..." -ForegroundColor Yellow
git add -A

# Afficher le statut
Write-Host ""
Write-Host "Fichiers a pousser:" -ForegroundColor Green
git status --short

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Appuyez sur Entree pour pousser vers GitHub" -ForegroundColor Yellow
Write-Host "GitHub vous demandera:" -ForegroundColor Yellow
Write-Host "  - Username: MorganGIT3" -ForegroundColor White
Write-Host "  - Password: Votre Personal Access Token GitHub" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: GitHub n'accepte plus les mots de passe." -ForegroundColor Red
Write-Host "Vous devez utiliser un Personal Access Token." -ForegroundColor Red
Write-Host "Creer un token: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""
Read-Host "Appuyez sur Entree pour continuer"

# Forcer la demande d'authentification
$env:GIT_TERMINAL_PROMPT = "1"
$env:GIT_ASKPASS = ""

Write-Host ""
Write-Host "Push en cours..." -ForegroundColor Yellow
Write-Host "GitHub va maintenant vous demander vos identifiants..." -ForegroundColor Green
Write-Host ""

# Push avec authentification interactive
git -c credential.helper= push -u origin main

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Push reussi!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Erreur lors du push." -ForegroundColor Red
    Write-Host "Verifiez vos identifiants." -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"
