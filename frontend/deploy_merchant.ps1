# Deploy Enhanced UI strictly to vitrine-merchant-commerce.web.app
Push-Location $PSScriptRoot
try {
    Write-Host "Deploying VITRINE Enhanced UI to https://vitrine-merchant-commerce.web.app..." -ForegroundColor Green

    $PROJECT_ID = "gcp-aibuildercup-project"
    $KEY_PATH = Join-Path $PSScriptRoot "firebase_key.json"

    if (Test-Path $KEY_PATH) {
        Write-Host "Using Service Account authentication..." -ForegroundColor Cyan
        $env:GOOGLE_APPLICATION_CREDENTIALS = $KEY_PATH
    }

    # Always build fresh production bundle with latest changes
    Write-Host "Building VitrineUI application for production with latest VTO code..." -ForegroundColor Yellow
    npm run build

if (!(Test-Path "build")) {
    Write-Host "Build failed - build directory not found!" -ForegroundColor Red
    exit 1
}

# Deploy ONLY to vitrine-merchant-commerce
Write-Host "Deploying ONLY to site: vitrine-merchant-commerce..." -ForegroundColor Yellow
firebase deploy --only hosting:vitrine-merchant-commerce --project $PROJECT_ID --non-interactive

    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Enhanced UI is now live at:" -ForegroundColor Cyan
    Write-Host "  -> https://vitrine-merchant-commerce.web.app" -ForegroundColor Cyan
    Write-Host "Original UI remains untouched at:" -ForegroundColor Cyan
    Write-Host "  -> https://vitrine-autonomous-commerce.web.app" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} finally {
    Pop-Location
}
