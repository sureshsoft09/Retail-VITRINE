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
