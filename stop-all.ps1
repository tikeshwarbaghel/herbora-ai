# Herbora AI - teeno server band karo (ports 8000, 3001, 5173)
foreach ($port in 8000, 3001, 5173) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "Port $port band kiya (process $($c.OwningProcess))"
  }
  if (-not $conns) { Write-Host "Port $port par kuch nahi chal raha" }
}
Write-Host "Ho gaya. Khuli hui PowerShell windows ko khud band kar sakte ho."
