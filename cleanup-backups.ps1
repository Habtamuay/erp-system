# cleanup-backups.ps1 - Clean up old backups based on retention policy

$backupDir = "C:\Users\Hab\erp-system\backups"
$logFile = "$backupDir\cleanup_log.txt"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - $Message"
    Write-Host $logEntry
    Add-Content -Path $logFile -Value $logEntry
}

Write-Log "Starting backup cleanup..."

# Retention policy
$hourlyRetention = 24   # hours
$dailyRetention = 30    # days
$weeklyRetention = 52   # weeks (1 year)
$monthlyRetention = 0   # keep forever

# Cleanup hourly backups (keep last 24 hours)
Get-ChildItem "$backupDir\erp_backup_hourly_*.zip" | 
    Where-Object { $_.CreationTime -lt (Get-Date).AddHours(-$hourlyRetention) } | 
    ForEach-Object { 
        Remove-Item $_.FullName -Force
        Write-Log "Removed old hourly backup: $($_.Name)"
    }

# Cleanup daily backups (keep last 30 days)
Get-ChildItem "$backupDir\erp_backup_daily_*.zip" | 
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$dailyRetention) } | 
    ForEach-Object { 
        Remove-Item $_.FullName -Force
        Write-Log "Removed old daily backup: $($_.Name)"
    }

# Cleanup weekly backups (keep last 52 weeks)
Get-ChildItem "$backupDir\erp_backup_weekly_*.zip" | 
    Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-($weeklyRetention * 7)) } | 
    ForEach-Object { 
        Remove-Item $_.FullName -Force
        Write-Log "Removed old weekly backup: $($_.Name)"
    }

# Monthly backups are kept forever (no cleanup)

Write-Log "Backup cleanup completed"

# Show current backup status
$totalBackups = (Get-ChildItem "$backupDir\*.zip").Count
$totalSize = [math]::Round((Get-ChildItem "$backupDir\*.zip" | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
Write-Log "Current backups: $totalBackups files, $totalSize MB total"
