@echo off
echo [1/4] Removing backend folder...
echo (Please make sure no files are open in your editor!)
rd /s /q backend
timeout /t 2 >nul

echo [2/4] Installing Laravel 11...
composer create-project laravel/laravel:^11.0 backend

cd backend
echo [3/4] Installing specific versions for PHP 8.2...
composer require laravel/sanctum "spatie/laravel-permission:^6.0" "maatwebsite/excel:^3.1" barryvdh/laravel-dompdf --ignore-platform-reqs

echo [4/4] Setting up API and Permissions...
php artisan install:api
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

echo.
echo ==========================================
echo BACKEND SETUP COMPLETE! 
echo Please return to the AI and say "done".
echo ==========================================
pause
