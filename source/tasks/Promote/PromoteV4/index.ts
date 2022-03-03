import * as tasks from "azure-pipelines-task-lib/task";
import { argumentEnquote, argumentIfSet, assertOctoVersionAcceptsIds, connectionArguments, flag, getOrInstallOctoCommandRunner, includeAdditionalArgumentsAndProxyConfig, multiArgument } from "../../Utils/tool";
import { getOptionalCsvInput, getRequiredCsvInput } from "../../Utils/inputs";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";

async function run() {
    try {
        const connection = getDefaultOctopusConnectionDetailsOrThrow();

        const space = tasks.getInput("Space");
        const project = tasks.getInput("Project", true);
        const from = tasks.getInput("From", true);
        const to = getRequiredCsvInput("To");
        const deployForTenants = getOptionalCsvInput("DeployForTenants");
        const deployForTenantTags = getOptionalCsvInput("DeployForTenantTags");
        const showProgress = tasks.getBoolInput("ShowProgress");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        await assertOctoVersionAcceptsIds();
        const octo = await getOrInstallOctoCommandRunner("promote-release");

        const configure = [
            argumentIfSet(argumentEnquote, "space", space),
            argumentEnquote("project", project),
            connectionArguments(connection),
            argumentEnquote("from", from),
            multiArgument(argumentEnquote, "to", to),
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

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded promoting release with code " + code);
    } catch (err) {
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to promote release. " + err.message);
    }
}

run();
