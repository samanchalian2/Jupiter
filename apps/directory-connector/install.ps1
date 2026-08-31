param([Parameter(Mandatory)][string]$JupiterUrl,[Parameter(Mandatory)][string]$ConnectorId,[Parameter(Mandatory)][string]$DeviceId,[Parameter(Mandatory)][string]$DeviceToken,[Parameter(Mandatory)][string]$DomainController,[Parameter(Mandatory)][string]$SearchBase,[switch]$Repair)
$ErrorActionPreference='Stop'; $root=Split-Path -Parent $PSCommandPath; $config=Join-Path $root 'connector.config'
if(-not [Diagnostics.EventLog]::SourceExists('JupiterDirectoryConnector')){New-EventLog -LogName Application -Source 'JupiterDirectoryConnector'}
@{jupiterUrl=$JupiterUrl;connectorId=$ConnectorId;deviceId=$DeviceId;deviceToken=$DeviceToken;domainController=$DomainController;searchBase=$SearchBase;scopeFingerprint=([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($SearchBase))|ForEach-Object ToString x2)-join''}|ConvertTo-Json|ConvertTo-SecureString -AsPlainText -Force|ConvertFrom-SecureString|Set-Content -LiteralPath $config -NoNewline
$winsw=Join-Path $root 'winsw.exe'; if(!(Test-Path $winsw)){throw 'Place the signed WinSW binary at winsw.exe before installation.'}
& $winsw install; & $winsw start
