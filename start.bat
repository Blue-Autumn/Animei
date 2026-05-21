@echo off
start "Animei Server" cmd /k "pnpm dev:all --host 0.0.0.0"
start "Animei Vite" cmd /k "pnpm dev --host 0.0.0.0"