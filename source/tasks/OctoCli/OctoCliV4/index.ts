import * as tasks from "azure-pipelines-task-lib/task";
import { connectionArguments, getOrInstallOctoCommandRunner, includeAdditionalArguments } from "../../Utils/tool";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";

async function run() {
    try {
        const connection = getDefaultOctopusConnectionDetailsOrThrow();
        const args = tasks.getInput("args", false);
        const command = tasks.getInput("command", true);
        const octo = await getOrInstallOctoCommandRunner(command);

        const configure = [connectionArguments(connection), includeAdditionalArguments(args)];

        const code: number = await octo
            .map((x) => x.launchOcto(configure))
            .getOrElseL((x) => {
                throw new Error(x);
            });

        tasks.setResult(tasks.TaskResult.Succeeded, `Succeeded executing octo command ${command} with code ${code}`);
    } catch (err) {
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo command. " + err.message);
    }
}

run();
