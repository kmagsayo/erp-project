$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'common.ps1')

$port = Get-AppPort
Stop-BillingScheduler
$stopped = @(Stop-OurServer)

$deadline = (Get-Date).AddSeconds(10)
do {
    $listeners = @(Get-ListenerPids -Port $port)
    $ours = @($listeners | Where-Object { Test-OurServerProcess -ProcessId $_ })
    if ($ours.Count -eq 0) {
        break
    }
    Start-Sleep -Milliseconds 300
} while ((Get-Date) -lt $deadline)

$remaining = @(Get-ListenerPids -Port $port | Where-Object { Test-OurServerProcess -ProcessId $_ })
if ($remaining.Count -gt 0) {
    Write-Host "The ERP server is still listening on port $port (process $($remaining -join ', '))." -ForegroundColor Red
    exit 1
}

if ($stopped.Count -eq 0) {
    Write-Host "The ERP server was not running."
} else {
    Write-Host "Stopped the ERP server (process $($stopped -join ', '))."
}

$foreign = @(Get-ListenerPids -Port $port)
if ($foreign.Count -gt 0) {
    Write-Host "Port $port is still in use by another program (process $($foreign -join ', ')). That program was left running."
}

exit 0
