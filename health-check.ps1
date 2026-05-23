# health-check.ps1 - Monitor ERP System health

$webRequest = @{
    Uri = "http://localhost:8081/api/health"
    UseBasicParsing = $true
    TimeoutSec = 10
}

try {
    $response = Invoke-WebRequest @webRequest
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ERP System is healthy" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ ERP System returned status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERP System is down: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
