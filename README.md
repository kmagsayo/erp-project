# ResponsivCode ERP

Local ERP for quotations, purchasing, inventory, delivery, billing, and accomplishment reports. The application runs on this Windows PC. Accounts, setup records, and uploaded files stay on the laptop.

## Start

Double-click `start-local.bat` in this folder, or run it from a terminal:

```bat
start-local.bat
```

The window asks which browser to open. You can also choose one directly:

```bat
start-local.bat chrome
start-local.bat edge
start-local.bat firefox
start-local.bat brave
start-local.bat opera
start-local.bat default
```

When the server is ready, open:

**http://127.0.0.1:8080/login**

Closing the browser does not stop the server. Run `start-local.bat` again to open another browser without starting a second server.

The first launch installs dependencies and builds the interface. Later launches reuse that build unless the program files changed. Force a rebuild with:

```bat
start-local.bat -Build
```

## Sign in

Accounts come from the imported RTS database. Sign in with a username from that file, such as `admin`, `skip`, `lark`, `cyrus`, or `nino`. The password is the one stored for that username in the SQL file. The temporary `admin123` password is no longer used.

## Stop and restart

```bat
stop-local.bat
start-local.bat
```

`stop-local.bat` stops only this ERP server. It does not stop XAMPP, MySQL, or other PHP programs.

## Required software

- Windows 10 or 11
- Node.js 20 or newer (Node.js 24 is installed on this PC)
- PHP 8.3, included for this app at `.tools\php` in the RTS folder
- Composer, used only when PHP libraries are missing

XAMPP’s PHP 8.0 remains installed and is not used by this application. Laravel 11 cannot run on PHP 8.0. Docker is not required.

A current Google Chrome or Microsoft Edge is enough to use the system. Firefox, Brave, and Opera work with the same address when they are installed. Firefox is not currently installed on this PC.

## Where data is stored

| Data | Location |
| --- | --- |
| Database | `laravel\database\database.sqlite` |
| Uploaded files | `laravel\storage\app\public` |
| Application log | `laravel\storage\logs\laravel.log` |
| Startup and server logs | `logs\startup.log`, `logs\server.out.log`, `logs\server.err.log` |
| Backups | `backups\` |

Quotations, purchase orders, receiving records, outslips, gate passes, delivery receipts, billing records, and accomplishment reports are stored in the browser on this computer. They stay available after a restart in the same browser at `http://127.0.0.1:8080`. They are not copied into the database, and they are separate for Chrome, Edge, and Firefox. Use one browser for day-to-day work.

`http://localhost:8080` can open the same server, but the browser treats it as a different site from `127.0.0.1`. Stay with `http://127.0.0.1:8080`.

## Back up and restore

Stop the application before restoring. Backups do not replace the live database until you restore one.

```bat
backup-local.bat
stop-local.bat
restore-local.bat backups\yyyyMMdd-HHmmss
start-local.bat
```

The restore command asks you to type `RESTORE`. Each backup contains the SQLite database, uploaded files, and a copy of the local environment file.

## Change the port

1. Stop the application with `stop-local.bat`.
2. Edit `APP_PORT` and `APP_URL` together in `laravel\.env`.
3. Start the application again.

Example:

```
APP_PORT=8090
APP_URL=http://127.0.0.1:8090
```

If the chosen port is already used by another program, startup stops and names that program’s process id. It does not close the other program.

## Connection problems

`Unable to connect` means nothing is listening at that address. This project previously had no fixed port and no launcher, so a browser could keep an address such as `127.0.0.1:45173` after the development server had already exited. Use `start-local.bat` and the address it prints.

If startup fails:

1. Read the last lines in `logs\startup.log` and `logs\server.err.log`.
2. Run `stop-local.bat`, then `start-local.bat` again.
3. Confirm no second copy is running. The launcher reuses a healthy server instead of starting another one.

## Internet

Normal use does not contact a cloud host, remote database, or AI service. Sign-in, setup records, documents, and file uploads work without internet after the first installation.

Internet is needed only to install missing Node.js or PHP libraries. There is no email delivery, payment provider, analytics service, or cloud file store. Mail is written to the local log. Company logos are saved on this PC.

XAMPP MySQL is running on this computer, but this ERP does not use it. There was no `rts_system` database to copy. The MySQL service was left unchanged.

## For development

The local launcher serves a built interface and the Laravel API on one port. To work on the React screens with live reload, start the local server first, then in this folder run:

```bat
npm run dev
```

That development screen is `http://127.0.0.1:5173` and forwards API calls to port 8080. Port 5173 does not move if it is busy; free it or close the other program.

Automated checks:

```bat
cd laravel
C:\Users\Kristian\Documents\RTS\.tools\php\php.exe artisan test
cd ..
npx playwright test
```

Playwright downloads Firefox and WebKit the first time. Chrome and Edge use the browsers installed on this PC.

## Workflow

Quotation, purchase order, receiving, inventory, outslip, delivery receipt, billing, statement of account, accomplishment report.

## Known limits

- Firefox, Brave, and Opera are not installed on this PC, so they cannot be opened until you install them. The same local site is what they will open.
- Browser-stored documents do not transfer from one browser to another.
- The server is available only on this computer. It listens on `127.0.0.1`.
- PHP’s local server is meant for one person using the application on this laptop.
