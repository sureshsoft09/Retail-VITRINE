# VITRINE - Deploy All MCP Servers to Cloud Run (PowerShell)

$root = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Deploying All 3 VITRINE MCP Servers to Google Cloud Run" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Catalog MCP Server
Write-Host "`n>>> [1/3] Deploying mcp-catalog..." -ForegroundColor Yellow
Push-Location "$root\catalog"
try {
    .\deploy.ps1
} finally {
    Pop-Location
}

# 2. Promise MCP Server
Write-Host "`n>>> [2/3] Deploying mcp-promise..." -ForegroundColor Yellow
Push-Location "$root\promise"
try {
    .\deploy.ps1
} finally {
    Pop-Location
}

# 3. Commerce MCP Server
Write-Host "`n>>> [3/3] Deploying mcp-commerce..." -ForegroundColor Yellow
Push-Location "$root\commerce"
try {
    .\deploy.ps1
} finally {
    Pop-Location
}

Write-Host "`nAll 3 MCP servers deployed successfully!" -ForegroundColor Green

$GOOGLE_CLOUD_PROJECT = if ($env:GOOGLE_CLOUD_PROJECT) { $env:GOOGLE_CLOUD_PROJECT } elseif ($env:GCP_PROJECT_ID) { $env:GCP_PROJECT_ID } else { "gcp-aibuildercup-project" }
$REGION = if ($env:GOOGLE_CLOUD_LOCATION) { $env:GOOGLE_CLOUD_LOCATION } elseif ($env:GCP_REGION) { $env:GCP_REGION } else { "us-central1" }

try {
    $catRaw = (gcloud run services describe vitrine-mcp-catalog --region=$REGION --project=$GOOGLE_CLOUD_PROJECT --format="value(status.url)" 2>$null)
    $promRaw = (gcloud run services describe vitrine-mcp-promise --region=$REGION --project=$GOOGLE_CLOUD_PROJECT --format="value(status.url)" 2>$null)
    $commRaw = (gcloud run services describe vitrine-mcp-commerce --region=$REGION --project=$GOOGLE_CLOUD_PROJECT --format="value(status.url)" 2>$null)

    $catUrl = if ($catRaw) { $catRaw.Trim() } else { "(not deployed yet)" }
    $promUrl = if ($promRaw) { $promRaw.Trim() } else { "(not deployed yet)" }
    $commUrl = if ($commRaw) { $commRaw.Trim() } else { "(not deployed yet)" }

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "MCP Servers Cloud Run Status:" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "`nEndpoints for transaction/.env:" -ForegroundColor Yellow
    Write-Host "MCP_CATALOG_URL=$catUrl" -ForegroundColor Cyan
    Write-Host "MCP_PROMISE_URL=$promUrl" -ForegroundColor Cyan
    Write-Host "MCP_COMMERCE_URL=$commUrl" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} catch {
    Write-Host "Could not retrieve endpoints: $_" -ForegroundColor DarkGray
}
