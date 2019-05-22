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

        const legacySpaceString = tasks.getInput("Space");
        const hasSpaces = tasks.getBoolInput("HasSpaces");
        const spaceName = tasks.getInput("SpaceName");
        let space;
        const packages = utils.getLineSeparatedItems(tasks.getInput("Package", true));
        const replace = tasks.getBoolInput("Replace");
        const additionalArguments = tasks.getInput("AdditionalArguments");

        const octo = await utils.getOrInstallOctoCommandRunner("push");
        const matchedPackages = await utils.resolveGlobs(packages);

        const hasLegacySpace = legacySpaceString && legacySpaceString.length > 0;
        const hasModernSpace = hasSpaces && (spaceName && spaceName.length > 0);

        if (legacySpaceString && !hasModernSpace) {
            // Use legacy value - Override space and use non-space related project, channel etc
            space = legacySpaceString;
        }
        else if ((hasLegacySpace && hasModernSpace) || (!legacySpaceString && hasModernSpace)) {
            // Ignore legacy value and new modern values
            space = spaceName;
        }
        else {
            // No Space or Default Space
            space = null;
        }

        const configure = [
            connectionArguments(connection),
            argumentIfSet(argumentEnquote, "space", space),
            multiArgument(argumentEnquote, "package", matchedPackages),
            flag("replace-existing", replace),
            includeArguments(additionalArguments)
        ];

        const code:Number = await octo.map(x => x.launchOcto(configure))
            .getOrElseL((x) => { throw new Error(x); });

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to push package. " + err.message);
    }
}

run();