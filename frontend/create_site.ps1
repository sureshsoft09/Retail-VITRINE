$PROJECT_ID = "gcp-aibuildercup-project"
$KEY_PATH = Join-Path $PSScriptRoot "firebase_key.json"
if (Test-Path $KEY_PATH) {
    $env:GOOGLE_APPLICATION_CREDENTIALS = $KEY_PATH
}

Write-Host "Creating site vitrine-merchant-commerce in project $PROJECT_ID..." -ForegroundColor Yellow
firebase hosting:sites:create vitrine-merchant-commerce --project $PROJECT_ID
