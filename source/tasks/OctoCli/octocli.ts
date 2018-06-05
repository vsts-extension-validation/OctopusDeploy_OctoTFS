import * as tasks from 'vsts-task-lib/task';
import * as utils from "../Utils";
import {
    connectionArguments,
    includeArguments,
    configureTool,

} from '../Utils/tool';

async function run(){
    try{
        const connection = utils.getDefaultOctopusConnectionDetailsOrThrow();
        const args = tasks.getInput("args", false);
        const command = tasks.getInput("command", true);
        const octo = utils.getOctoCommandRunner(command);

        const configure = configureTool([
            connectionArguments(connection),
            includeArguments(args)
        ]);

        const code:number = await configure(octo).exec();

        tasks.setResult(tasks.TaskResult.Succeeded, `Succeeded executing octo command ${command} with code ${code}`);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo command. " + err.message);
    }
}

run();