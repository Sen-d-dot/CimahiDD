@echo off
title TAKHIR - Jalankan Lokal
cd /d "%~dp0"

if not exist .env (
    echo File .env belum ada.
    echo Salin .env.example menjadi .env, lalu isi DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, dan ADMIN_PASSWORD.
    pause
    exit /b 1
)

echo [1/4] Install paket backend...
call npm install
if errorlevel 1 goto gagal

echo.
echo [2/4] Membuat tabel dan akun admin di database...
call npm run migrate
if errorlevel 1 goto gagal

echo.
echo [3/4] Install paket frontend...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 goto gagal

echo.
echo [4/4] Menjalankan backend dan frontend di jendela baru...
start "TAKHIR Backend" /d "%~dp0" cmd /k "npm run dev"
start "TAKHIR Frontend" /d "%~dp0frontend" cmd /k "npm run dev"
timeout /t 5 >nul
start http://localhost:5173
echo.
echo Selesai. Login memakai ADMIN_EMAIL dan ADMIN_PASSWORD dari file .env
pause
exit /b 0

:gagal
echo.
echo Ada langkah yang gagal. Baca pesan error di atas, perbaiki, lalu jalankan ulang file ini.
pause
exit /b 1
