#!/usr/bin/env pwsh
$ErrorActionPreference = 'SilentlyContinue'
$port = 5000

Write-Host "Cleaning up port $port..." -ForegroundColor Cyan

$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    foreach ($p in $process) {
        if ($p.OwningProcess -gt 0) {
            Write-Host "Killing process $($p.OwningProcess) on port $port" -ForegroundColor Yellow
            Stop-Process -Id $p.OwningProcess -Force
        }
    }
} else {
    Write-Host "Port $port is already free." -ForegroundColor Green
}

# Also kill any orphaned tsx/node processes that might be hanging
$nodeProcesses = Get-Process -Name "node" | Where-Object { $_.Path -like "*TouristGeo*" }
if ($nodeProcesses) {
    foreach ($p in $nodeProcesses) {
        Write-Host "Killing potentially orphaned node process $($p.Id)" -ForegroundColor Yellow
        Stop-Process -Id $p.Id -Force
    }
}
