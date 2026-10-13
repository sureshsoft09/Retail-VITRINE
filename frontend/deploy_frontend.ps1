# Deploy vitrine-frontend to Google Cloud Run (us-central1)
$ErrorActionPreference = "Stop"

$PROJECT_ID = "gcp-aibuildercup-project"
$REGION = "us-central1"
$SERVICE_NAME = "vitrine-frontend"
$SA_EMAIL = "vitrine-agent-sa@gcp-aibuildercup-project.iam.gserviceaccount.com"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Deploying $SERVICE_NAME to Cloud Run ($REGION)..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Service Account: $SA_EMAIL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Set project
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run from frontend directory
gcloud run deploy $SERVICE_NAME `
    --source frontend `
    --region $REGION `
    --allow-unauthenticated `
    --service-account $SA_EMAIL `
    --port 8080 `
    --timeout 600

if ($LASTEXITCODE -eq 0) {
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "SUCCESS: $SERVICE_NAME deployed successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "ERROR: Deployment failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
