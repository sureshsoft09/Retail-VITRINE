# VITRINE ADK Web Launcher
# Standardized on us-central1 and gcp-aibuildercup-project

$env:GOOGLE_CLOUD_PROJECT = "gcp-aibuildercup-project"
$env:GCP_PROJECT_ID = "gcp-aibuildercup-project"
$env:GOOGLE_CLOUD_LOCATION = "us-central1"
$env:GCP_REGION = "us-central1"
$env:GOOGLE_GENAI_USE_VERTEXAI = "true"

# Explicit Model Pinning to verified Vertex AI models in us-central1
$env:MODEL_REASONING = "gemini-2.5-pro"
$env:MODEL_FAST = "gemini-2.5-flash"
$env:MODEL_PIN_PRIMARY = "gemini-2.5-pro"
$env:MODEL_PIN_FAST = "gemini-2.5-flash"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Launching VITRINE ADK Web Dashboard" -ForegroundColor Green
Write-Host "Project:   $env:GOOGLE_CLOUD_PROJECT" -ForegroundColor Yellow
Write-Host "Location:  $env:GOOGLE_CLOUD_LOCATION" -ForegroundColor Yellow
Write-Host "Reasoning: $env:MODEL_REASONING" -ForegroundColor Yellow
Write-Host "Fast:      $env:MODEL_FAST" -ForegroundColor Yellow
Write-Host "Port:      8000" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

& "$PSScriptRoot\.venv\Scripts\adk.exe" web "$PSScriptRoot\agents\src" --port 8000
