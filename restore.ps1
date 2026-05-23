# restore.ps1 - Restore ERP System from backup
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$logFile = "C:\Users\Hab\erp-system\backups\restore_log.txt"

function Write-Log {
    param([string]$Message)
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

Write-Log "Starting restore from backup: $BackupFile"

if (-not (Test-Path $BackupFile)) {
    Write-Log "❌ Backup file not found: $BackupFile"
    exit 1
}

# Stop backend
Write-Log "Stopping backend..."
docker-compose stop backend

# Restore database
Write-Log "Restoring database..."
Get-Content $BackupFile | docker-compose exec -T postgres psql -U erp_user erpdb 2>> $logFile

if ($LASTEXITCODE -eq 0) {
    Write-Log "✅ Restore successful"
    
    # Restart backend
    Write-Log "Restarting backend..."
    docker-compose start backend
    
    Write-Log "✅ ERP system restored successfully!"
} else {
    Write-Log "❌ Restore failed!"
    exit 1
}
