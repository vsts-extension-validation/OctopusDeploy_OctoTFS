import * as tasks from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { OctoServerConnectionDetails } from "./connection";
import { curry } from "ramda";
import { isNullOrWhitespace } from "./inputs";

export const ToolName = "Octo";

export interface ArgFormatter{
    (name: string, value: string, tool: ToolRunner): ToolRunner;
}

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

export const multiArgument = curry((arg: ArgFormatter, name: string, values: string[], tool: ToolRunner) => {
    values.forEach(value =>  arg(name, value, tool))
    return tool;
});

export const argument = curry((name: string, value: string | null | undefined, tool: ToolRunner) => {
    return tool.line(`--${name}=${value}`);
});

export const argumentEnquote = curry((name: string, value: string | null | undefined, tool: ToolRunner) => {
    return argument(name, `"${value}"`, tool);
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

export const argumentIf = curry((predicate: (value: string | null | undefined) => boolean, arg: ArgFormatter, name: string, value: string | null | undefined, tool: ToolRunner) : ToolRunner => {
    if(predicate(value)){
        return arg(name, value || "", tool);
    }
    return tool;
});

export const argumentIfSet = argumentIf((val) => !isNullOrWhitespace(val));