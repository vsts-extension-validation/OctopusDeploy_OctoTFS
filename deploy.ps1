$ErrorActionPreference = "Stop"

$environment = $OctopusParameters["Octopus.Environment.Name"]
$version = $OctopusParameters["Octopus.Release.Number"]
$accessToken = $OctopusParameters["AccessToken"]
$shareWith = $OctopusParameters["ShareWith"]
$publish = [System.Convert]::ToBoolean($OctopusParameters["Publish"])
$embeddedOctoVersion = $OctopusParameters["EmbeddedOctoVersion"]

& npm install -g tfx-cli

& "$PSScriptRoot\embed-octo.ps1" -version $embeddedOctoVersion
& "$PSScriptRoot\pack.ps1" -environment $environment -version $version
if ($publish) {
    & "$PSScriptRoot\publish.ps1" -environment $environment -version $version -accessToken $accessToken -shareWith $shareWith
}

$vsixPackages = Get-ChildItem "$PSScriptRoot\dist\Artifacts\$environment\*.vsix"

foreach ($vsix in $vsixPackages) {
    New-OctopusArtifact -Path $vsix
}
