$ErrorActionPreference = "Stop"

$environment = $OctopusParameters["Octopus.Environment.Name"]
$version = $OctopusParameters["Octopus.Release.Number"]
$accessToken = $OctopusParameters["AccessToken"]
$shareWith = $OctopusParameters["ShareWith"]


& "$PSScriptRoot\pack.ps1" -environment $environment -version $version
& "$PSScriptRoot\publish.ps1" -environment $environment -version $version -accessToken $accessToken -shareWith $shareWith

$vsixPackages = Get-ChildItem "$PSScriptRoot\build\Artifacts\$environment\*.vsix"

foreach ($vsix in $vsixPackages) {
    New-OctopusArtifact -Path $vsix    
}
