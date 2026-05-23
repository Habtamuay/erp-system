# quick-status.ps1 - Quick system status check

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ERP System Quick Status" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Container status
Write-Host "`n📦 Containers:" -ForegroundColor Yellow
docker-compose ps --format "table {{.Name}}\t{{.Status}}" 2>$null

# API health
Write-Host "`n❤️ API Health:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ API is healthy" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API is down" -ForegroundColor Red
}

# Database status
Write-Host "`n🗄️ Database:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/db-status" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    if ($data.connected) {
        Write-Host "   ✅ Connected" -ForegroundColor Green
        Write-Host "   📊 $($data.companies) companies, $($data.users) users" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Connection failed" -ForegroundColor Red
}

# Backup status
Write-Host "`n💾 Latest Backup:" -ForegroundColor Yellow
$backupDir = "C:\Users\Hab\erp-system\backups"
if (Test-Path $backupDir) {
    $latest = Get-ChildItem "$backupDir\*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latest) {
        $daysOld = [math]::Round(((Get-Date) - $latest.LastWriteTime).TotalHours, 1)
        Write-Host "   📁 $($latest.Name)" -ForegroundColor White
        Write-Host "   🕐 $daysOld hours ago" -ForegroundColor Gray
        Write-Host "   💾 $([math]::Round($latest.Length/1MB,2)) MB" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ No backups found" -ForegroundColor Yellow
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
