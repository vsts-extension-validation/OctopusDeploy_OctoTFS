import * as tasks from 'vsts-task-lib/task';
import * as utils from "../Utils";
import {
    multiArgument,
    connectionArguments,
    includeArguments,
    configureTool,
    flag,
    argumentEnquote
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
            argumentEnquote("project", project),
            argumentEnquote("releaseNumber", releaseNumber),
            connectionArguments(connection),
            multiArgument(argumentEnquote, "deployTo", environments),
            multiArgument(argumentEnquote, "tenant", deploymentForTenants),
            multiArgument(argumentEnquote, "tenanttag", deployForTenantTags),
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