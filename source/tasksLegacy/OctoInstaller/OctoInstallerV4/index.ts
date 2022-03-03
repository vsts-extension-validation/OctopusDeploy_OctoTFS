/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getOrDownloadOcto, resolvePublishedOctoVersion, addToolToPath, getEmbeddedOcto } from "../../Utils/install";
import * as tasks from "azure-pipelines-task-lib/task";

async function run() {
    const version = tasks.getInput("version");
    // @ts-ignore
    const forceEmbedded = /embedded/i.test(version);

    try {
        if (forceEmbedded) {
            console.log("Forcing the use of the embedded Octopus CLI tool.");
            await getEmbeddedOcto(tasks.resolve(__dirname, "embedded")).then(addToolToPath);
        } else {
            const option = await resolvePublishedOctoVersion(version);
            console.log(`Using Octopus CLI tool version ${option.version}`);
            await getOrDownloadOcto(option).then(addToolToPath);
        }

        tasks.setResult(tasks.TaskResult.Succeeded, "");
    } catch (error) {
        if (forceEmbedded) {
            // @ts-ignore
            tasks.setResult(tasks.TaskResult.Failed, error);
            return;
        }

        console.log(`Failed to resolve Octopus CLI tool version ${version}. Using the embedded version. ${error}`);

        try {
            await getEmbeddedOcto(tasks.resolve(__dirname, "embedded")).then(addToolToPath);
        } catch (embeddedOctoError) {
            // @ts-ignore
            tasks.setResult(tasks.TaskResult.Failed, embeddedOctoError);
        }
    }
}

run();
