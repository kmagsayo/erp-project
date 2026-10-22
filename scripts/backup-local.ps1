$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$envFile = Join-Path $LaravelRoot '.env'
$databaseFile = Get-DotEnvValue -Path $envFile -Name 'DB_DATABASE'
if (-not $databaseFile) {
    $databaseFile = Join-Path $LaravelRoot 'database\database.sqlite'
}
if (-not (Test-Path $databaseFile)) {
    Write-Host "No database file was found at $databaseFile" -ForegroundColor Red
    exit 1
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = Join-Path $BackupRoot $stamp
New-Item -ItemType Directory -Force -Path $dest | Out-Null

Copy-Item $databaseFile (Join-Path $dest 'database.sqlite')
if (Test-Path $envFile) {
    Copy-Item $envFile (Join-Path $dest 'env.backup')
}

$uploads = Join-Path $LaravelRoot 'storage\app'
if (Test-Path $uploads) {
    Copy-Item $uploads (Join-Path $dest 'storage-app') -Recurse
}

@(
    "created=$stamp",
    "database=$databaseFile",
    "uploads=$uploads"
) | Set-Content (Join-Path $dest 'manifest.txt') -Encoding ASCII

Write-Host "Backup saved to $dest"
exit 0
