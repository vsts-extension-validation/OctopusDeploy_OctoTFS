import * as tasks from 'vsts-task-lib/task';
import * as utils from "tasks/Utils";
import {
    argument,
    multiArgument,
    connectionArguments,
    includeArguments,
    configureTool,
    flag
} from 'tasks/Utils/tool';


async function run() {
    try {
        const connection = utils.getDefaultOctopusConnectionDetails();
        const project = await utils.resolveProjectName(connection, tasks.getInput("Project", true))
        .then(x => x.right());
        const releaseNumber = tasks.getInput("ReleaseNumber", true);
        const channel = tasks.getInput("Channel");
        const changesetCommentReleaseNotes = tasks.getBoolInput("ChangesetCommentReleaseNotes");
        const workItemReleaseNotes = tasks.getBoolInput("WorkItemReleaseNotes");
        const customReleaseNotes = tasks.getInput("CustomReleaseNotes");
        const deployToEnvironments = utils.getRequiredCsvInput("DeployToEnvironment");
        const deployForTenants = utils.getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = utils.getOptionalCsvInput("DeployForTentantTags");
        const deploymentProgress = tasks.getBoolInput("DeploymentProcess")
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = utils.getOctoCommandRunner("create-release");

        const configure = configureTool([
            argument("project", project),
            argument("releaseNumber", releaseNumber),
            argument("channel", channel),
            connectionArguments(connection),
            flag("enableServiceMessages", true),
            multiArgument("deployTo", deployToEnvironments),
            flag("progress", deployToEnvironments.length > 0 && deploymentProgress),
            multiArgument("tenant", deployForTenants),
            multiArgument("tenanttag", deployForTenantTags),
            includeArguments(additionalArguments)
        ]);

        const code:number = await configure(octo).exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to deploy release " + err.message);
    }
}

run();