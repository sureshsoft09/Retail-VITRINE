# VITRINE MCP Commerce Server Cloud Run Deployment Script (PowerShell)

# Configuration (Uses environment variables if set, otherwise defaults)
$GOOGLE_CLOUD_PROJECT = if ($env:GOOGLE_CLOUD_PROJECT) { $env:GOOGLE_CLOUD_PROJECT } elseif ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "gcp-aibuildercup-project" }
$REGION = if ($env:GOOGLE_CLOUD_LOCATION) { $env:GOOGLE_CLOUD_LOCATION } elseif ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }
$SERVICE_NAME = "vitrine-mcp-commerce"
$SERVICE_ACCOUNT = if ($env:SERVICE_ACCOUNT -ne $null) { $env:SERVICE_ACCOUNT } else { "vitrine-agent-sa@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" }
$SA_ARG = if ($SERVICE_ACCOUNT -and $SERVICE_ACCOUNT.Trim() -ne "") { @("--service-account=$SERVICE_ACCOUNT") } else { @() }

# Ensure you're authenticated and project is set
Write-Host "Setting up Google Cloud configuration..." -ForegroundColor Green
Write-Host "Project: $GOOGLE_CLOUD_PROJECT | Region: $REGION | Service: $SERVICE_NAME" -ForegroundColor Cyan
if ($SERVICE_ACCOUNT) { Write-Host "Runtime Identity: $SERVICE_ACCOUNT" -ForegroundColor Cyan } else { Write-Host "Runtime Identity: Default Compute Service Account" -ForegroundColor Cyan }
gcloud config set project $GOOGLE_CLOUD_PROJECT

# Enable required APIs
Write-Host "Enabling required Google Cloud APIs..." -ForegroundColor Green
gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project=$GOOGLE_CLOUD_PROJECT

# Deploy to Cloud Run using source deployment
Write-Host "Deploying VITRINE MCP Commerce Server to Cloud Run..." -ForegroundColor Green

if ($SERVICE_ACCOUNT -and $SERVICE_ACCOUNT.Trim() -ne "") {
    gcloud run deploy $SERVICE_NAME `
        --service-account=$SERVICE_ACCOUNT `
        --allow-unauthenticated `
        --region=$REGION `
        --source=. `
        --labels=app=vitrine-mcp-commerce `
        --memory=512Mi `
        --cpu=1 `
        --max-instances=10 `
        --min-instances=0 `
        --timeout=600 `
        --concurrency=80 `
        --set-env-vars="GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$REGION,BQ_DATASET_LEDGER=vitrine_commerce,AUTONOMY_MARGIN_FLOOR_PCT=18.0,AUTONOMY_DISCOUNT_CAP_PCT=15.0,AUTONOMY_MAX_ORDER_VALUE_USD=250.0,FIRESTORE_DATABASE=vitrine-db" `
        --project=$GOOGLE_CLOUD_PROJECT
} else {
    gcloud run deploy $SERVICE_NAME `
        --allow-unauthenticated `
        --region=$REGION `
        --source=. `
        --labels=app=vitrine-mcp-commerce `
        --memory=512Mi `
        --cpu=1 `
        --max-instances=10 `
        --min-instances=0 `
        --timeout=600 `
        --concurrency=80 `
        --set-env-vars="GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$REGION,BQ_DATASET_LEDGER=vitrine_commerce,AUTONOMY_MARGIN_FLOOR_PCT=18.0,AUTONOMY_DISCOUNT_CAP_PCT=15.0,AUTONOMY_MAX_ORDER_VALUE_USD=250.0,FIRESTORE_DATABASE=vitrine-db" `
        --project=$GOOGLE_CLOUD_PROJECT
}

if ($LASTEXITCODE -eq 0) {
    $describe = gcloud run services describe $SERVICE_NAME --region=$REGION --project=$GOOGLE_CLOUD_PROJECT --format="value(status.url)"
    if ($describe) {
        $URL = $describe.Trim()
        Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
        Write-Host "Service URL:  $URL" -ForegroundColor Cyan
        Write-Host "MCP Endpoint: $URL/mcp" -ForegroundColor Cyan
    }
} else {
    Write-Host "`nDeployment encountered an error (exit code $LASTEXITCODE)." -ForegroundColor Red
}

