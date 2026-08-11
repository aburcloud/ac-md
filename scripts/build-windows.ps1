# AburMD Windows Build Script
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Building AburMD Windows Binary   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$OutputDir = Join-Path $PSScriptRoot "..\bin"
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$ExePath = Join-Path $OutputDir "aburmd.exe"

Write-Host "Compiling aburmd.exe with Go..." -ForegroundColor Yellow
pushd (Join-Path $PSScriptRoot "..")
try {
    go build -ldflags="-H windowsgui -s -w" -o $ExePath ./cmd/aburmd
    if ($LASTEXITCODE -eq 0) {
        $size = (Get-Item $ExePath).Length / 1MB
        Write-Host "Successfully compiled executable:" -ForegroundColor Green
        Write-Host "  Path: $ExePath" -ForegroundColor White
        Write-Host ("  Size: {0:N2} MB" -f $size) -ForegroundColor White
    } else {
        Write-Error "Build failed."
    }
} finally {
    popd
}
