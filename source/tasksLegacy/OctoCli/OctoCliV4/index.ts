/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as tasks from "azure-pipelines-task-lib/task";
import { connectionArguments, getOrInstallOctoCommandRunner, includeAdditionalArguments } from "../../Utils/tool";
import { getDefaultOctopusConnectionDetailsOrThrow } from "../../Utils/connection";

async function run() {
    try {
        const connection = getDefaultOctopusConnectionDetailsOrThrow();
        const args = tasks.getInput("args", false);
        const command = tasks.getInput("command", true);
        // @ts-ignore
        const octo = await getOrInstallOctoCommandRunner(command);

        // @ts-ignore
        const configure = [connectionArguments(connection), includeAdditionalArguments(args)];

        const code: number = await octo
            .map((x) => x.launchOcto(configure))
            .getOrElseL((x) => {
                throw new Error(x);
            });

        tasks.setResult(tasks.TaskResult.Succeeded, `Succeeded executing octo command ${command} with code ${code}`);
    } catch (err) {
        // @ts-ignore
        tasks.error(err);
        // @ts-ignore
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo command. " + err.message);
    }
}

run();
