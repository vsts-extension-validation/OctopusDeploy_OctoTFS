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
        const packages = utils.getLineSeparatedItems(tasks.getInput("Package", true));
        const replace = tasks.getBoolInput("Replace");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = await utils.getOrInstallOctoCommandRunner("push");
        const matchedPackages = await utils.resolveGlobs(packages)

        const configure = configureTool([
            connectionArguments(connection),
            multiArgument(argumentEnquote, "package", matchedPackages),
            flag("replace-existing", replace),
            includeArguments(additionalArguments)
        ]);

        const code:Number = await octo.map(configure)
            .getOrElseL((x) => { throw new Error(x); })
            .exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to push package. " + err.message);
    }
}

run();