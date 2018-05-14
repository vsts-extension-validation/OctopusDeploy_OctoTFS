import * as tasks from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import path = require('path');

async function run(){
    try{
        const octoConnectedServiceName = tasks.getInput("OctoConnectedServiceName", true);
        const args = tasks.getInput("args", false);
        const command = tasks.getInput("command", true);

        const octoEndpointAuthorization = tasks.getEndpointAuthorization(octoConnectedServiceName, false);
        const octopusUrl = tasks.getEndpointUrl(octoConnectedServiceName, false);
        const apiKey = octoEndpointAuthorization.parameters["apitoken"];

        const dotnet: ToolRunner =tasks.tool(tasks.which("dotnet", false));
        const octo = tasks.which("Octo", true);

        dotnet.arg(`${octo}.dll`);
        dotnet.arg(command);
        dotnet.arg(`--server=${octopusUrl}`);
        dotnet.arg(`--apiKey=${apiKey}`);
        dotnet.line(args);

        const code: number = await dotnet.exec();

        tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
    }catch(err){
        tasks.error(err);
        tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo command. " + err.message);
    }
}

run();