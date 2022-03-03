import * as tasks from "azure-pipelines-task-lib/task";

import { multiArgument, connectionArguments, includeAdditionalArgumentsAndProxyConfig, flag, argumentEnquote, argumentIfSet, getOrInstallOctoCommandRunner } from "../../Utils/tool";
import { getLineSeparatedItems, resolveGlobs } from "../../Utils/inputs";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";

async function run() {
    try {
        const connection = getDefaultOctopusConnectionDetailsOrThrow();

        const space = tasks.getInput("Space");
        const packages = getLineSeparatedItems(tasks.getInput("Package", true));
        const replace = tasks.getBoolInput("Replace");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = await getOrInstallOctoCommandRunner("push");
        const matchedPackages = await resolveGlobs(packages);

        const configure = [
            connectionArguments(connection),
            argumentIfSet(argumentEnquote, "space", space),
            multiArgument(argumentEnquote, "package", matchedPackages),
            flag("replace-existing", replace),
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
