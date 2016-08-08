# OctoTFS

OctoTFS is a repository containing components for integration with Team Foundation Server and Visual Studio Team Services (VSTS).

> Visual Studio Team Services (VSTS) was formerly known as Visual Studio Online (VSO)

## Team Build Preview Custom Steps

Custom Build Steps for [Team Build vNext](http://aka.ms/tfbuild)

For usage, see the [Build Steps Readme](source/VSTSExtensions).

* [Create Octopus Package](source/VSTSExtensions/OctopusBuildAndReleaseTasks/Tasks/Pack)
* [Push Packages to Octopus](source/VSTSExtensions/OctopusBuildAndReleaseTasks/Tasks/Push)
* [Create Octopus Release](source/VSTSExtensions/OctopusBuildAndReleaseTasks/Tasks/CreateOctopusRelease)
* [Deploy Octopus Release](source/VSTSExtensions/OctopusBuildAndReleaseTasks/Tasks/Deploy)
* [Promote Octopus Release](source/VSTSExtensions/OctopusBuildAndReleaseTasks/Tasks/Promote)

## PowerShell Scripts

PowerShell Scripts that can be used independently or with [Team Build vNext](http://aka.ms/tfbuild). For usage, see the [PowerShell Scripts Readme](source/BuildPowershellScripts).
* [Create Octopus Release](source/BuildPowershellScripts/CreateOctopusRelease.ps1)

## Common Links

- [Marketplace Publishing Portal (octopusdeploy)](https://marketplace.visualstudio.com/manage/publishers/octopusdeploy)

## Production Environment

- [Octopus Extension in Marketplace](https://marketplace.visualstudio.com/items?itemName=octopusdeploy.octopus-deploy-build-release-tasks)
- [Octopus VSTS Environment](https://octopus-deploy.visualstudio.com)
- [Security Tokens](https://octopus-deploy.visualstudio.com/_details/security/tokens)

## Test Environment

- [Octopus Extension in Marketplace](https://marketplace.visualstudio.com/items?itemName=octopusdeploy.octopus-deploy-build-release-tasks-test)
- [Octopus VSTS Environment](https://octopus-deploy-test.visualstudio.com)
- [Security Tokens](https://octopus-deploy-test.visualstudio.com/_details/security/tokens)
