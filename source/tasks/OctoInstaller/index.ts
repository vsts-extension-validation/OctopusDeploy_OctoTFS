import { getOrDownloadOcto, resolvePublishedOctoVersion, addToolToPath } from "../Utils/install";
import * as tasks from 'vsts-task-lib/task';

async function run(){

    try{
        let version = await resolvePublishedOctoVersion(tasks.getInput("version"));
        console.log(`Using octo version ${version.version}`);
        await getOrDownloadOcto(version)
            .then(addToolToPath);

        tasks.setResult(tasks.TaskResult.Succeeded, "");
    }catch(error){
        tasks.setResult(tasks.TaskResult.Failed, error);
    }
}

run();