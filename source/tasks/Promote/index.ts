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
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();
        const hasSpaces = tasks.getBoolInput("HasSpaces");

        let space;
        let project;
        let from;
        let to;
        let deploymentForTenants;
        let deployForTenantTags;
        const showProgress = tasks.getBoolInput("ShowProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        if (hasSpaces) {
            space = await utils.resolveSpaceName(connection, tasks.getInput("SpaceId", true)).then(x => x.value);
            project =  await utils.resolveProjectName(connection, tasks.getInput("ProjectInSpace", true)).then(x => x.value);
            from = tasks.getInput("FromEnvironmentInSpace", true);
            to = utils.getRequiredCsvInput("ToEnvironmentsInSpace");
            deploymentForTenants = utils.getOptionalCsvInput("DeployForTenantsInSpace");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTentantTagsInSpace");
        }
        else {
            space = null;
            project = await utils.resolveProjectName(connection, tasks.getInput("Project", true)).then(x => x.value);
            from = tasks.getInput("From", true);
            to = utils.getRequiredCsvInput("To");
            deploymentForTenants = utils.getOptionalCsvInput("DeployForTenants");
            deployForTenantTags= utils.getOptionalCsvInput("DeployForTentantTags");
        }

        const octo = await utils.getOrInstallOctoCommandRunner("promote-release");

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            connectionArguments(connection),
            argumentEnquote("from", from),
            multiArgument(argumentEnquote, "to", to),
            multiArgument(argumentEnquote, "tenant", deploymentForTenants),
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