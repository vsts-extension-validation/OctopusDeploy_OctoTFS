import { getOrDownloadOcto, resolvePublishedOctoVersion, addToolToPath } from "../Utils/install";
import * as tasks from 'vsts-task-lib/task';

async function run(){
    let version = await resolvePublishedOctoVersion(tasks.getInput("version"));
    console.log(`Using octo version ${version}`);
    getOrDownloadOcto(version)
        .then(addToolToPath);
}

run().then(() => {
    tasks.setResult(tasks.TaskResult.Succeeded, "")
}, (reason) => {
    tasks.setResult(tasks.TaskResult.Failed, reason)
}).catch((error) => {
    tasks.setResult(tasks.TaskResult.Failed, error)
});