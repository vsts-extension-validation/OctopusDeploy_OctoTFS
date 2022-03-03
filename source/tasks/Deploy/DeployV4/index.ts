import * as tasks from "azure-pipelines-task-lib/task";
import { argumentEnquote, argumentIfSet, assertOctoVersionAcceptsIds, connectionArguments, flag, getOrInstallOctoCommandRunner, includeAdditionalArgumentsAndProxyConfig, multiArgument } from "../../../Utils/tool";
import { getOptionalCsvInput, getRequiredCsvInput } from "../../../Utils/inputs";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../../Utils/connection";

async function run() {
    try {
        const connection = getDefaultOctopusConnectionDetailsOrThrow();

        const space = tasks.getInput("Space");
        const project = tasks.getInput("Project", true);
        const releaseNumber = tasks.getInput("ReleaseNumber", true);
        const deployToEnvironments = getRequiredCsvInput("Environments");
        const deployForTenants = getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = getOptionalCsvInput("DeployForTenantTags");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");
        await assertOctoVersionAcceptsIds();
        const octo = await getOrInstallOctoCommandRunner("deploy-release");

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            argumentEnquote("releaseNumber", releaseNumber),
            connectionArguments(connection),
            multiArgument(argumentEnquote, "deployTo", deployToEnvironments),
            multiArgument(argumentEnquote, "tenant", deployForTenants),
            multiArgument(argumentEnquote, "tenanttag", deployForTenantTags),
            flag("progress", showProgress),
            includeAdditionalArgumentsAndProxyConfig(connection.url, additionalArguments),
        ];

        const code: number = await octo
            .map((x) => x.launchOcto(configure))
            .getOrElseL((x) => {
                throw new Error(x);
            });

        tasks.setResult(tasks.TaskResult.Succeeded, "Deploy succeeded with code " + code);
    } catch (err) {
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to deploy release " + err.message);
    }
}

run();
