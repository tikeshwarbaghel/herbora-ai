# Herbora AI - teeno server ek saath chalao (ML service, API server, Frontend)
# Chalane ka tarika: PowerShell me   .\start-all.ps1     (ya start-all.bat par double-click)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Start-Window($title, $cmd) {
  $full = "`$Host.UI.RawUI.WindowTitle = '$title'`n" + $cmd
  $enc = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($full))
  Start-Process powershell -ArgumentList '-NoExit', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $enc
}

$ml = @'
Set-Location 'ROOT\ml-service'
.\venv2\Scripts\Activate.ps1
uvicorn main:app --port 8000
'@.Replace('ROOT', $root)

$api = @'
Set-Location 'ROOT\artifacts\api-server'
Get-Content 'ROOT\.env' | ForEach-Object {
  if ($_ -match '^\s*([^#=\s]+)\s*=\s*(.*)$') { Set-Item "env:$($Matches[1])" $Matches[2].Trim().Trim('"') }
}
$env:PORT = "3001"
pnpm dev
'@.Replace('ROOT', $root)

$web = @'
Set-Location 'ROOT\artifacts\herbora-ai'
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm dev
'@.Replace('ROOT', $root)

Write-Host "ML service (port 8000) shuru ho rahi hai... (pehli baar model load hone me 30-60 second lagte hain)"
Start-Window "Herbora ML service :8000" $ml
Start-Sleep -Seconds 3
Write-Host "API server (port 3001) shuru ho raha hai..."
Start-Window "Herbora API server :3001" $api
Start-Sleep -Seconds 3
Write-Host "Frontend (port 5173) shuru ho raha hai..."
Start-Window "Herbora Frontend :5173" $web

Write-Host ""
Write-Host "Teeno windows khul gayi hain. Thodi der baad browser me kholo: http://localhost:5173"
Write-Host "ML service ready hai ya nahi: http://localhost:8000/health"
Write-Host "Sab band karna ho to: .\stop-all.ps1"
