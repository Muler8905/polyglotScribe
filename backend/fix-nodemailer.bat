@echo off
echo ========================================
echo Fixing Nodemailer Installation
echo ========================================
echo.

echo Step 1: Removing node_modules...
rmdir /s /q node_modules 2>nul

echo Step 2: Removing package-lock.json...
del package-lock.json 2>nul

echo Step 3: Clearing npm cache...
call npm cache clean --force

echo Step 4: Installing dependencies...
call npm install

echo.
echo ========================================
echo Done! Try running: npm run dev
echo ========================================
pause
