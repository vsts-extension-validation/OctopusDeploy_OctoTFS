import * as tasks from 'vsts-task-lib/task';
import * as utils from "../Utils";
import {
    argument,
    multiArgument,
    connectionArguments,
    includeArguments,
    configureTool,
    flag
} from '../Utils/tool';

async function run() {
    try {
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();

        const releaseNumber = tasks.getInput("ReleaseNumber", true);
        const environments = utils.getRequiredCsvInput("Environments");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const deploymentForTenants = utils.getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = utils.getOptionalCsvInput("DeplyForTentantTags");
        const additionalArguments = tasks.getInput("AdditionalArguments");
        const project = await utils.resolveProjectName(connection, tasks.getInput("Project", true))
            .then(x => x.value);

        const octo = utils.getOctoCommandRunner("deploy-release");

        const configure = configureTool([
            argument("project", project),
            argument("releaseNumber", releaseNumber),
            connectionArguments(connection),
            multiArgument("deployTo", environments),
            multiArgument("tenant", deploymentForTenants),
            multiArgument("tenanttag", deployForTenantTags),
            flag("progress", showProgress),
            includeArguments(additionalArguments)
        ]);

        const code:number = await configure(octo).exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Deploy succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to deploy release " + err.message);
    }
}

run();