# VITRINE MCP Promise Server Cloud Run Deployment Script (PowerShell)

# Configuration
$GOOGLE_CLOUD_PROJECT = "gcp-aibuildercup-project"  # Replace with your GCP project ID
$REGION = "us-central1"                             # Standardized Region
$SERVICE_NAME = "vitrine-mcp-promise"
$SERVICE_ACCOUNT = "vitrine-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com"

# Ensure you're authenticated and project is set
Write-Host "Setting up Google Cloud configuration..." -ForegroundColor Green
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable required APIs
Write-Host "Enabling required Google Cloud APIs..." -ForegroundColor Green
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Deploy to Cloud Run using source deployment
Write-Host "Deploying VITRINE MCP Promise Server to Cloud Run..." -ForegroundColor Green
gcloud run deploy $SERVICE_NAME `
    --service-account=$SERVICE_ACCOUNT `
    --no-allow-unauthenticated `
    --region=$REGION `
    --source=. `
    --labels=app=vitrine,service=mcp-promise `
    --memory=512Mi `
    --cpu=1 `
    --max-instances=10 `
    --min-instances=0 `
    --timeout=600 `
    --concurrency=80 `
    --set-env-vars="PORT=8080,GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$REGION,FIRESTORE_DATABASE=vitrine-db" `
    --project=$GOOGLE_CLOUD_PROJECT

Write-Host "Deployment completed!" -ForegroundColor Green
