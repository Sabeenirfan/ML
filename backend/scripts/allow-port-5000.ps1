# Allow inbound TCP on port 5000 so the frontend/Expo can reach the backend.
# Run PowerShell as Administrator, then: .\scripts\allow-port-5000.ps1

$ruleName = "MealVista Backend (Port 5000)"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Firewall rule '$ruleName' already exists."
  exit 0
}
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
Write-Host "Added firewall rule. Backend should now be reachable on port 5000."
