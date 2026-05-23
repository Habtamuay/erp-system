# monitor-tasks.ps1 - Monitor scheduled tasks status

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Scheduled Tasks Monitor" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$tasks = @(
    "ERP-HourlyBackup",
    "ERP-DailyBackup", 
    "ERP-WeeklyBackup",
    "ERP-MonthlyBackup",
    "ERP-HealthCheck",
    "ERP-AutoRestart",
    "ERP-Maintenance"
)

foreach ($taskName in $tasks) {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task) {
        $state = $task.State
        $stateIcon = if ($state -eq "Ready") { "✅" } else { "⚠️" }
        Write-Host "$stateIcon $taskName : $state" -ForegroundColor $(if ($state -eq "Ready") { "Green" } else { "Yellow" })
    } else {
        Write-Host "❌ $taskName : Not Found" -ForegroundColor Red
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
