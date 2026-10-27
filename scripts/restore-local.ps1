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
$databaseBackup = Join-Path $source 'rts_system.sql'
if (-not (Test-Path $databaseBackup)) {
    $legacySqlite = Join-Path $source 'database.sqlite'
    if (Test-Path $legacySqlite) {
        Write-Host "That backup is an old SQLite backup. This app now uses MariaDB (rts_system)." -ForegroundColor Red
    } else {
        Write-Host "That backup does not contain rts_system.sql: $source" -ForegroundColor Red
    }
    exit 1
}

$listeners = @(Get-ListenerPids -Port (Get-AppPort) | Where-Object { Test-OurServerProcess -ProcessId $_ })
if ($listeners.Count -gt 0) {
    Write-Host 'Stop the application with stop-local.bat before restoring.' -ForegroundColor Red
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
$dbHost = Get-DotEnvValue -Path $envFile -Name 'DB_HOST'
if (-not $dbHost) {
    $dbHost = '127.0.0.1'
}
$dbPort = Get-DotEnvValue -Path $envFile -Name 'DB_PORT'
if (-not $dbPort) {
    $dbPort = '3307'
}
$dbUser = Get-DotEnvValue -Path $envFile -Name 'DB_USERNAME'
if (-not $dbUser) {
    $dbUser = 'root'
}
$dbPassword = Get-DotEnvValue -Path $envFile -Name 'DB_PASSWORD'
if ($null -eq $dbPassword) {
    $dbPassword = ''
}

$mysql = Join-Path $MariaDbBin 'mysql.exe'
if (-not (Test-Path $mysql)) {
    Write-Host "mysql was not found at $mysql" -ForegroundColor Red
    exit 1
}

if (-not (Start-LocalMariaDb)) {
    Write-Host 'Could not start MariaDB for the restore.' -ForegroundColor Red
    exit 1
}

Get-Content -Path $databaseBackup -Raw | & $mysql --protocol=tcp -h $dbHost -P $dbPort -u $dbUser --password=$dbPassword
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Database restore failed.' -ForegroundColor Red
    exit 1
}

$uploadBackup = Join-Path $source 'storage-app'
if (Test-Path $uploadBackup) {
    $uploads = Join-Path $LaravelRoot 'storage\app'
    New-Item -ItemType Directory -Force -Path $uploads | Out-Null
    Copy-Item (Join-Path $uploadBackup '*') $uploads -Recurse -Force
}

Write-Host "Restored the local database from $databaseBackup"
Write-Host 'Start the application again with start-local.bat.'
exit 0
