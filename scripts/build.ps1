# MDView Build Script for Windows
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        Building MDView Binary         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$OutputDir = Join-Path $PSScriptRoot "..\bin"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$ExePath = Join-Path $OutputDir "mdview.exe"

Write-Host "Compiling mdview.exe with Go..." -ForegroundColor Yellow
pushd (Join-Path $PSScriptRoot "..")
try {
    go build -ldflags="-H windowsgui -s -w" -o $ExePath ./cmd/mdview
    if ($LASTEXITCODE -eq 0) {
        $size = (Get-Item $ExePath).Length / 1MB
        Write-Host "Successfully created executable:" -ForegroundColor Green
        Write-Host "  Path: $ExePath" -ForegroundColor White
        Write-Host ("  Size: {0:N2} MB" -f $size) -ForegroundColor White
    } else {
        Write-Error "Build failed."
    }
} finally {
    popd
}
