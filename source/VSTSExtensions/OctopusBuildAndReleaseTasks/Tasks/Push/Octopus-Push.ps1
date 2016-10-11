[CmdletBinding()]
param()

Trace-VstsEnteringInvocation $MyInvocation

try {

    . .\Octopus-VSTS.ps1

    $OctoConnectedServiceName = Get-VstsInput -Name OctoConnectedServiceName
    $ConnectedServiceName = Get-VstsInput -Name ConnectedServiceName
    $Packages = Get-VstsInput -Name Package -Require
    $AdditionalArguments = Get-VstsInput -Name AdditionalArguments
    $Replace = Get-VstsInput -Name Replace -AsBool

    # Get required parameters
	if ([System.String]::IsNullOrWhiteSpace($OctoConnectedServiceName) -and [System.String]::IsNullOrWhiteSpace($ConnectedServiceName)) {
		throw "No Service Endpoint has been specified. You must provide either a Generic or an Octopus Endpoint."
	}
	if (-not [System.String]::IsNullOrWhiteSpace($OctoConnectedServiceName)) {
		$connectedServiceDetails = Get-VstsEndpoint -Name "$OctoConnectedServiceName" -Require
		$credentialParams = Get-OctoCredentialArgsForOctoConnection($connectedServiceDetails)
	} else {
		$connectedServiceDetails = Get-VstsEndpoint -Name "$ConnectedServiceName" -Require
		$credentialParams = Get-OctoCredentialArgs($connectedServiceDetails)
	}
    $octopusUrl = $connectedServiceDetails.Url

    # Call Octo.exe
    $octoPath = Get-OctoExePath
    $Arguments = "push --server=$octopusUrl $credentialParams $AdditionalArguments"

    ForEach($Package in ($Packages.Split("`r`n|`r|`n").Trim())) {
        if (-not [string]::IsNullOrEmpty($Package)) {

            foreach ($file in (Get-Item -Path $Package)){
                $Arguments = $Arguments + " --package=`"$file`""
            }
        }
    }

    if ($Replace) {
        $Arguments = $Arguments + " --replace-existing"
    }

    Invoke-VstsTool -FileName $octoPath -Arguments $Arguments -RequireExitCodeZero

} finally {
    Trace-VstsLeavingInvocation $MyInvocation
}
