Write-Host ""
Write-Host "Building Streaming App..."
Write-Host ""

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!"
    exit 1
}

$destination = "\\192.168.0.28\config\www\streaming"

Write-Host ""
Write-Host "Deploying to Home Assistant..."
Write-Host ""

robocopy `
    ".\dist" `
    $destination `
    /MIR `
    /R:1 `
    /W:1

Write-Host ""
Write-Host "Deployment Complete!"
Write-Host ""
Write-Host "Available at:"
Write-Host "http://192.168.0.28:8123/local/streaming/index.html"