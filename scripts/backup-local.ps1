$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')

$envFile = Join-Path $LaravelRoot '.env'
$dbName = Get-DotEnvValue -Path $envFile -Name 'DB_DATABASE'
if (-not $dbName) {
    $dbName = 'rts_system'
}
$dbHost = Get-DotEnvValue -Path $envFile -Name 'DB_HOST'
if (-not $dbHost) {
    $dbHost = '127.0.0.1'
}
$dbPort = Get-DotEnvValue -Path $envFile -Name 'DB_PORT'
if (-not $dbPort) {
    $dbPort = '3306'
}
$dbUser = Get-DotEnvValue -Path $envFile -Name 'DB_USERNAME'
if (-not $dbUser) {
    $dbUser = 'root'
}
$dbPassword = Get-DotEnvValue -Path $envFile -Name 'DB_PASSWORD'
if ($null -eq $dbPassword) {
    $dbPassword = ''
}

$mysqldump = Get-WampMysqldumpExe
if (-not $mysqldump) {
    Write-Host 'mysqldump was not found in WampServer MySQL.' -ForegroundColor Red
    exit 1
}

if (-not (Start-WampMysql)) {
    Write-Host 'Could not start WampServer MySQL for the backup.' -ForegroundColor Red
    exit 1
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = Join-Path $BackupRoot $stamp
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$dumpFile = Join-Path $dest 'rts_system.sql'
if ($dbPassword -ne '') {
    & $mysqldump --protocol=tcp -h $dbHost -P $dbPort -u $dbUser --password=$dbPassword --databases $dbName --result-file=$dumpFile
} else {
    & $mysqldump --protocol=tcp -h $dbHost -P $dbPort -u $dbUser --databases $dbName --result-file=$dumpFile
}
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dumpFile)) {
    Write-Host 'Database dump failed.' -ForegroundColor Red
    exit 1
}

if (Test-Path $envFile) {
    Copy-Item $envFile (Join-Path $dest 'env.backup')
}

$uploads = Join-Path $LaravelRoot 'storage\app'
if (Test-Path $uploads) {
    Copy-Item $uploads (Join-Path $dest 'storage-app') -Recurse
}

@(
    "created=$stamp",
    "database=$dbName",
    "dump=$dumpFile",
    "uploads=$uploads"
) | Set-Content (Join-Path $dest 'manifest.txt') -Encoding ASCII

Write-Host "Backup saved to $dest"
exit 0
