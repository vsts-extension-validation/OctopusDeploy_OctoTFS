@echo off
setlocal
cd "%~dp0"
powershell -NoProfile -ExecutionPolicy Unrestricted .\pack.ps1 %*