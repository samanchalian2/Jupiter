param([string]$ConfigPath = "$PSScriptRoot\connector.config")
$ErrorActionPreference='Stop'
function Read-ProtectedConfig {
  if (!(Test-Path -LiteralPath $ConfigPath)) { throw 'Connector configuration is missing.' }
  $secure=(Get-Content -LiteralPath $ConfigPath -Raw | ConvertTo-SecureString)
  $bstr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)|ConvertFrom-Json } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
}
function Save-ProtectedConfig($Config) { ($Config|ConvertTo-Json -Depth 8|ConvertTo-SecureString -AsPlainText -Force|ConvertFrom-SecureString)|Set-Content -LiteralPath $ConfigPath -NoNewline }
function Invoke-Jupiter($Config,[string]$Path,$Body) {
  $headers=@{'Authorization'="Bearer $($Config.deviceToken)";'x-directory-connector-id'=$Config.connectorId;'x-directory-device-id'=$Config.deviceId}
  $result=Invoke-RestMethod -Method Post -Uri "$($Config.jupiterUrl.TrimEnd('/'))/api/v1/directory/agent/$Path" -Headers $headers -ContentType 'application/json' -Body ($Body|ConvertTo-Json -Depth 12)
  $Config.deviceToken=$result.deviceToken; Save-ProtectedConfig $Config; return $result
}
function Get-Entries($Config) {
  Import-Module ActiveDirectory -ErrorAction Stop
  $properties='objectGUID','sAMAccountName','userPrincipalName','mail','displayName','givenName','sn','department','title','telephoneNumber','manager','memberOf','Enabled'
  Get-ADUser -Server $Config.domainController -SearchBase $Config.searchBase -LDAPFilter '(objectClass=user)' -Properties $properties | ForEach-Object {
    $displayName=if([string]::IsNullOrWhiteSpace($_.displayName)){$_.sAMAccountName}else{$_.displayName}
    @{ externalObjectId=$_.ObjectGUID.Guid; accountName=$_.sAMAccountName; email=$_.mail; displayName=$displayName; givenName=$_.givenName; surname=$_.sn; department=$_.department; title=$_.title; telephoneNumber=$_.telephoneNumber; manager=$_.manager; memberOf=@($_.memberOf); enabled=[bool]$_.Enabled; roles=@('REQUESTER') }
  }
}
$config=Read-ProtectedConfig; $lastFull=[datetime]::MinValue
while($true) {
  try {
    $kind=if(((Get-Date)-$lastFull).TotalHours -ge 24){'FULL'}else{'DELTA'}
    $entries=@(Get-Entries $config)
    $preview=Invoke-Jupiter $config 'sync/preview' @{requestId=[guid]::NewGuid().ToString();kind=$kind;scopeFingerprint=$config.scopeFingerprint;connectorVersion='1.0.0';entries=$entries}
    Invoke-Jupiter $config 'sync/apply' @{runId=$preview.runId}|Out-Null
    if($kind -eq 'FULL'){$lastFull=Get-Date}
  } catch { Write-EventLog -LogName Application -Source 'JupiterDirectoryConnector' -EventId 3701 -EntryType Error -Message $_.Exception.Message }
  Start-Sleep -Seconds 900
}
