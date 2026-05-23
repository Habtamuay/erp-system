# auto-restart.ps1 - Monitor and restart failed containers
Write-Host "Checking container health..." -ForegroundColor Cyan

$containers = @("erp-postgres", "erp-backend", "erp-frontend", "erp-nginx")
$restarted = $false

foreach ($container in $containers) {
    $status = docker ps --filter "name=$container" --format "{{.Status}}" 2>$null
    
    if ($status) {
        if ($status -like "*unhealthy*") {
            Write-Host "⚠️ Container $container is unhealthy. Restarting..." -ForegroundColor Yellow
            docker-compose restart $container 2>$null
            $restarted = $true
            Start-Sleep -Seconds 5
        } elseif ($status -notlike "*Up*") {
            Write-Host "⚠️ Container $container is not running. Starting..." -ForegroundColor Yellow
            docker-compose up -d $container 2>$null
            $restarted = $true
        } else {
            Write-Host "✅ Container $container is running" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Container $container not found. Starting..." -ForegroundColor Yellow
        docker-compose up -d $container 2>$null
        $restarted = $true
    }
}

if ($restarted) {
    Write-Host "`n✅ Container recovery completed" -ForegroundColor Green
} else {
    Write-Host "`n✅ All containers are healthy" -ForegroundColor Green
}
