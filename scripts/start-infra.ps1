# Postgres + Redis ni yoqish (Docker Desktop "Running" bo'lgach ishga tushiring)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/start-infra.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> Docker engine tekshiruvi..."
docker version --format '{{.Server.Version}}' | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "XATO: Docker Desktop ishlamayapti. Avval Docker Desktop ni oching va 'Engine running' bo'lguncha kuting."
  exit 1
}

Write-Host "==> docker compose up -d"
docker compose up -d

Write-Host "==> .env da DATABASE_URL / REDIS_URL"
$envFile = Join-Path $root "server\.env"
$txt = Get-Content $envFile -Raw
if ($txt -notmatch '(?m)^DATABASE_URL=') {
  $txt = $txt -replace '(?m)^#\s*DATABASE_URL=.*$', 'DATABASE_URL=postgres://kelajak:kelajak@localhost:5432/kelajak'
  $txt = $txt -replace '(?m)^#\s*REDIS_URL=.*$', 'REDIS_URL=redis://localhost:6379'
  if ($txt -notmatch 'DATABASE_URL=postgres') {
    $txt += "`nDATABASE_URL=postgres://kelajak:kelajak@localhost:5432/kelajak`nREDIS_URL=redis://localhost:6379`n"
  }
  Set-Content -Path $envFile -Value $txt -NoNewline
}

Write-Host "==> Postgres healthy kutish..."
for ($i = 1; $i -le 30; $i++) {
  $h = docker compose ps --format json 2>$null
  $ok = docker compose exec -T postgres pg_isready -U kelajak -d kelajak 2>$null
  if ($LASTEXITCODE -eq 0) { Write-Host "Postgres OK"; break }
  Start-Sleep -Seconds 2
}

Write-Host "==> Seed + API restart"
Set-Location (Join-Path $root "server")
npm run seed
Write-Host "Tayyor. Endi: npm run start  (yoki loyihada API ni qayta ishga tushiring)"
Write-Host "Tekshiruv: Invoke-RestMethod http://localhost:3001/api/health"
