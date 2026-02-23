@echo off
title Démarrage LocalLoop
color 0A

echo.
echo ========================================
echo   🚀 DÉMARRAGE LOCALLOOP
echo ========================================
echo.

echo ⚡ Démarrage du backend...
start "Backend LocalLoop" cmd /k "cd apps\backend && npm run dev"

echo ⚡ Attente du démarrage backend...
timeout /t 5 > nul

echo ⚡ Démarrage du frontend...
start "Frontend LocalLoop" cmd /k "cd apps\frontend && npm run dev"

echo ⚡ Attente du démarrage frontend...
timeout /t 10 > nul

echo.
echo 🌐 Ouverture du site...
start "" "http://localhost:3000"

echo.
echo ✅ LocalLoop est maintenant accessible !
echo    - Site : http://localhost:3000
echo    - Backend : http://localhost:4000
echo.
echo Les fenêtres de serveur restent ouvertes.
echo Fermez-les pour arrêter les services.
echo.
pause
