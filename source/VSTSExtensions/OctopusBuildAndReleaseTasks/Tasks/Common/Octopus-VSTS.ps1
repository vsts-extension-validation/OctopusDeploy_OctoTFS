# Returns a path to the Octo.exe file
function Get-OctoExePath() {
    return Join-Path $PSScriptRoot "Octo.exe"
}

# Returns the Octo.exe arguments for credentials
function Get-OctoCredentialArgs($serviceDetails) {
	$pwd = $serviceDetails.Auth.Parameters.Password
	if ($pwd.StartsWith("API-")) {
        return "--apiKey=""$pwd"""
    } else {
        $un = $serviceDetails.Auth.Parameters.Username
        return "--user=""$un"" --pass=""$pwd"""
    }
}
