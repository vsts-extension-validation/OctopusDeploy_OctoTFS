import * as tasks from "azure-pipelines-task-lib/task";
import { multiArgument, connectionArguments, includeAdditionalArgumentsAndProxyConfig, flag, argumentEnquote, argumentIfSet, getOrInstallOctoCommandRunner } from "../../../Utils/tool";
import { createReleaseNotesFile, createVstsConnection, generateReleaseNotesContent, getLinkedReleaseNotes, getVstsEnvironmentVariables } from "../../../Utils/environment";
import { getDefaultOctopusConnectionDetailsOrThrow, resolveProjectName } from "../../../Utils/connection";
import { getOptionalCsvInput } from "../../../Utils/inputs";

async function run() {
    try {
        const environmentVariables = getVstsEnvironmentVariables();
        const vstsConnection = createVstsConnection(environmentVariables);
        const octoConnection = getDefaultOctopusConnectionDetailsOrThrow();

        const space = tasks.getInput("Space");
        const project = await resolveProjectName(octoConnection, tasks.getInput("ProjectName", true)).then((x) => x.value);
        const releaseNumber = tasks.getInput("ReleaseNumber");
        const channel = tasks.getInput("Channel");
        const changesetCommentReleaseNotes = tasks.getBoolInput("ChangesetCommentReleaseNotes");
        const workItemReleaseNotes = tasks.getBoolInput("WorkItemReleaseNotes");
        const customReleaseNotes = tasks.getInput("CustomReleaseNotes");
        const deployToEnvironments = getOptionalCsvInput("DeployToEnvironment");
        const deployForTenants = getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = getOptionalCsvInput("DeployForTenantTags");
        const deploymentProgress = tasks.getBoolInput("DeploymentProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = await getOrInstallOctoCommandRunner("create-release");

        let linkedReleaseNotes = "";
        if (workItemReleaseNotes || changesetCommentReleaseNotes) {
            linkedReleaseNotes = await getLinkedReleaseNotes(vstsConnection, changesetCommentReleaseNotes, workItemReleaseNotes);
        }

        const releaseNotesFile = createReleaseNotesFile(() => {
            return generateReleaseNotesContent(environmentVariables, linkedReleaseNotes, customReleaseNotes);
        }, environmentVariables.defaultWorkingDirectory);

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            argumentIfSet(argumentEnquote, "releaseNumber", releaseNumber),
            argumentIfSet(argumentEnquote, "channel", channel),
            connectionArguments(octoConnection),
            flag("enableServiceMessages", true),
            multiArgument(argumentEnquote, "deployTo", deployToEnvironments),
            flag("progress", deployToEnvironments.length > 0 && deploymentProgress),
            multiArgument(argumentEnquote, "tenant", deployForTenants),
            multiArgument(argumentEnquote, "tenanttag", deployForTenantTags),
            argumentEnquote("releaseNotesFile", releaseNotesFile),
            includeAdditionalArgumentsAndProxyConfig(octoConnection.url, additionalArguments),
        ];

        const code: number = await octo
            .map((x) => x.launchOcto(configure))
            .getOrElseL((x) => {
                throw new Error(x);
            });

        tasks.setResult(tasks.TaskResult.Succeeded, "Create octopus release succeeded with code " + code);
    } catch (err) {
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to deploy release " + err.message);
    }
}

run();
