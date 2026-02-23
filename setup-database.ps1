# Script de configuration automatique de la base de données LocalLoop
# Pour WampServer

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Configuration de la base de données" -ForegroundColor Cyan
Write-Host "   LocalLoop - WampServer Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérification de WampServer
Write-Host "1. Vérification de WampServer..." -ForegroundColor Yellow
try {
    $wampProcess = Get-Process -Name "wampmanager" -ErrorAction SilentlyContinue
    if ($wampProcess) {
        Write-Host "   ✅ WampServer est en cours d'exécution" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  WampServer n'est pas détecté" -ForegroundColor Red
        Write-Host "   Veuillez démarrer WampServer manuellement" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier WampServer" -ForegroundColor Red
}

# Test de connexion MySQL
Write-Host ""
Write-Host "2. Test de connexion MySQL..." -ForegroundColor Yellow
try {
    $connection = New-Object System.Data.Odbc.OdbcConnection("Driver={MySQL ODBC 8.0 Driver};Server=localhost;Database=mysql;User=root;Password=;")
    $connection.Open()
    Write-Host "   ✅ Connexion MySQL réussie" -ForegroundColor Green
    $connection.Close()
} catch {
    Write-Host "   ⚠️  Connexion MySQL échouée" -ForegroundColor Red
    Write-Host "   Assurez-vous que MySQL est démarré dans WampServer" -ForegroundColor Red
}

# Ouverture de phpMyAdmin
Write-Host ""
Write-Host "3. Ouverture de phpMyAdmin..." -ForegroundColor Yellow
Start-Process "http://localhost/phpmyadmin"
Write-Host "   🌐 phpMyAdmin ouvert dans le navigateur" -ForegroundColor Green

# Instructions détaillées
Write-Host ""
Write-Host "4. Instructions pour la configuration:" -ForegroundColor Yellow
Write-Host "   📋 Suivez ces étapes dans phpMyAdmin:" -ForegroundColor White
Write-Host "      • Cliquez sur 'Nouvelle base de données'" -ForegroundColor Gray
Write-Host "      • Nom: localloop" -ForegroundColor Gray
Write-Host "      • Interclassement: utf8mb4_unicode_ci" -ForegroundColor Gray
Write-Host "      • Cliquez 'Créer'" -ForegroundColor Gray
Write-Host ""
Write-Host "      • Sélectionnez la base 'localloop'" -ForegroundColor Gray
Write-Host "      • Cliquez sur l'onglet 'Importer'" -ForegroundColor Gray
Write-Host "      • Cliquez 'Choisir un fichier'" -ForegroundColor Gray
Write-Host "      • Sélectionnez: database\mysql_schema.sql" -ForegroundColor Gray
Write-Host "      • Cliquez 'Exécuter'" -ForegroundColor Gray

# Attendre que l'utilisateur termine
Write-Host ""
Write-Host "5. Appuyez sur Entrée quand vous avez terminé la configuration..." -ForegroundColor Yellow
Read-Host

# Test de la connexion backend
Write-Host ""
Write-Host "6. Test de la connexion backend..." -ForegroundColor Yellow
Set-Location "apps\backend"

# Vérifier si node_modules existe
if (Test-Path "node_modules") {
    Write-Host "   ✅ Dépendances installées" -ForegroundColor Green
} else {
    Write-Host "   📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Démarrer le backend en arrière-plan pour tester
Write-Host "   🚀 Démarrage du backend pour test..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

# Attendre un peu pour que le serveur démarre
Start-Sleep -Seconds 5

# Test de l'API
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4000/api/health" -Method Get
    if ($response.ok) {
        Write-Host "   ✅ Backend démarré avec succès" -ForegroundColor Green
        Write-Host "   ✅ Connexion à la base de données réussie" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Erreur lors du test du backend" -ForegroundColor Red
}

# Arrêter le processus de test
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Configuration terminée!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour démarrer l'application:" -ForegroundColor White
Write-Host "   cd apps\backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Puis dans un autre terminal:" -ForegroundColor White
Write-Host "   cd apps\frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entrée pour fermer"
