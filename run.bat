@echo off
echo Starting WorkWave Microsoft Teams Workspace...
start "WorkWave Server" cmd /k "cd server && node server.js"
start "WorkWave Client" cmd /k "cd client && npm run dev"
timeout /t 3 >nul
start http://localhost:5173
