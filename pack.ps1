param (
    [Parameter(Mandatory=$true,HelpMessage="LocalTest, Test or Production")]
    [ValidateSet("LocalTest", "Test", "Production")]
    [string]
    $environment,
    [Parameter(Mandatory=$true,HelpMessage="The three number version for this release")]
    [string]
    $version,
    [Parameter(Mandatory=$false,HelpMessage="Set this to true if you need fresh task IDs for testing")]
    [boolean]
    $newTaskId
)

$ErrorActionPreference = "Stop"

$sourcePath = "$PSScriptRoot/source" 
$extensionsDirectoryPath = Join-Path $sourcePath "VSTSExtensions"
$buildDirectoryPath = "$PSScriptRoot/build"
$buildArtifactsPath = "$buildDirectoryPath/Artifacts"
$buildTempPath = "$buildDirectoryPath/Temp"
$tasksTempPath = Join-Path -Path $buildTempPath -ChildPath "VSTSExtensions" | Join-Path -ChildPath "OctopusBuildAndReleaseTasks" | Join-Path -ChildPath "Tasks"

function UpdateTfxCli() {
    Write-Host "Updating tfx-cli..."
    & npm up -g tfx-cli
}

function InstallNodeModules() {
   Push-Location -Path "$sourcePath" 
   & npm install
   Pop-Location
}

function PrepareBuildDirectory() {
    if (Test-Path $buildDirectoryPath) {
        $buildDirectory = Get-Item "$buildDirectoryPath"
        Write-Host "Cleaning $buildDirectory..."
        Remove-Item $buildDirectory -Force -Recurse
    }
    
    New-Item -Type Directory -Path $buildTempPath | Out-Null
    Copy-Item $extensionsDirectoryPath -Destination $buildTempPath -Recurse
}


function CopyCommonTaskItems() {
   Write-Host "Copying common task components into each task"
   # for each task
   ForEach($TaskPath in Get-ChildItem -Path $tasksTempPath -Exclude "Common") {

      # Copy VSTS PowerShell Modules from node_modules to each task's ps_modules directory
      $VstsSdkModuleNpmPath = Join-Path -Path $sourcePath -ChildPath "node_modules" | Join-Path -ChildPath "vsts-task-sdk" | Join-Path -ChildPath "VstsTaskSdk"
      $PSModulesPath = Join-Path $TaskPath "ps_modules"
      $VstsSdkModulePath = Join-Path $PSModulesPath "VstsTaskSdk"
      New-Item -Type Directory -Path $PSModulesPath -Force | Out-Null
      Copy-Item -Path $VstsSdkModuleNpmPath -Destination $VstsSdkModulePath -Recurse -Force

      #Copy common task items into each task 
      ForEach($CommonFile in Get-ChildItem -Path (Join-Path $tasksTempPath "Common") -File) {
         Copy-Item -Path $CommonFile.FullName -Destination $TaskPath | Out-Null 
      }
   }
}

function UpdateExtensionManifestOverrideFile($extensionBuildTempPath, $environment, $version) {
    Write-Host "Finding environment-specific manifest overrides..."
    $overridesSourceFilePath = "$extensionBuildTempPath/extension-manifest.$environment.json"
    $overridesSourceFile = Get-ChildItem -Path $overridesSourceFilePath
    if ($overridesSourceFile -eq $null) {
        Write-Error "Could not find the extension-manifest override file: $overridesSourceFilePath"
        return $null
    }

    Write-Host "Using $overridesSourceFile for overriding the standard extension-manifest.json, updating version to $version..."
    $manifest = ConvertFrom-JSON -InputObject (Get-Content $overridesSourceFile -Raw)
    $manifest.version = $version

    $overridesFilePath = "$extensionBuildTempPath/extension-manifest.$environment.$version.json"
    ConvertTo-JSON $manifest -Depth 6 | Out-File $overridesFilePath -Encoding ASCII # tfx-cli doesn't support UTF8 with BOM
    Get-Content $overridesFilePath | Write-Host
    return Get-Item $overridesFilePath
}

function UpdateTaskManifests($extensionBuildTempPath, $version, $generateNewTaskId) {
    $taskManifestFiles = Get-ChildItem $extensionBuildTempPath -Include "task.json" -Recurse
    foreach ($taskManifestFile in $taskManifestFiles) {
        Write-Host "Updating version to $version in $taskManifestFile..."
        $task = ConvertFrom-JSON -InputObject (Get-Content $taskManifestFile -Raw)
        $netVersion = [System.Version]::Parse($version)
        $task.version.Major = $netVersion.Major
        $task.version.Minor = $netVersion.Minor
        $task.version.Patch = $netVersion.Build
        
        $task.helpMarkDown = "Version: $version. [More Information](http://docs.octopusdeploy.com/display/OD/Use+the+Team+Foundation+Build+Custom+Task)"
        
        ConvertTo-JSON $task -Depth 6 | Out-File $taskManifestFile -Encoding UTF8
    }

    if ($generateNewTaskId) {
        Write-Host "Creating new Guids for the tasks"
        UpdateWithNewTaskGuids $extensionBuildTempPath
    }
}

function UpdateWithNewTaskGuids($extensionBuildTempPath) {
    $taskManifestFiles = Get-ChildItem $extensionBuildTempPath -Include "task.json" -Recurse
    foreach ($taskManifestFile in $taskManifestFiles) {
        Write-Host "Updating version to $version in $taskManifestFile..."
        $task = ConvertFrom-JSON -InputObject (Get-Content $taskManifestFile -Raw)
        
        $task.id = [System.Guid]::NewGuid()
        
        ConvertTo-JSON $task -Depth 6 | Out-File $taskManifestFile -Encoding UTF8
    }
}

function OverrideExtensionLogo($extensionBuildTempPath, $environment) {
    $extensionLogoOverrideFile = Get-Item "$extensionBuildTempPath/extension-icon.$environment.png" -ErrorAction SilentlyContinue
    if ($extensionLogoOverrideFile) {
        $directory = Split-Path $extensionLogoOverrideFile
        $target = Join-Path $directory "extension-icon.png"
        Write-Host "Replacing extension logo with $extensionLogoOverrideFile..."
        Move-Item $extensionLogoOverrideFile $target -Force
    }
    
    Remove-Item "$extensionBuildTempPath/extension-icon.*.png" -Force
}

function OverrideTaskLogos($extensionBuildTempPath, $environment) {
    $taskLogoOverrideFiles = Get-ChildItem $extensionBuildTempPath -Include "icon.$environment.png" -Recurse
    foreach ($logoOverrideFile in $taskLogoOverrideFiles) {
        $directory = Split-Path $logoOverrideFile
        $target = Join-Path $directory "icon.png"
        Write-Host "Replacing task logo $target with $logoOverrideFile..."
        Move-Item $logoOverrideFile $target -Force
    }
    
    Get-ChildItem $extensionBuildTempPath -Include "icon.*.png" -Recurse | Remove-Item -Force
}

function Pack($extensionName, $newTaskId) {
    Write-Host "Packing $extensionName..."
    $extensionBuildTempPath = Get-ChildItem $buildTempPath -Include $extensionName -Recurse
    Write-Host "Found extension working directory $extensionBuildTempPath"
    
    $overridesFile = UpdateExtensionManifestOverrideFile $extensionBuildTempPath $environment $version
    OverrideExtensionLogo $extensionBuildTempPath $environment
    
    UpdateTaskManifests $extensionBuildTempPath $version $newTaskId
    OverrideTaskLogos $extensionBuildTempPath $environment
    
    Write-Host "Creating VSIX using tfx..."
    & tfx extension create --root $extensionBuildTempPath --manifest-globs extension-manifest.json --overridesFile $overridesFile --outputPath "$buildArtifactsPath/$environment" --no-prompt
}

UpdateTfxCli
InstallNodeModules
PrepareBuildDirectory
CopyCommonTaskItems
Pack "VSTSExtensions" $newTaskId
