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
        const releaseNumber = tasks.getInput("ReleaseNumber", true);
        let environments;
        let deploymentForTenants;
        const deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTags");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        if (hasSpaces) {
            space = await utils.resolveSpaceName(connection, tasks.getInput("SpaceId", true)).then(x => x.value);
            project = await utils.resolveProjectName(connection, tasks.getInput("ProjectNameInSpace", true)).then(x => x.value);
            environments = utils.getRequiredCsvInput("EnvironmentsInSpace");
            deploymentForTenants = utils.getOptionalCsvInput("DeployForTenantsInSpace");
        }
        else {
            space = null;
            project = await utils.resolveProjectName(connection, tasks.getInput("Project", true)).then(x => x.value);
            environments = utils.getRequiredCsvInput("Environments");
            deploymentForTenants = utils.getOptionalCsvInput("DeployForTenants");
        }

        const octo = await utils.getOrInstallOctoCommandRunner("deploy-release");

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            argumentEnquote("releaseNumber", releaseNumber),
            connectionArguments(connection),
            multiArgument(argumentEnquote, "deployTo", environments),
            multiArgument(argumentEnquote, "tenant", deploymentForTenants),
            multiArgument(argumentEnquote, "tenanttag", deployForTenantTags),
            flag("progress", showProgress),
            includeArguments(additionalArguments)
        ];

        const code:Number = await octo.map(x => x.launchOcto(configure))
            .getOrElseL((x) => { throw new Error(x); });

        tasks.setResult(tasks.TaskResult.Succeeded, "Deploy succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to deploy release " + err.message);
    }
}

run();
