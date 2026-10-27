param(
    [Parameter(Position = 0)]
    [string]$Browser = '',
    [switch]$Build,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Continue'
. (Join-Path $PSScriptRoot 'common.ps1')

$mutex = New-Object System.Threading.Mutex($false, 'RTSERPLocalStart')
$ownsMutex = $false

function Write-Info {
    param([string]$Message)
    Write-Host $Message
}

function Write-Fail {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Test-LaunchedFromExplorer {
    try {
        $current = Get-CimInstance Win32_Process -Filter "ProcessId=$PID"
        $parent = Get-CimInstance Win32_Process -Filter "ProcessId=$($current.ParentProcessId)"
        if ($parent.Name -ne 'cmd.exe') {
            return $false
        }
        $grand = Get-CimInstance Win32_Process -Filter "ProcessId=$($parent.ParentProcessId)"
        return $grand.Name -eq 'explorer.exe'
    } catch {
        return $false
    }
}

function Exit-Script {
    param([int]$Code)

    if ($ownsMutex) {
        $mutex.ReleaseMutex() | Out-Null
        $mutex.Dispose()
    }

    if ($Code -ne 0 -and (Test-LaunchedFromExplorer)) {
        Write-Host ''
        Write-Host 'Press Enter to close this window.'
        [void](Read-Host)
    }

    exit $Code
}

try {
    $ownsMutex = $mutex.WaitOne(120000)
} catch {
    Write-Fail 'Another startup is already in progress.'
    exit 1
}

if (-not $ownsMutex) {
    Write-Fail 'Another startup is still running. Wait for it to finish, then try again.'
    exit 1
}

New-Item -ItemType Directory -Force -Path $LogDir, $StateDir | Out-Null
$startupLog = Join-Path $LogDir 'startup.log'
Start-Transcript -Path $startupLog -Append | Out-Null

try {
    Write-Info 'ResponsivCode ERP local startup'
    Write-Info "Project: $AppRoot"

    $node = Get-Command node -ErrorAction SilentlyContinue
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $node -or -not $npm) {
        Write-Fail 'Node.js and npm are required. Install Node.js 20 or newer, then run start-local.bat again.'
        Exit-Script 1
    }

    $php = Get-PhpExe
    if (-not $php) {
        Write-Fail 'PHP 8.2 or newer was not found.'
        Write-Fail 'XAMPP on this PC provides PHP 8.0, which cannot run this Laravel application.'
        Write-Fail 'Expected PHP at: ..\..\.tools\php\php.exe (next to the RTS folder''s .tools directory).'
        Exit-Script 1
    }

    $phpVersion = (& $php -r "echo PHP_VERSION;").Trim()
    Write-Info "PHP: $phpVersion"
    Write-Info "Node: $((& node -v).Trim())"

    foreach ($extension in @('pdo_sqlite', 'sqlite3', 'openssl', 'mbstring', 'fileinfo', 'tokenizer')) {
        $loaded = & $php -m
        if ($loaded -notcontains $extension) {
            Write-Fail "PHP is missing the $extension extension. Enable it in php.ini and run start-local.bat again."
            Exit-Script 1
        }
    }

    $envFile = Join-Path $LaravelRoot '.env'
    $example = Join-Path $LaravelRoot '.env.example'
    if (-not (Test-Path $envFile)) {
        if (-not (Test-Path $example)) {
            Write-Fail "Missing $example"
            Exit-Script 1
        }
        Copy-Item $example $envFile
        Write-Info 'Created backend\.env from .env.example. Existing environment files are not overwritten.'
    }

    $port = Get-AppPort
    if ($port -lt 1 -or $port -gt 65535) {
        Write-Fail "APP_PORT in backend\.env is not a valid port."
        Exit-Script 1
    }

    $composerPhar = 'C:\ProgramData\ComposerSetup\bin\composer.phar'
    if (-not (Test-Path (Join-Path $LaravelRoot 'vendor\autoload.php'))) {
        if (-not (Test-Path $composerPhar)) {
            Write-Fail 'Composer dependencies are missing and composer.phar was not found.'
            Write-Fail 'Install Composer, then run start-local.bat again.'
            Exit-Script 1
        }
        Write-Info 'Installing PHP dependencies. This needs internet access once.'
        Push-Location $LaravelRoot
        & $php $composerPhar install --no-interaction --prefer-dist
        $composerCode = $LASTEXITCODE
        Pop-Location
        if ($composerCode -ne 0) {
            Write-Fail 'Composer install failed. See the messages above.'
            Exit-Script $composerCode
        }
    }

    $appKey = Get-DotEnvValue -Path $envFile -Name 'APP_KEY'
    if (-not $appKey) {
        Push-Location $LaravelRoot
        & $php artisan key:generate --force --no-interaction
        $keyCode = $LASTEXITCODE
        Pop-Location
        if ($keyCode -ne 0) {
            Write-Fail 'Could not generate APP_KEY.'
            Exit-Script $keyCode
        }
    }

    if (-not (Test-Path (Join-Path $FrontendRoot 'node_modules'))) {
        Write-Info 'Installing frontend dependencies. This needs internet access once.'
        Push-Location $FrontendRoot
        & npm.cmd ci
        $npmCode = $LASTEXITCODE
        Pop-Location
        if ($npmCode -ne 0) {
            Write-Fail 'npm ci failed. See the messages above.'
            Exit-Script $npmCode
        }
    }

    $uiIndex = Join-Path $LaravelRoot 'public\ui\index.html'
    $needsBuild = $Build -or -not (Test-Path $uiIndex)
    if (-not $needsBuild) {
        $builtAt = (Get-Item $uiIndex).LastWriteTimeUtc
        $inputs = @(
            (Join-Path $FrontendRoot 'src'),
            (Join-Path $FrontendRoot 'public'),
            (Join-Path $FrontendRoot 'index.html'),
            (Join-Path $FrontendRoot 'package.json'),
            (Join-Path $FrontendRoot 'vite.config.ts')
        )
        foreach ($inputPath in $inputs) {
            if (-not (Test-Path $inputPath)) {
                continue
            }
            $item = Get-Item $inputPath
            if (-not $item.PSIsContainer) {
                if ($item.LastWriteTimeUtc -gt $builtAt) {
                    $needsBuild = $true
                    break
                }
                continue
            }
            $newer = Get-ChildItem $inputPath -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.LastWriteTimeUtc -gt $builtAt } |
                Select-Object -First 1
            if ($newer) {
                $needsBuild = $true
                break
            }
        }
    }

    if ($needsBuild) {
        Write-Info 'Building the local interface.'
        Push-Location $FrontendRoot
        & npm.cmd run build:local
        $buildCode = $LASTEXITCODE
        Pop-Location
        if ($buildCode -ne 0 -or -not (Test-Path $uiIndex)) {
            Write-Fail 'The interface build failed.'
            Exit-Script $(if ($buildCode -ne 0) { $buildCode } else { 1 })
        }
    }

    $databaseFile = Get-DotEnvValue -Path $envFile -Name 'DB_DATABASE'
    if (-not $databaseFile) {
        $databaseFile = Join-Path $LaravelRoot 'database\database.sqlite'
    }
    $databaseDir = Split-Path -Parent $databaseFile
    if ($databaseDir -and -not (Test-Path $databaseDir)) {
        New-Item -ItemType Directory -Force -Path $databaseDir | Out-Null
    }
    if (-not (Test-Path $databaseFile)) {
        New-Item -ItemType File -Path $databaseFile | Out-Null
        Write-Info "Created local database: $databaseFile"
    }

    Write-Info 'Checking the database.'
    Push-Location $LaravelRoot
    & $php artisan migrate --force --no-interaction
    $migrateCode = $LASTEXITCODE
    if ($migrateCode -eq 0) {
        & $php artisan db:seed --force --no-interaction
        $migrateCode = $LASTEXITCODE
    }
    Pop-Location
    if ($migrateCode -ne 0) {
        Write-Fail 'Database setup failed. See the messages above and backend\storage\logs\laravel.log.'
        Exit-Script $migrateCode
    }

    $storageLink = Join-Path $LaravelRoot 'public\storage'
    if (-not (Test-Path $storageLink)) {
        Push-Location $LaravelRoot
        & $php artisan storage:link --no-interaction
        $linkCode = $LASTEXITCODE
        Pop-Location
        if ($linkCode -ne 0 -or -not (Test-Path $storageLink)) {
            $publicFiles = Join-Path $LaravelRoot 'storage\app\public'
            New-Item -ItemType Directory -Force -Path $publicFiles | Out-Null
            & cmd.exe /c "mklink /J `"$storageLink`" `"$publicFiles`""
            if (-not (Test-Path $storageLink)) {
                Write-Fail 'Could not link uploaded files into the local web folder.'
                Exit-Script 1
            }
        }
    }

    $baseUrl = Get-AppUrl -Port $port
    $healthUrl = "$baseUrl/api/health"
    $listeners = @(Get-ListenerPids -Port $port)
    if ($listeners.Count -gt 0) {
        try {
            $existing = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
            if ($existing.StatusCode -eq 200 -and $existing.Content -match '"database"\s*:\s*"ok"') {
                Write-Info "The application is already running at $baseUrl"
            } else {
                Write-Fail "Port $port is already in use, and it is not a healthy ERP server."
                Write-Fail "Listening process id: $($listeners -join ', ')"
                Write-Fail 'Stop that program or change APP_PORT in backend\.env, then run start-local.bat again.'
                Exit-Script 1
            }
        } catch {
            Write-Fail "Port $port is already in use by process id $($listeners -join ', ')."
            Write-Fail 'Stop that program or change APP_PORT in backend\.env, then run start-local.bat again.'
            Exit-Script 1
        }
    } else {
        $outLog = Join-Path $LogDir 'server.out.log'
        $errLog = Join-Path $LogDir 'server.err.log'
        if (Test-Path $outLog) { Remove-Item $outLog -Force -ErrorAction SilentlyContinue }
        if (Test-Path $errLog) { Remove-Item $errLog -Force -ErrorAction SilentlyContinue }

        Write-Info "Starting the server on 0.0.0.0:$port"
        $artisan = Join-Path $LaravelRoot 'artisan'
        $process = Start-Process `
            -FilePath $php `
            -ArgumentList @($artisan, 'serve', '--host=0.0.0.0', "--port=$port", '--no-reload') `
            -WorkingDirectory $LaravelRoot `
            -WindowStyle Hidden `
            -RedirectStandardOutput $outLog `
            -RedirectStandardError $errLog `
            -PassThru
        Set-Content -Path $PidFile -Value $process.Id -Encoding ASCII

        $healthy = $false
        $loginOk = $false
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            if ($process.HasExited) {
                break
            }
            try {
                $health = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
                if ($health.StatusCode -eq 200 -and $health.Content -match '"database"\s*:\s*"ok"') {
                    $healthy = $true
                    $login = Invoke-WebRequest -Uri "$baseUrl/login" -UseBasicParsing -TimeoutSec 5
                    $loginOk = $login.StatusCode -eq 200 -and $login.Content -match 'id="root"'
                    if ($loginOk) {
                        break
                    }
                }
            } catch {
            }
            Start-Sleep -Milliseconds 500
        }

        if (-not $healthy -or -not $loginOk) {
            Write-Fail 'The server did not become ready.'
            if ($process.HasExited) {
                Write-Fail "The server process exited with code $($process.ExitCode)."
            }
            Write-Fail "Review $outLog and $errLog"
            if (Test-Path $errLog) {
                Write-Host '--- server.err.log ---'
                Get-Content $errLog -Tail 40 | ForEach-Object { Write-Host $_ }
            }
            if (Test-Path $outLog) {
                Write-Host '--- server.out.log ---'
                Get-Content $outLog -Tail 40 | ForEach-Object { Write-Host $_ }
            }
            Exit-Script 1
        }
    }

    $bound = netstat -ano -p tcp | Select-String -Pattern "(127\.0\.0\.1|0\.0\.0\.0):$port\s+\S+\s+LISTENING"
    if (-not $bound) {
        Write-Fail "The server is not listening on port $port."
        Exit-Script 1
    }

    Write-Info ''
    Write-Info "Ready: $baseUrl/login"
    Write-Info 'The server keeps running after you close the browser.'
    Write-Info 'Stop it with stop-local.bat.'

    $schedulerAlive = $false
    if (Test-Path $SchedulerPidFile) {
        $savedScheduler = Get-Content $SchedulerPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($savedScheduler -match '^\d+$') {
            $schedulerAlive = $null -ne (Get-Process -Id ([int]$savedScheduler) -ErrorAction SilentlyContinue)
        }
    }
    if (-not $schedulerAlive) {
        $schedulerOut = Join-Path $LogDir 'scheduler.out.log'
        $schedulerErr = Join-Path $LogDir 'scheduler.err.log'
        $artisan = Join-Path $LaravelRoot 'artisan'
        $scheduler = Start-Process `
            -FilePath $php `
            -ArgumentList @($artisan, 'schedule:work') `
            -WorkingDirectory $LaravelRoot `
            -WindowStyle Hidden `
            -RedirectStandardOutput $schedulerOut `
            -RedirectStandardError $schedulerErr `
            -PassThru
        Set-Content -Path $SchedulerPidFile -Value $scheduler.Id -Encoding ASCII
        Write-Info 'Scheduled billing check is running.'
    }

    if ($NoBrowser -or $Browser -eq 'none') {
        Exit-Script 0
    }

    $choice = $Browser.ToLower()
    if (-not $choice) {
        Write-Info ''
        Write-Info 'Open the application in:'
        Write-Info '  1  Google Chrome'
        Write-Info '  2  Microsoft Edge'
        Write-Info '  3  Mozilla Firefox'
        Write-Info '  4  Brave'
        Write-Info '  5  Opera'
        Write-Info '  6  Default browser'
        Write-Info '  7  Do not open a browser'
        $selected = Read-Host 'Choose 1-7'
        $choice = switch ($selected) {
            '2' { 'edge' }
            '3' { 'firefox' }
            '4' { 'brave' }
            '5' { 'opera' }
            '6' { 'default' }
            '7' { 'none' }
            default { 'chrome' }
        }
    }

    if ($choice -eq 'none') {
        Exit-Script 0
    }

    $url = "$baseUrl/login"
    if ($choice -eq 'default') {
        Start-Process $url
        Write-Info "Opened $url in the default browser."
        Exit-Script 0
    }

    $exe = Find-BrowserExe -Name $choice
    if (-not $exe) {
        Write-Fail "$choice is not installed. The application is still running at $url"
        Write-Fail 'Install that browser, or run start-local.bat chrome, start-local.bat edge, or start-local.bat default.'
        Exit-Script 0
    }

    Start-Process -FilePath $exe -ArgumentList $url
    Write-Info "Opened $url in $choice."
    Exit-Script 0
} catch {
    Write-Fail $_.Exception.Message
    Exit-Script 1
} finally {
    try { Stop-Transcript | Out-Null } catch { }
}
