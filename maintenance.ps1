# maintenance.ps1 - Weekly maintenance tasks
Write-Host "Starting weekly maintenance..." -ForegroundColor Cyan

# Clean up Docker system
Write-Host "`n🧹 Cleaning up Docker system..." -ForegroundColor Yellow
docker system prune -f --volumes 2>$null

# Restart all services to refresh
Write-Host "`n🔄 Restarting all services..." -ForegroundColor Yellow
docker-compose restart 2>$null

# Check disk space
Write-Host "`n💾 Checking disk space..." -ForegroundColor Yellow
$drive = Get-PSDrive -Name C
$freeSpace = [math]::Round($drive.Free / 1GB, 2)
$totalSpace = [math]::Round($drive.Used / 1GB + $freeSpace, 2)
$usedPercent = [math]::Round((($totalSpace - $freeSpace) / $totalSpace) * 100, 1)

Write-Host "   Free Space: $freeSpace GB / $totalSpace GB" -ForegroundColor White
Write-Host "   Usage: $usedPercent%" -ForegroundColor White

if ($freeSpace -lt 10) {
    Write-Host "⚠️ LOW DISK SPACE WARNING! Less than 10GB free." -ForegroundColor Red
    
    # Clean up old backups older than 60 days
    $backupDir = "C:\Users\Hab\erp-system\backups"
    if (Test-Path $backupDir) {
        Write-Host "   Cleaning up old backups..." -ForegroundColor Yellow
        Get-ChildItem "$backupDir\*.zip" | 
            Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-60) } | 
            Remove-Item -Force
    }
}

# Check API health
Write-Host "`n❤️ Checking API health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ API is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ API health check failed" -ForegroundColor Red
}

Write-Host "`n✅ Maintenance completed at $(Get-Date)" -ForegroundColor Green
