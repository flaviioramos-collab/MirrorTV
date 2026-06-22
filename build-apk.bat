@echo off
REM MirrorTV Build Script for Windows
REM Gera APK Debug facilmente

setlocal enabledelayedexpansion

echo MirrorTV APK Builder
echo =====================

REM Check if npm exists
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm not found. Install Node.js
    exit /b 1
)

REM Check if java exists
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Java not found. Install Java JDK 17
    exit /b 1
)

echo.
echo Step 1: Building Next.js...
call npm run build
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo Step 2: Syncing Capacitor...
call npx cap sync
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo Step 3: Building Android APK...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 exit /b 1

echo.
echo Build Complete!
echo.

set APK_PATH=app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo APK: %APK_PATH%
    for %%A in ("%APK_PATH%") do echo Size: %%~zA bytes
) else (
    echo Error: APK not found
    exit /b 1
)

echo.
echo Next steps:
echo  - Connect Android device: adb connect [device-ip]
echo  - Install APK: adb install %APK_PATH%
echo  - Or upload to GitHub Releases
