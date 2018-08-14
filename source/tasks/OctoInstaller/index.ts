import { getOrDownloadOcto, resolvePublishedOctoVersion, addToolToPath, getEmbeddedOcto } from "../Utils/install";
import * as tasks from 'vsts-task-lib/task';

async function run(){

    try{
        let version = await resolvePublishedOctoVersion(tasks.getInput("version"));
        console.log(`Using octo version ${version.version}`);
        await getOrDownloadOcto(version).then(addToolToPath);

        tasks.setResult(tasks.TaskResult.Succeeded, "");
    }catch(error){
        console.log(`Failed to resolve latest octo version. Using embedded version. ${error}`);

        try {
            await getEmbeddedOcto(tasks.resolve(__dirname, "embedded")).then(addToolToPath);
        }catch(embeddedOctoError){
            tasks.setResult(tasks.TaskResult.Failed, embeddedOctoError);
        }
    }
}

run();