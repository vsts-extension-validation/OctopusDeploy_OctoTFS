This extension provides Build and Release tasks to integrate with [Octopus Deploy](http://octopus.com), as well as a dashboard widget to show the status of a deployment in Octopus.

[Octopus Deploy](https://octopus.com) is great for deploying ASP.NET or .NET Core applications running on IIS or Azure, Windows services, SQL databases, and much, much more.

<div style="border:1px solid #888;background-color: #ffc;color:#444;padding:5px;">Note: This extension is only compatible with Azure DevOps, Team Foundation Server (TFS) 2017 Update 1 and above, and Visual Studio Team Services (VSTS).<br/><br/>There is an alternative extension compatible with TFS 2015 Update 2 and above. See <a href="https://g.octopushq.com/TFS-VSTS-compat">the Octopus Documentation</a> for extension compatibility details and a download link.
</div>

## Requirements

You will need a minimum build agent version of `2.115.0` with .NET Core SDK `2.0` or later. When targeting build agents without the SDK, you can use the **.NET Core SDK Installer** task to install it. Generally the Hosted Linux, Mac and Hosted VS2017 agent queues already provide it, however please refer to Microsoft documentation regarding what capabilities are provided by which hosted agent pools.

The Octopus tasks will automatically download, cache, and use the latest version of the Octopus tools, unless they are supplied using the **Octopus tools installer** task, or found using the `PATH` environment variable.

If the **Octopus tools installer** task version is set to `embedded`, it will supply an embedded copy of the tools instead of downloading.

## Add a service connection to Octopus Deploy

Before adding any Build or Release tasks to your process, configure an "Octopus Deploy" service connection in the **Project Settings** under **Service connections**.

You'll need an API Key for a user that has sufficient permissions for the tasks you want to perform in your build and release process.
For example, if your build needs to create a Release for Project A, the user who owns that API key will need ReleaseCreate role either unscoped or scoped to Project A.

![Service Connection](img/service-connection.png)

<hr />

## Tasks and Widgets

This extension adds the following tasks:

- Octopus tools installer
- Package Application for Octopus
- Push Packages to Octopus
- Push Package Metadata to Octopus
- Create Octopus Release
- Deploy Octopus Release
- Promote Octopus Release

And the following widget:

- Octopus Deploy Status

<hr />

## <a name="tools-installer"></a>![Installer Icon](img/octopus_installer.png) Octopus tools installer

Optional. Use this task to download a specific version of the Octopus tools, or to use the version embedded in the extension. Otherwise, the other tasks will find tools using the `PATH` environment variable, or automatically download, cache, and use the latest version.

 Options include:

 * **Octopus Tool Version**: The version to download, or `embedded` to use the tools embedded in the extension, or `latest` to download the most recent version.

## <a name="package-application"></a>![Package Icon](img/octopus_package-03.png) Package Application for Octopus

*Note: You can still use [OctoPack](http://docs.octopusdeploy.com/display/OD/Using+OctoPack) as part of your MSBuild task to package and push Nuget packages to Octopus when targeting full .NET framework projects.*

![Configure Package Application Step](img/create-package-options.png)

Options include:

 * **Package ID**: The ID of the package. e.g. MyCompany.App
 * **Package Format**: NuPkg or Zip.
 * **Package Version**: The version of the package; must be a valid [SemVer](http://semver.org/) version; defaults to a timestamp-based version.
 * **Source Path**: The folder containing the files and folders to package. Defaults to working directory.
 * **Output Path**: The directory into which the generated package will be written. Defaults to working directory.
 * **NuGet** section: Additional details for the NuGet Package Metadata.
 * **Advanced Options** section: Additional files to include in the package, whether to overwrite any existing file of the same name, and other options.

## <a name="push-packages-to-octopus"></a>![Push Package Icon](img/octopus_push-01.png) Push Packages to Octopus

 ![Configure Push Application Step](img/push-packages-options.png)

 Options include:

 * **Octopus Deploy Server**: The Octopus Server (click **New** to [add a service connection](#Add-a-service-connection-to-Octopus-Deploy)).
 * **Space**: The Octopus space to push a package to.
 * **Package**: Package file to push. To push multiple packages, enter multiple lines.
 * **Replace Existing**: If the package already exists in the repository, the default behavior is to reject the new package being pushed. Set this flag to **True** to overwrite the existing package.
 * **Additional Arguments**: Any additional [Octo.exe arguments](http://docs.octopusdeploy.com/display/OD/Pushing+packages) to include.

## <a name="push-package-metadata-to-octopus"></a>![Push Package Icon](img/octopus_push-01.png) Push Package Metadata to Octopus

 ![Configure Push Package Metadata Step](img/push-metadata-options.png)

 Options include:

 * **Octopus Deploy Server**: The Octopus Server (click **New** to [add a service connection](#Add-a-service-connection-to-Octopus-Deploy)).
 * **Space**: The Octopus space to push package metadata to.
 * **Package ID**: The ID of the package, pushed previously, to push metadata onto. e.g. MyCompany.App
 * **Package Version**: The version of the package, pushed previously, to push metadata onto.
 * **Work Items Source**: The service hosting any work items associated with each version of the package. Octopus will add information about the work items to the package metadata, which can be used in release notes.
 * **Replace Existing**: If the package metadata already exists in the repository, the default behavior is to reject the new metadata being pushed. Set this flag to 'True' to overwrite the existing package metadata.
 * **Additional Arguments**: Any additional [Octo.exe arguments](https://octopus.com/docs/octopus-rest-api/octo.exe-command-line/push-metadata) to include.

## <a name="create-octopus-release"></a>![Create Release Icon](img/octopus_create-release-04.png) Create Octopus Release

 ![Configure Create Release Step](img/create-release-options.png)

 Options include:

 * **Octopus Deploy Server**: The Octopus Server (click **New** to [add a service connection](#Add-a-service-connection-to-Octopus-Deploy)).
 * **Space**: The Octopus space to create a release in.
 * **Project**: The Octopus project to create a release for.
 * **Release Number**: Release number for the new release (leave blank to let Octopus decide).
 * **Channel**: Channel to use for the new release.
 * **Include Changeset Comments**:  Whether to include changeset/commit comments in the Octopus release notes.
 * **Include Work Items**:  Whether to include linked work item titles in the Octopus release notes.
 * **Custom Notes**: Any additional static release notes to be included in the Octopus release.
 * **To Environment**:  Optional environment to deploy to after release creation.
 * **Show Deployment Progress**: Whether to wait for the operation to finish, recording output in the log, and only succeeding if the operation finished successfully.
 * **Tenant(s)**: Comma-separated list of Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Tenant tag(s)**: Comma-separated list of Tenant tags matching Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Additional Octo.exe Arguments**:  Any additional [Octo.exe arguments](http://docs.octopusdeploy.com/display/OD/Creating+releases) to include.

### Regarding Release Notes

The *Release Notes* options, if selected, will result in nicely formatted release notes with deep links to Team Foundation Server or Visual Studio Team Services. Even if no additional options are selected, the related VSTS Build number will be included in the Octopus release notes.

![Release Notes in Octopus Deploy Release](img/tfsbuild-releasenotes.png)

### <a name="deploy-octopus-release"></a>![Deploy Release Image](img/octopus_deploy-02.png) Deploy Octopus Release

 ![Configure Deploy Release Step](img/deploy-release-options.png)

 Options include:

 * **Octopus Deploy Server**: The Octopus Server (click **New** to [add a service connection](#Add-a-service-connection-to-Octopus-Deploy)).
 * **Space**: The Octopus space the release is in.
 * **Project**: The Octopus project to deploy.
 * **Release Number**: Release number for the new release (defaults to `latest`).
 * **Deploy to Environments**: Comma-separated list of environments to deploy to.
 * **Show Deployment Progress**: Whether to wait for the deployment to finish, recording output in the log, and only succeeding if the deployment finished successfully.
 * **Tenant(s)**: Comma-separated list of Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Tenant tag(s)**: Comma-separated list of Tenant tags matching Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Additional Arguments**:  Any additional [Octo.exe arguments](https://octopus.com/docs/octopus-rest-api/octo.exe-command-line/deploy-release) to include.

### <a name="promote-octopus-release"></a>![Promote Release Image](img/octopus_promote-05.png) Promote Octopus Release

![Configure Promote Release Step](img/promote-release-options.png)

Options include:
 * **Octopus Deploy Server**: The Octopus Server (click **New** to [add a service connection](#Add-a-service-connection-to-Octopus-Deploy)).
 * **Space**: The Octopus space the release is in.
 * **Project**: The Octopus project to deploy.
 * **Promote From**: The environment to promote a deployment from.
 * **Promote To**: The environment to promote a deployment to.
 * **Show Deployment Progress**: Whether to wait for the deployment to finish, recording output in the log, and only succeeding if the deployment finished successfully.
 * **Tenant(s)**: Comma-separated list of Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Tenant tag(s)**: Comma-separated list of Tenant tags matching Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Additional Arguments**:  Any additional [Octo.exe arguments](https://octopus.com/docs/octopus-rest-api/octo.exe-command-line/promote-release) to include.

<hr/>

### <a name="octopus-status-widget"></a>![Octopus Deploy Status Widget](img/widget-icon.jpg) Octopus Deploy Status Widget

![Multiple Widgets on Dashboard](img/multiple-widget-preview.jpg)

Configuration settings:
 * **Size**: Either a 1x1 or a 2x1 widget size.
 * **Octopus Connection**: The Octopus Server (click **New** to [add a service connection](#Add-a-service-connection-to-Octopus-Deploy)).
 * **Octopus Project**: The Octopus project.
 * **Environment**: The Octopus environment. Note that you may select any environment, but the widget will only be populated if there is a deployment of that project to that environment.

 **Note:** Clicking on the widget will open the deployment log for the displayed task in Octopus.
