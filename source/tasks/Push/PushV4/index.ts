import * as tasks from "azure-pipelines-task-lib/task";

import { getLineSeparatedItems, getOverwriteModeFromReplaceInput, resolveGlobs } from "../../Utils/inputs";
import { argument, argumentEnquote, argumentIfSet, assertOctoVersionAcceptsIds, connectionArguments, getOrInstallOctoCommandRunner, includeAdditionalArgumentsAndProxyConfig, multiArgument } from "../../Utils/tool";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";

async function run() {
    try {
        const connection = getDefaultOctopusConnectionDetailsOrThrow();

        const space = tasks.getInput("Space");
        const packages = getLineSeparatedItems(tasks.getInput("Package", true));
        const overwriteMode = getOverwriteModeFromReplaceInput(tasks.getInput("Replace", true));
        const additionalArguments = tasks.getInput("AdditionalArguments");

        await assertOctoVersionAcceptsIds();
        const octo = await getOrInstallOctoCommandRunner("push");
        const matchedPackages = await resolveGlobs(packages);

        const configure = [
            connectionArguments(connection),
            argumentIfSet(argumentEnquote, "space", space),
            multiArgument(argumentEnquote, "package", matchedPackages),
            argument("overwrite-mode", overwriteMode),
            includeAdditionalArgumentsAndProxyConfig(connection.url, additionalArguments),
        ];

        const code: number = await octo
            .map((x) => x.launchOcto(configure))
            .getOrElseL((x) => {
                throw new Error(x);
            });

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    } catch (err) {
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to push package. " + err.message);
    }
}

run();
