# Frontend Firebase Hosting Deployment Script (PowerShell)
Write-Host "Deploying VITRINE Frontend to Firebase Hosting..." -ForegroundColor Green

# Configuration
$PROJECT_ID = "gcp-aibuildercup-project"
$KEY_PATH = Join-Path $PSScriptRoot "frontend\firebase_key.json"

if (Test-Path $KEY_PATH) {
    Write-Host "Using Service Account authentication..." -ForegroundColor Cyan
    $env:GOOGLE_APPLICATION_CREDENTIALS = $KEY_PATH
}

# Set the Firebase project
Write-Host "Setting Firebase project to $PROJECT_ID..." -ForegroundColor Yellow
firebase use $PROJECT_ID

# Build the React application for production
Write-Host "Building React application for production..." -ForegroundColor Yellow
npm --prefix frontend run build

# Check if build was successful
if (!(Test-Path "frontend/build")) {
    Write-Host "Build failed - frontend/build directory not found!" -ForegroundColor Red
    exit 1
}

# Deploy to Firebase Hosting
Write-Host "Deploying to Firebase Hosting..." -ForegroundColor Yellow
firebase deploy --only hosting --project $PROJECT_ID

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "Your app is now live at: https://$PROJECT_ID.web.app" -ForegroundColor Cyan
Write-Host "Alternative URL: https://$PROJECT_ID.firebaseapp.com" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
