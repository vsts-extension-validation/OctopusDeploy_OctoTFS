import * as tasks from 'azure-pipelines-task-lib/task';
import * as utils from "../../Utils";
import {
    multiArgument,
    connectionArguments,
    includeArguments,
    flag,
    argumentEnquote,
    argumentIfSet
} from '../../Utils';

async function run() {
    try {
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();

        const spaceId = tasks.getInput("Space");
        const space = await utils.resolveSpaceName(connection, spaceId).then(x => x.value);
        const project = await utils.resolveProjectName(connection, tasks.getInput("Project", true)).then(x => x.value);
        const from = tasks.getInput("From", true);
        const to = utils.getRequiredCsvInput("To");
        const deployForTenants = utils.getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags= utils.getOptionalCsvInput("DeployForTenantTags");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = await utils.getOrInstallOctoCommandRunner("promote-release");

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            connectionArguments(connection),
            argumentEnquote("from", from),
            multiArgument(argumentEnquote, "to", to),
            multiArgument(argumentEnquote, "tenant", deployForTenants),
            multiArgument(argumentEnquote, "tenanttag", deployForTenantTags),
            flag("progress", showProgress),
            includeArguments(additionalArguments)
        ];

        const code:Number = await octo.map(x => x.launchOcto(configure))
            .getOrElseL((x) => { throw new Error(x); });

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded promoting release with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to promote release. " + err.message);
    }
}

run();