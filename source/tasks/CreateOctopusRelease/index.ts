import * as tasks from 'azure-pipelines-task-lib/task';
import * as utils from "../Utils";
import {
    multiArgument,
    connectionArguments,
    includeArguments,
    flag,
    argumentEnquote,
    argumentIfSet
} from '../Utils/tool';

async function run() {
    try {
        const environmentVariables = utils.getVstsEnvironmentVariables();
        const vstsConnection = utils.createVstsConnection(environmentVariables);
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();

        const hasSpaces = tasks.getBoolInput("HasSpaces");
        const legacySpaceString = tasks.getInput("Space");

        let space;
        let project;
        const releaseNumber = tasks.getInput("ReleaseNumber");
        let channel;
        const changesetCommentReleaseNotes = tasks.getBoolInput("ChangesetCommentReleaseNotes");
        const workItemReleaseNotes = tasks.getBoolInput("WorkItemReleaseNotes");
        const customReleaseNotes = tasks.getInput("CustomReleaseNotes");
        let deployToEnvironments;
        let deployForTenants;
        let deployForTenantTags;
        let deploymentProgress;
        const additionalArguments = tasks.getInput("AdditionalArguments");

        let spaceId = tasks.getInput("SpaceId", true);
        const hasLegacySpace = !legacySpaceString && legacySpaceString.length > 0;
        const hasModernSpace = hasSpaces && (!spaceId && spaceId.length > 0);

        if (legacySpaceString && !hasModernSpace) {
            // Use legacy value - Override space and use non-space related project, channel etc
            space = legacySpaceString;
            project = await utils.resolveProjectName(connection, tasks.getInput("ProjectName", true)).then(x => x.value);
            channel = tasks.getInput("Channel");
            deployToEnvironments = utils.getOptionalCsvInput("DeployToEnvironment");
            deployForTenants = utils.getOptionalCsvInput("DeployForTenants");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTags");
            deploymentProgress = tasks.getBoolInput("DeploymentProgress");
        }
        else if ((hasLegacySpace && hasModernSpace) || (!legacySpaceString && hasModernSpace)) {
            // Ignore legacy value and new modern values
            space = await utils.resolveSpaceName(connection, spaceId).then(x => x.value);
            project = await utils.resolveProjectNameInSpace(connection, spaceId, tasks.getInput("ProjectNameInSpace", true)).then(x => x.value);
            channel = tasks.getInput("ChannelInSpace");
            deployToEnvironments = utils.getOptionalCsvInput("DeployToEnvironmentInSpace");
            deployForTenants = utils.getOptionalCsvInput("DeployForTenantsInSpace");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTagsInSpace");
            deploymentProgress = tasks.getBoolInput("DeploymentProgressInSpace");
        }
        else {
            // No Space or Default Space
            space = null;
            project = await utils.resolveProjectName(connection, tasks.getInput("ProjectName", true)).then(x => x.value);
            channel = tasks.getInput("Channel");
            deployToEnvironments = utils.getOptionalCsvInput("DeployToEnvironment");
            deployForTenants = utils.getOptionalCsvInput("DeployForTenants");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTags");
            deploymentProgress = tasks.getBoolInput("DeploymentProgress");
        }

        const octo = await utils.getOrInstallOctoCommandRunner("create-release");

        let linkedReleaseNotes = "";
        if(workItemReleaseNotes || changesetCommentReleaseNotes){
            linkedReleaseNotes = await utils.getLinkedReleaseNotes(vstsConnection, changesetCommentReleaseNotes, workItemReleaseNotes);
        }

        const releaseNotesFile = utils.createReleaseNotesFile(() => {
            return utils.generateReleaseNotesContent(environmentVariables, linkedReleaseNotes, customReleaseNotes);
        },  environmentVariables.defaultWorkingDirectory);

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            argumentIfSet(argumentEnquote, "releaseNumber", releaseNumber),
            argumentIfSet(argumentEnquote, "channel", channel),
            connectionArguments(connection),
            flag("enableServiceMessages", true),
            multiArgument(argumentEnquote, "deployTo", deployToEnvironments),
            flag("progress", deployToEnvironments.length > 0 && deploymentProgress),
            multiArgument(argumentEnquote, "tenant", deployForTenants),
            multiArgument(argumentEnquote, "tenanttag", deployForTenantTags),
            argumentEnquote("releaseNotesFile", releaseNotesFile),
            includeArguments(additionalArguments)
        ];

        const code:Number = await octo.map(x => x.launchOcto(configure))
            .getOrElseL((x) => { throw new Error(x); });

        tasks.setResult(tasks.TaskResult.Succeeded, "Create octopus release succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to deploy release " + err.message);
    }
}

run();