param(
    [Parameter(Position = 0)]
    [string]$Backup = '',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

if (-not $Backup) {
    Write-Host 'Usage: restore-local.bat backups\yyyyMMdd-HHmmss'
    if (Test-Path $BackupRoot) {
        Write-Host 'Available backups:'
        Get-ChildItem $BackupRoot -Directory | Sort-Object Name -Descending | ForEach-Object {
            Write-Host "  backups\$($_.Name)"
        }
    }
    exit 1
}

$source = $Backup
if (-not [System.IO.Path]::IsPathRooted($source)) {
    $source = Join-Path $AppRoot $Backup
}
$databaseBackup = Join-Path $source 'database.sqlite'
if (-not (Test-Path $databaseBackup)) {
    Write-Host "That backup does not contain database.sqlite: $source" -ForegroundColor Red
    exit 1
}

$listeners = @(Get-ListenerPids -Port (Get-AppPort) | Where-Object { Test-OurServerProcess -ProcessId $_ })
if ($listeners.Count -gt 0) {
    Write-Host 'Stop the application with stop-local.bat before restoring. The database file is in use.' -ForegroundColor Red
    exit 1
}

if (-not $Force) {
    Write-Host "This replaces the current local database with $source"
    $answer = Read-Host 'Type RESTORE to continue'
    if ($answer -ne 'RESTORE') {
        Write-Host 'Restore cancelled.'
        exit 1
    }
}

$envFile = Join-Path $LaravelRoot '.env'
$databaseFile = Get-DotEnvValue -Path $envFile -Name 'DB_DATABASE'
if (-not $databaseFile) {
    $databaseFile = Join-Path $LaravelRoot 'database\database.sqlite'
}

Copy-Item $databaseBackup $databaseFile -Force
$uploadBackup = Join-Path $source 'storage-app'
if (Test-Path $uploadBackup) {
    $uploads = Join-Path $LaravelRoot 'storage\app'
    New-Item -ItemType Directory -Force -Path $uploads | Out-Null
    Copy-Item (Join-Path $uploadBackup '*') $uploads -Recurse -Force
}

Write-Host "Restored the local database to $databaseFile"
Write-Host 'Start the application again with start-local.bat.'
exit 0
