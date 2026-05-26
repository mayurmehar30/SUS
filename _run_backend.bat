@echo off
title SUS-Backend
cd /d "D:\repo\SUS\backend"
echo.
echo  [SUS Backend] Starting Spring Boot on port 8090...
echo  [SUS Backend] DB: localhost:5435/susdb
echo.
mvn spring-boot:run
pause
