@echo off
setlocal
cd "%~dp0"
powershell -NoProfile -ExecutionPolicy Unrestricted .\embed-octo.ps1 %*