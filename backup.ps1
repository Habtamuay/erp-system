# backup.ps1 - Windows backup script for ERP System
param(
    [string]$Type = "daily"
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "C:\Users\Hab\erp-system\backups"
$backupFile = "$backupDir\erp_backup_${Type}_$timestamp.sql"
$logFile = "$backupDir\backup_log.txt"

function Write-Log {
    param([string]$Message)
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

Write-Log "Starting $Type backup..."

# Backup PostgreSQL database
docker-compose exec -T postgres pg_dump -U erp_user erpdb > $backupFile 2>> $logFile

if ($LASTEXITCODE -eq 0) {
    Write-Log "✅ Backup successful: $backupFile"
    
    # Compress backup
    Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
    Remove-Item $backupFile
    Write-Log "✅ Backup compressed: $backupFile.zip"
    
    # Cleanup old backups based on type
    switch ($Type) {
        "hourly" {
            # Keep last 24 hours of hourly backups
            Get-ChildItem "$backupDir\erp_backup_hourly_*.zip" | 
                Where-Object { $_.CreationTime -lt (Get-Date).AddHours(-24) } | 
                ForEach-Object { Remove-Item $_.FullName; Write-Log "Removed old hourly backup: $($_.Name)" }
        }
        "daily" {
            # Keep last 30 days of daily backups
            Get-ChildItem "$backupDir\erp_backup_daily_*.zip" | 
                Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | 
                ForEach-Object { Remove-Item $_.FullName; Write-Log "Removed old daily backup: $($_.Name)" }
        }
        "weekly" {
            # Keep last 52 weeks of weekly backups
            Get-ChildItem "$backupDir\erp_backup_weekly_*.zip" | 
                Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-364) } | 
                ForEach-Object { Remove-Item $_.FullName; Write-Log "Removed old weekly backup: $($_.Name)" }
        }
        "monthly" {
            # Keep monthly backups permanently
            Write-Log "Monthly backup kept permanently"
        }
    }
} else {
    Write-Log "❌ Backup failed!"
    exit 1
}

Write-Log "Backup completed successfully"
