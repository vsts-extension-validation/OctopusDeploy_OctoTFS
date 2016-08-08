[CmdletBinding()]
param()

Trace-VstsEnteringInvocation $MyInvocation

try {

    . .\Octopus-VSTS.ps1

    $ConnectedServiceName = Get-VstsInput -Name ConnectedServiceName -Require
    $Project = Get-VstsInput -Name Project -Require
    $ReleaseNumber = Get-VstsInput -Name ReleaseNumber -Require
    $Environments = Get-VstsInput -Name Environments -Require
    $ShowProgress = Get-VstsInput -Name ShowProgress -AsBool
    $DeployForTenants = Get-VstsInput -Name DeployForTenants
	$DeployForTenantTags = Get-VstsInput -Name DeployForTenantTags
    $AdditionalArguments = Get-VstsInput -Name AdditionalArguments

    $connectedServiceDetails = Get-VstsEndpoint -Name "$ConnectedServiceName" -Require
    $credentialArgs = Get-OctoCredentialArgs($connectedServiceDetails)
    $octopusUrl = $connectedServiceDetails.Url

    # Call Octo.exe
    $octoPath = Get-OctoExePath
    $Arguments = "deploy-release --project=`"$Project`" --releaseNumber=`"$ReleaseNumber`" --server=$octopusUrl $credentialArgs $AdditionalArguments"
    
    if ($ShowProgress) {
       $Arguments += " --progress"
    }
 
    if ($Environments) {
        ForEach($Environment in $Environments.Split(',').Trim()) {
            $Arguments = $Arguments + " --deployto=`"$Environment`""
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

