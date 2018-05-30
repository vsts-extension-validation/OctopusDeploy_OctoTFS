import * as tasks from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { OctoServerConnectionDetails } from "./connection";
import { curry } from "ramda";

export const ToolName = "octo";

export function getOctoCommandRunner(command: string) : ToolRunner {
    const tool = tasks.tool(tasks.which(ToolName, false));
    return tool.arg(command);
}

export const connectionArguments = curry(({url, apiKey } : OctoServerConnectionDetails, tool: ToolRunner) => {
    return tool.arg(`--server=${url}`)
               .arg(`--apiKey=${apiKey}`);
});

export const multiArgument = curry((name: string, values: string[], tool: ToolRunner) => {
    values.forEach(value =>  argument(name, value, tool))
    return tool;
});

export const argument = curry((name: string, value: string, tool: ToolRunner) => {
    return tool.arg(`--${name}="${value}"`);
});

export const includeArguments = curry((value: string, tool: ToolRunner) => {
    return tool.line(value);
});

export const configureTool = curry((configurations: Array<(tool: ToolRunner) => ToolRunner>, tool: ToolRunner) => {
    configurations.forEach(x => x(tool));
    return tool;
});

export const flag = curry((name: string, value: boolean, tool: ToolRunner) => {
    return value ? tool.arg(`--${name}`) : tool;
});

export const argumentIf = curry((predicate: () => boolean, name: string, value: () => string, tool: ToolRunner) : ToolRunner => {
    if(predicate()){
        return argument(name, value(), tool);
    }
    return tool;
});