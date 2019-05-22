import * as tasks from 'azure-pipelines-task-lib/task';
import * as utils from "../../Utils";
import {
    multiArgument,
    connectionArguments,
    includeArguments,
    flag,
    argumentEnquote,
    argumentIfSet
} from '../../Utils/tool';

async function run() {
    try {
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();
        const hasSpaces = tasks.getBoolInput("HasSpaces");

        let space;
        let project;
        const releaseNumber = tasks.getInput("ReleaseNumber", true);
        let deployToEnvironments;
        let deployForTenants;
        let deployForTenantTags;
        const showProgress = tasks.getBoolInput("ShowProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const legacySpaceString = tasks.getInput("Space");
        let spaceId = tasks.getInput("SpaceId");
        const hasLegacySpace = legacySpaceString && legacySpaceString.length > 0;
        const hasModernSpace = hasSpaces && (spaceId && spaceId.length > 0);

        if (legacySpaceString && !hasModernSpace) {
            // Use legacy value - Override space and use non-space related project, channel etc
            space = legacySpaceString;
            project = await utils.resolveProjectName(connection, tasks.getInput("Project", true)).then(x => x.value);
            deployToEnvironments = utils.getRequiredCsvInput("Environments");
            deployForTenants = utils.getOptionalCsvInput("DeployForTenants");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTags");
        }
        else if ((hasLegacySpace && hasModernSpace) || (!legacySpaceString && hasModernSpace)) {
            // Ignore legacy value and new modern values
            space = await utils.resolveSpaceName(connection, spaceId).then(x => x.value);
            project = await utils.resolveProjectNameInSpace(connection, spaceId, tasks.getInput("ProjectNameInSpace", true)).then(x => x.value);
            deployToEnvironments  = utils.getOptionalCsvInput("EnvironmentsInSpace");
            deployForTenants = utils.getOptionalCsvInput("DeployForTenantsInSpace");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTagsInSpace");
        }
        else {
            // No Space or Default Space
            space = null;
            project = await utils.resolveProjectName(connection, tasks.getInput("Project", true)).then(x => x.value);
            deployToEnvironments = utils.getRequiredCsvInput("Environments");
            deployForTenants = utils.getOptionalCsvInput("DeployForTenants");
            deployForTenantTags = utils.getOptionalCsvInput("DeployForTenantTags");
        }

        const octo = await utils.getOrInstallOctoCommandRunner("deploy-release");

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            argumentEnquote("releaseNumber", releaseNumber),
            connectionArguments(connection),
            multiArgument(argumentEnquote, "deployTo", deployToEnvironments),
            multiArgument(argumentEnquote, "tenant", deployForTenants),
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
