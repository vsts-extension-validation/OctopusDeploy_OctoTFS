$ErrorActionPreference = "Stop"

$environment = $OctopusParameters["Octopus.Environment.Name"]
$version = $OctopusParameters["Octopus.Release.Number"]
$accessToken = $OctopusParameters["AccessToken"]
$shareWith = $OctopusParameters["ShareWith"]
$publish = [System.Convert]::ToBoolean($OctopusParameters["Publish"])
$embeddedOctoVersion = $OctopusParameters["EmbeddedOctoVersion"]

& "$PSScriptRoot\pack.ps1" -environment $environment -version $version -embeddedOctoVersion $embeddedOctoVersion
if ($publish) {
    & "$PSScriptRoot\publish.ps1" -environment $environment -version $version -accessToken $accessToken -shareWith $shareWith
}

$vsixPackages = Get-ChildItem "$PSScriptRoot\dist\Artifacts\$environment\*.vsix"

foreach ($vsix in $vsixPackages) {
    New-OctopusArtifact -Path $vsix
}
