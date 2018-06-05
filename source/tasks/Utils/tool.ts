import * as tasks from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { OctoServerConnectionDetails } from "./connection";
import { curry } from "ramda";
import { isNullOrWhitespace } from "./inputs";

export const ToolName = "Octo";

export function getOctoCommandRunner(command: string) : ToolRunner {
    const octo = tasks.which(`${ToolName}.dll`, true);
    const tool = tasks.tool(tasks.which("dotnet", false));

    return tool
    .arg(`${octo}`)
    .arg(command);
}

export const connectionArguments = curry(({url, apiKey } : OctoServerConnectionDetails, tool: ToolRunner) => {
    return tool.arg(`--server=${url}`)
               .arg(`--apiKey=${apiKey}`);
});

export const multiArgument = curry((name: string, values: string[], tool: ToolRunner) => {
    values.forEach(value =>  argument(name, value, tool))
    return tool;
});

export const argument = curry((name: string, value: string | null, tool: ToolRunner) => {
    return tool.arg(`--${name}`).arg(value || "");
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

export const argumentIf = curry((predicate: (value: string | null) => boolean, name: string, value: string | null, tool: ToolRunner) : ToolRunner => {
    if(predicate(value)){
        return argument(name, value, tool);
    }
    return tool;
});

export const argumentIfSet = argumentIf((val) => !isNullOrWhitespace(val));