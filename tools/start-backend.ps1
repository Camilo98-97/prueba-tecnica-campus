param(
    [string]$Server = 'localhost',
    [int]$Port = 3306,
    [string]$User = 'root'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$localDotnet = Join-Path $projectRoot '.dotnet\dotnet.exe'
$dotnet = if (Test-Path $localDotnet) { $localDotnet } else { 'dotnet' }
$secret = Read-Host "Contraseña MySQL para $User (no se guardará en archivos)" -AsSecureString
$credential = [System.Net.NetworkCredential]::new('', $secret)
$connection = [System.Data.Common.DbConnectionStringBuilder]::new()
$connection['Server'] = $Server
$connection['Port'] = $Port
$connection['Database'] = 'CampusStudents'
$connection['User ID'] = $User
$connection['Password'] = $credential.Password
$connection['SslMode'] = 'Preferred'
$previousConnection = $env:ConnectionStrings__School
try {
    $env:ConnectionStrings__School = $connection.ConnectionString
    & $dotnet run --project (Join-Path $projectRoot 'backend\Students.Api')
} finally {
    $env:ConnectionStrings__School = $previousConnection
    $connection.Clear()
    $credential.Password = ''
    $secret.Dispose()
}
