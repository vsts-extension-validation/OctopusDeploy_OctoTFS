[CmdletBinding()]
param()

Trace-VstsEnteringInvocation $MyInvocation

try {

    . .\Octopus-VSTS.ps1

    $ConnectedServiceName = Get-VstsInput -Name ConnectedServiceName -Require
    $Project = Get-VstsInput -Name Project -Require
    $From = Get-VstsInput -Name From -Require
    $To = Get-VstsInput -Name To -Require
    $ShowProgress = Get-VstsInput -Name ShowProgress -AsBool
    $DeployForTenants = Get-VstsInput -Name DeployForTenants
	$DeployForTenantTags = Get-VstsInput -Name DeployForTenantTags
    $AdditionalArguments = Get-VstsInput -Name AdditionalArguments

    $connectedServiceDetails = Get-VstsEndpoint -Name "$ConnectedServiceName" -Require
    $credentialArgs = Get-OctoCredentialArgs($connectedServiceDetails)
    $octopusUrl = $connectedServiceDetails.Url

    # Call Octo.exe
    $octoPath = Get-OctoExePath
    $Arguments = "promote-release --project=`"$Project`" --from=`"$From`" --server=$octopusUrl $credentialArgs $AdditionalArguments"
    
    if ($ShowProgress) {
       $Arguments += " --progress"
    }
    
    if ($To) {
        ForEach($Environment in $To.Split(',').Trim()) {
            $Arguments = $Arguments + " --to=`"$Environment`""
        }
    }

    # optional deployment tenants & tags
	if (-not [System.String]::IsNullOrWhiteSpace($DeployForTenants)) {
        ForEach($Tenant in $DeployForTenants.Split(',').Trim()) {
            $Arguments = $Arguments + " --tenant=`"$Tenant`""
        }
	}

	if (-not [System.String]::IsNullOrWhiteSpace($DeployForTenantTags)) {
        ForEach($Tenant in $DeployForTenantTags.Split(',').Trim()) {
            $Arguments = $Arguments + " --tenanttag=`"$Tenant`""
		}
	}
    
    Invoke-VstsTool -FileName $octoPath -Arguments $Arguments -RequireExitCodeZero

} finally {
    Trace-VstsLeavingInvocation $MyInvocation
}
