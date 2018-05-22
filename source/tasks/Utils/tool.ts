import * as tasks from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { OctoServerConnectionDetails } from "./connection";

export const ToolName = "octo";

export function getOctoCommandRunner(command: string) : ToolRunner {
    const tool = tasks.tool(tasks.which(ToolName, false));
    return tool.arg(command);
}

export function addConnectionArgs( {url, apiKey } : OctoServerConnectionDetails, tool: ToolRunner) {
    return tool.arg(`--server=${url}`)
               .arg(`--apiKey=${apiKey}`);
}

export function addMultiArg(name: string, values: string[], tool: ToolRunner){
    values.forEach(value =>  addOctoArg(name, value, tool))
    return tool;
}

export function addOctoArg(name: string, value: string, tool: ToolRunner){
    return tool.arg(`--${name}="${value}"`);
}
