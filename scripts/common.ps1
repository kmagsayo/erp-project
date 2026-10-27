$ErrorActionPreference = 'Continue'

$script:AppRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$script:FrontendRoot = Join-Path $AppRoot 'frontend'
$script:LaravelRoot = Join-Path $AppRoot 'backend'
$script:LogDir = Join-Path $AppRoot 'logs'
$script:StateDir = Join-Path $AppRoot '.local'
$script:PidFile = Join-Path $StateDir 'server.pid'
$script:SchedulerPidFile = Join-Path $StateDir 'scheduler.pid'
$script:MariaDbPidFile = Join-Path $StateDir 'mariadb.pid'
$script:BackupRoot = Join-Path $AppRoot 'backups'
$script:MariaDbBin = 'C:\Program Files\MariaDB 13.0\bin'
$script:MariaDbRoot = [System.IO.Path]::GetFullPath((Join-Path $AppRoot '..\..\.tools\mariadb'))
$script:MariaDbIni = Join-Path $MariaDbRoot 'my.ini'

function Get-MariaDbMysqld {
    $candidate = Join-Path $MariaDbBin 'mysqld.exe'
    if (Test-Path $candidate) {
        return $candidate
    }
    return $null
}

function Test-MariaDbListening {
    param([int]$Port = 3307)
    return @(Get-ListenerPids -Port $Port).Count -gt 0
}

function Start-LocalMariaDb {
    $mysqld = Get-MariaDbMysqld
    if (-not $mysqld) {
        return $false
    }
    if (-not (Test-Path $MariaDbIni)) {
        return $false
    }
    if (Test-MariaDbListening -Port 3307) {
        return $true
    }

    if (-not (Test-Path $StateDir)) {
        New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
    }

    $proc = Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=$MariaDbIni" -WindowStyle Hidden -PassThru
    if (-not $proc) {
        return $false
    }
    Set-Content -Path $MariaDbPidFile -Value $proc.Id -Encoding ASCII

    $deadline = (Get-Date).AddSeconds(20)
    do {
        if (Test-MariaDbListening -Port 3307) {
            return $true
        }
        Start-Sleep -Milliseconds 400
    } while ((Get-Date) -lt $deadline)

    return (Test-MariaDbListening -Port 3307)
}

function Stop-LocalMariaDb {
    $targets = New-Object System.Collections.Generic.List[int]
    if (Test-Path $MariaDbPidFile) {
        $saved = Get-Content $MariaDbPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($saved -match '^\d+$') {
            $targets.Add([int]$saved)
        }
    }

    foreach ($proc in (Get-Process mysqld -ErrorAction SilentlyContinue)) {
        $command = Get-ProcessCommandLine -ProcessId $proc.Id
        if ($command -and $command.ToLower().Contains($MariaDbRoot.ToLower())) {
            $targets.Add($proc.Id)
        }
    }

    foreach ($target in ($targets | Select-Object -Unique)) {
        $alive = Get-Process -Id $target -ErrorAction SilentlyContinue
        if ($alive) {
            & taskkill.exe /PID $target /T /F | Out-Null
        }
    }

    if (Test-Path $MariaDbPidFile) {
        Remove-Item $MariaDbPidFile -Force -ErrorAction SilentlyContinue
    }
}

function Get-DotEnvValue {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    foreach ($line in Get-Content -Path $Path) {
        if ($line -match "^\s*$([regex]::Escape($Name))\s*=\s*(.*)\s*$") {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }

    return $null
}

function Get-AppPort {
    $envFile = Join-Path $LaravelRoot '.env'
    $raw = Get-DotEnvValue -Path $envFile -Name 'APP_PORT'
    if ($raw -match '^\d+$') {
        return [int]$raw
    }
    return 8080
}

function Get-AppUrl {
    param([int]$Port)
    return "http://127.0.0.1:$Port"
}

function Test-PhpVersion {
    param([string]$PhpExe)

    $raw = & $PhpExe -r "echo PHP_VERSION;"
    if ($LASTEXITCODE -ne 0 -or -not $raw) {
        return $false
    }

    $parts = "$raw".Trim().Split('.')
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    return ($major -gt 8) -or ($major -eq 8 -and $minor -ge 2)
}

function Get-PhpExe {
    $candidates = @(
        $env:RTS_PHP,
        (Join-Path $AppRoot '.tools\php\php.exe'),
        [System.IO.Path]::GetFullPath((Join-Path $AppRoot '..\..\.tools\php\php.exe'))
    ) | Where-Object { $_ -and (Test-Path $_) }

    foreach ($candidate in $candidates) {
        if (Test-PhpVersion -PhpExe $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    $pathPhp = Get-Command php -ErrorAction SilentlyContinue
    if ($pathPhp -and (Test-PhpVersion -PhpExe $pathPhp.Source)) {
        return $pathPhp.Source
    }

    return $null
}

function Get-ListenerPids {
    param([int]$Port)

    $pids = New-Object System.Collections.Generic.List[int]
    $pattern = "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$"
    foreach ($line in (netstat -ano -p tcp)) {
        if ($line -match $pattern) {
            $listenerPid = [int]$Matches[1]
            if (-not $pids.Contains($listenerPid)) {
                $pids.Add($listenerPid)
            }
        }
    }
    return $pids
}

function Get-ProcessCommandLine {
    param([int]$ProcessId)

    $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
    if ($proc) {
        return [string]$proc.CommandLine
    }
    return ''
}

function Test-OurServerProcess {
    param([int]$ProcessId)

    $command = Get-ProcessCommandLine -ProcessId $ProcessId
    if (-not $command) {
        return $false
    }

    $normalized = $command.ToLower().Replace('/', '\')
    $laravel = $LaravelRoot.ToLower()
    if (-not $normalized.Contains($laravel)) {
        return $false
    }

    return $normalized.Contains('artisan') -or $normalized.Contains('server.php')
}

function Stop-OurServer {
    $stopped = New-Object System.Collections.Generic.List[int]
    $targets = New-Object System.Collections.Generic.List[int]

    if (Test-Path $PidFile) {
        $saved = Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($saved -match '^\d+$') {
            $targets.Add([int]$saved)
        }
    }

    foreach ($listenerPid in (Get-ListenerPids -Port (Get-AppPort))) {
        if (Test-OurServerProcess -ProcessId $listenerPid) {
            $targets.Add($listenerPid)
        }
    }

    foreach ($target in ($targets | Select-Object -Unique)) {
        $alive = Get-Process -Id $target -ErrorAction SilentlyContinue
        if (-not $alive) {
            continue
        }
        if (-not (Test-OurServerProcess -ProcessId $target)) {
            continue
        }
        & taskkill.exe /PID $target /T /F | Out-Null
        $stopped.Add($target)
    }

    if (Test-Path $PidFile) {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }

    return $stopped
}

function Stop-BillingScheduler {
    if (-not (Test-Path $SchedulerPidFile)) {
        return
    }

    $saved = Get-Content $SchedulerPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($saved -match '^\d+$') {
        $alive = Get-Process -Id ([int]$saved) -ErrorAction SilentlyContinue
        if ($alive) {
            & taskkill.exe /PID $saved /T /F | Out-Null
        }
    }

    Remove-Item $SchedulerPidFile -Force -ErrorAction SilentlyContinue
}

function Find-BrowserExe {
    param([string]$Name)

    $candidates = switch ($Name) {
        'firefox' {
            @(
                "$env:ProgramFiles\Mozilla Firefox\firefox.exe",
                "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe",
                "$env:LOCALAPPDATA\Mozilla Firefox\firefox.exe"
            )
        }
        'chrome' {
            @(
                "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
                "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
                "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
            )
        }
        'edge' {
            @(
                "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
                "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
            )
        }
        'brave' {
            @(
                "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe",
                "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe"
            )
        }
        'opera' {
            @(
                "$env:LOCALAPPDATA\Programs\Opera\opera.exe",
                "$env:LOCALAPPDATA\Programs\Opera GX\opera.exe",
                "$env:ProgramFiles\Opera\opera.exe"
            )
        }
        default { @() }
    }

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) {
            return $candidate
        }
    }

    return $null
}
