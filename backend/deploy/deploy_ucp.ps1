# Deploy vitrine-ucp to Google Cloud Run (us-central1)
$ErrorActionPreference = "Stop"

$PROJECT_ID = "gcp-aibuildercup-project"
$REGION = "us-central1"
$SERVICE_NAME = "vitrine-ucp"
$SA_EMAIL = "vitrine-agent-sa@gcp-aibuildercup-project.iam.gserviceaccount.com"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Deploying $SERVICE_NAME to Cloud Run ($REGION)..." -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Service Account: $SA_EMAIL" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Set project
gcloud config set project $PROJECT_ID

# Temporarily copy Dockerfile to root for Cloud Build
$rootDockerfile = "Dockerfile"
Copy-Item "backend/deploy/ucp.Dockerfile" -Destination $rootDockerfile -Force

try {
    # Deploy to Cloud Run using root source
    gcloud run deploy $SERVICE_NAME `
        --source . `
        --region $REGION `
        --allow-unauthenticated `
        --service-account $SA_EMAIL `
        --set-env-vars "GCP_PROJECT_ID=$PROJECT_ID,PROJECT_ID=$PROJECT_ID,GCP_REGION=$REGION,BQ_DATASET_CATALOG=vitrine_commerce,BQ_DATASET_LEDGER=vitrine_commerce,AGENT_ENGINE_RESOURCE_NAME=projects/285078287322/locations/us-central1/reasoningEngines/4500934686062673920,AGENTS_HOST_URL=https://vitrine-agents-host-285078287322.us-central1.run.app" `
        --timeout 600

    if ($LASTEXITCODE -eq 0) {
        Write-Host "==========================================================" -ForegroundColor Green
        Write-Host "SUCCESS: $SERVICE_NAME deployed successfully!" -ForegroundColor Green
        Write-Host "==========================================================" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Deployment failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    if (Test-Path $rootDockerfile) {
        Remove-Item $rootDockerfile -Force
    }
}
