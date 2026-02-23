@echo off
echo ========================================
echo    Configuration de la base de donnees
echo    LocalLoop - WampServer Setup
echo ========================================
echo.

echo 1. Verification de WampServer...
echo    - Assurez-vous que WampServer est demarre
echo    - Verifiez que MySQL est actif (icone verte)
echo.
pause

echo 2. Ouverture de phpMyAdmin...
echo    - Le navigateur va s'ouvrir automatiquement
echo    - Connectez-vous (generalement sans mot de passe)
echo.
start http://localhost/phpmyadmin
pause

echo 3. Instructions pour la creation de la base:
echo    - Cliquez sur "Nouvelle base de donnees"
echo    - Nom: localloop
echo    - Interclassement: utf8mb4_unicode_ci
echo    - Cliquez "Creer"
echo.
pause

echo 4. Import du schema SQL...
echo    - Selectionnez la base "localloop"
echo    - Cliquez sur l'onglet "Importer"
echo    - Cliquez "Choisir un fichier"
echo    - Selectionnez: database\mysql_schema.sql
echo    - Cliquez "Executer"
echo.
pause

echo 5. Test de la connexion...
echo    - Demarrage du backend pour tester la connexion
echo.
cd apps\backend
npm run dev

echo.
echo ========================================
echo    Configuration terminee!
echo ========================================
pause
