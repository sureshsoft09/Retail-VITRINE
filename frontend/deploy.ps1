# Frontend Firebase Hosting Deployment Script (PowerShell)
Write-Host "Deploying VITRINE Frontend to Firebase Hosting..." -ForegroundColor Green

# Configuration
$PROJECT_ID = "gcp-aibuildercup-project"
$KEY_PATH = Join-Path $PSScriptRoot "firebase_key.json"

if (Test-Path $KEY_PATH) {
    Write-Host "Using Service Account authentication..." -ForegroundColor Cyan
    $env:GOOGLE_APPLICATION_CREDENTIALS = $KEY_PATH
}

# Build the React application if build folder is absent
if (!(Test-Path "build")) {
    Write-Host "Building React application for production..." -ForegroundColor Yellow
    npm run build
}

# Check if build was successful
if (!(Test-Path "build")) {
    Write-Host "Build failed - build directory not found!" -ForegroundColor Red
    exit 1
}

# Deploy to Firebase Hosting (all configured multisites)
Write-Host "Deploying to Firebase Hosting sites..." -ForegroundColor Yellow
firebase deploy --only hosting --project $PROJECT_ID

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your app is now live at:" -ForegroundColor Cyan
Write-Host "  1. https://vitrine-autonomous-commerce.web.app" -ForegroundColor Cyan
Write-Host "  2. https://vitrine-autonoumous-commerce.web.app" -ForegroundColor Cyan
Write-Host "  3. https://$PROJECT_ID.web.app" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
