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
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();
        const project = await utils.resolveProjectName(connection, tasks.getInput("Project", true))
        .then(x => x.value);

        const from = tasks.getInput("From", true);
        const to = utils.getRequiredCsvInput("To");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const deploymentForTenants = utils.getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = utils.getOptionalCsvInput("DeplyForTentantTags");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = utils.getOctoCommandRunner("promote-release");

        const configure = configureTool([

            argument("project", project),
            connectionArguments(connection),
            argument("from", from),
            multiArgument("to", to),
            multiArgument("tenant", deploymentForTenants),
            multiArgument("tenanttag", deployForTenantTags),
            flag("progress", showProgress),
            includeArguments(additionalArguments)
        ]);

        const code: number = await configure(octo).exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded promoting release with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to promote release. " + err.message);
    }
}

run();