This extension provides Build and Release tasks to integrate with [Octopus Deploy](http://octopus.com), as well as a dashboard widget to show the status of a deployment in Octopus.

[Octopus Deploy](https://octopus.com) is great for deploying ASP.NET or .NET Core applications running on IIS or Azure, Windows services, SQL databases, and much, much more.

<div style="border:1px solid #888;background-color: #ffc;color:#444;padding:5px;">Note: This extension is only compatible with Visual Studio Team Services (VSTS) and Team Foundation Server (TFS) 2017 Update 1 and above.<br/>There is an alternative extension compatible with TFS 2015 Update 2 and above.<br/>See <a href="https://octopus.com/docs/guides/use-the-team-foundation-build-custom-task/extension-compatibility">the Octopus Documentation</a> for extension compatibility details and a download link for the alternative extension.
</div>

## Requirements
For build agents being targeted, the dotnet core runtime 2.0 or later with a version of the portable `Octo` command line tools need to be available on the path. Alternatively the corresponding installer tasks may be used to
satisfy this condition such as the `use specific octo version` task.

### VSTS Build Agents
Generally the Hosted Linux and Hosted VS2017 agent queues would satisfy the dotnet core requirements, however to ensure the octo tools are available you should use the `Use a specific octo version` task at the start of your build.

### TFS Build Agents / VSTS Custom agents
You can choose to either use the correpsonding installer tasks or manually installing dependencies. Microsoft also has public repositories for their [hosted images](https://github.com/Microsoft/vsts-image-generation) as well as
[docker images](https://github.com/Microsoft/vsts-agent-docker) which can be used as starting points.

## Create an Octopus Deploy Connected Service
Before adding any Build or Release tasks to your process, configure an "Octopus Deploy" connected service in the administration section for your project.

You'll need an API Key for a user that has sufficient permissions for the tasks you want to perform in your build and release process.
For example, if your build needs to create a Release for Project A, the user who owns that API key will need ReleaseCreate role either unscoped or scoped to Project A.

![Connected Service](img/vstsbuild-octopusendpoint-1.png)

![Connected Service](img/vstsbuild-octopusendpoint-2.png)

<hr/>

## Tasks and Widgets

This extension adds the following tasks:

- Use a specific octo version
- Package Application
- Push Packages to Octopus
- Create Octopus Release
- Deploy Octopus Release
- Promote Octopus Release

And the following widget:

- Octopus Deploy Status

<hr />

### Use a specific octo version
![Specific Octo Version Step](img/use-octo-version-3.0.png)
Options include:
* **Version**: The verion to use or 'latest' to always use the most recent version

### <a name="package-application"></a>![Package Icon](img/octopus_package-03.png) Package Application

*Note: You can still use [OctoPack](http://docs.octopusdeploy.com/display/OD/Using+OctoPack) as part of your MSBuild task to package and push Nuget packages to Octopus when targeting full .NET framework projects.*

 ![Configure Package Application Step](img/create-package-options-2.0.png)
 Options include:
 * **Package ID**: The ID of the package. e.g. MyCompany.App
 * **Package Format**: NuPkg or Zip
 * **Package Version**: The version of the package; must be a valid [SemVer](http://semver.org/) version; defaults to a timestamp-based version.
 * **Source Path**: The folder containing the files and folders to package. Defaults to working directory.
 * **Output Path**: The directory into which the generated package will be written. Defaults to working directory.
 * **NuGet Section**: This section lets you include additional details for the NuGet Package Metadata.
 * **Advanced Options Section**: Additional files to include in the package, and whether to overwrite any existing file of the same name.

### <a name="push-packages-to-octopus"></a>![Push Package Icon](img/octopus_push-01.png) Push Packages to Octopus

 ![Configure Push Application Step](img/push-packages-options-2.0.png)
 Options include:
 * **Octopus Deploy Server**: Dropdown for selecting your Octopus Server (click Add or Manage to [create](#create-connected-service)).
 * **Package**: Package file to push. To push multiple packages, enter on multiple lines.
 * **Replace Existing**: If the package already exists in the repository, the default behavior is to reject the new package being pushed. Set this flag to 'True' to overwrite the existing package.
 * **Additional Arguments**: Any additional [Octo.exe arguments](http://docs.octopusdeploy.com/display/OD/Pushing+packages) to include

### <a name="create-octopus-release"></a>![Create Release Icon](img/octopus_create-release-04.png) Create Octopus Release

 ![Configure Create Release Step](img/create-release-options-2.0.png)

 Options include:
 * **Octopus Deploy Server**: Dropdown for selecting your Octopus Server (click Add or Manage to [create](#create-connected-service)).
 * **Project Name**: The name of the Octopus project to create a release for.
 * **Release Number**: Release number for the new release (leave blank to let Octopus decide).
 * **Channel**: Channel to use for the new release.
 * **Include Changeset comments**:  Whether to include changeset/commit comments in the Octopus release notes.
 * **Include Work Items**:  Whether to include linked work item titles in the Octopus release notes.
 * **Custom Notes**: Any additional static release notes to be included in the Octopus Release.
 * **To Environment**:  Optional environment to deploy to after Release creation.
 * **Show Deployment Progress**: Output from the deployment will appear in the log. If checked, the task will only succeed if the deployment is successful.
 * **Tenant(s)**: Comma-separated list of Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Tenant tag(s)**: Comma-separated list of Tenant tags matching Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Additional Octo.exe Arguments**:  Any additional [Octo.exe arguments](http://docs.octopusdeploy.com/display/OD/Creating+releases) to include

#### Regarding Release Notes:

The *Release Notes* options, if selected, will result in nicely formatted release notes with deep links to Team Foundation Server or Visual Studio Team Services. Even if no additional options are selected, the related VSTS Build number will be included in the Octopus release notes.

![Release Notes in Octopus Deploy Release](img/tfsbuild-releasenotes.png)

### <a name="deploy-octopus-release"></a>![Deploy Release Image](img/octopus_deploy-02.png) Deploy Octopus Release

 ![Configure Deploy Release Step](img/deploy-release-options-2.0.png)

 Options include:
 * **Octopus Deploy Server**: Dropdown for selecting your Octopus Server (click Add or Manage to [create](#create-connected-service)).
 * **Project**: The name of the Octopus project.
 * **Release Number**: Release number for the new release (defaults to latest).
 * **Deploy to Environments**: Comma-separated list of Environments to deploy to.
 * **Show Deployment Progress**: Output from the deployment will appear in the log. If checked, the task will only succeed if the deployment is successful.
 * **Tenant(s)**: Comma-separated list of Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Tenant tag(s)**: Comma-separated list of Tenant tags matching Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Additional Arguments**:  Any additional [Octo.exe arguments](http://docs.octopusdeploy.com/display/OD/Creating+releases) to include

### <a name="promote-octopus-release"></a>![Promote Release Image](img/octopus_promote-05.png) Promote Octopus Release

![Configure Promote Release Step](img/promote-release-options-2.0.png)

Options include:
 * **Octopus Deploy Server**: Dropdown for selecting your Octopus Server (click Manage to [create](#create-connected-service)).
 * **Project**: The name of the Octopus project.
 * **Promote From**: Environment to promote a deployment from.
 * **Promote To**: Environment to promote a deployment to.
 * **Show Deployment Progress**: Output from the deployment will appear in the log. If checked, the task will only succeed if the deployment is successful.
 * **Tenant(s)**: Comma-separated list of Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Tenant tag(s)**: Comma-separated list of Tenant tags matching Tenants to deploy to. Note that if completed, this will be treated as a [Tenanted Deployment](http://docs.octopusdeploy.com/display/OD/Multi-tenant+deployments) by Octopus.
 * **Additional Arguments**:  Any additional [Octo.exe arguments](http://docs.octopusdeploy.com/display/OD/Creating+releases) to include

<hr/>

### <a name="octopus-status-widget"></a>![Octopus Deploy Status Widget](img/widget-icon.jpg) Octopus Deploy Status Widget

![Multiple Widgets on Dashboard](img/multiple-widget-preview.jpg)

Configuration settings:
 * **Size**: Either a 1x1 or a 2x1 widget size
 * **Octopus Connection**: Dropdown for selecting your Octopus Server
 * **Octopus Project**: Dropdown for selecting your Octopus Project
 * **Environment**: Dropdown for selecting your Octopus Environment. Note that you may select any environment, but the widget will only be populated if there is a deployment of that project to that environment.

 **Note:** Clicking on the widget will open the deployment log for the displayed task in Octopus.