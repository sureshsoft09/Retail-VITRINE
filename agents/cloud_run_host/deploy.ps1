# Deploy vitrine-agents-host to Google Cloud Run (us-central1)
$ErrorActionPreference = "Stop"

$PROJECT_ID = "gcp-aibuildercup-project"
$REGION = "us-central1"
$SERVICE_NAME = "vitrine-agents-host"
$SA_EMAIL = "vitrine-agent-sa@gcp-aibuildercup-project.iam.gserviceaccount.com"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Deploying $SERVICE_NAME to Cloud Run ($REGION)..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Set project
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run from local source
gcloud run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --service-account $SA_EMAIL `
    --set-env-vars "PROJECT_ID=$PROJECT_ID,GCP_REGION=$REGION,BQ_DATASET=vitrine_dataset" `
    --timeout 600

if ($LASTEXITCODE -eq 0) {
    $URL = (gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)").Trim()
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "SUCCESS: $SERVICE_NAME deployed successfully!" -ForegroundColor Green
    Write-Host "Service URL: $URL" -ForegroundColor Green
    Write-Host "Health Check: $URL/healthz" -ForegroundColor Green
    Write-Host "Hosted Agents: $URL/agents" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "`nDeployment failed with exit code $LASTEXITCODE." -ForegroundColor Red
}
