# Navigate to the DumpyServer directory
Set-Location -Path "DumpyServer"

# Print server information
Write-Host "`n=== Backend Server ===" -ForegroundColor Green
Write-Host "HTTP:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "HTTPS: https://localhost:5001" -ForegroundColor Cyan
Write-Host "==================`n" -ForegroundColor Green

# Build and run the C# server
dotnet run 