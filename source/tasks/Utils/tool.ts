import * as tasks from 'vsts-task-lib/task';
import { ToolRunner } from 'vsts-task-lib/toolrunner';
import { OctoServerConnectionDetails } from "./connection";
import { curry } from "ramda";
import { isNullOrWhitespace } from "./inputs";
import { Option, some, none } from "fp-ts/lib/Option"
import { Either, right, fromOption  } from "fp-ts/lib/Either";
import { getOrDownloadOcto, addToolToPath, resolvePublishedOctoVersion } from './install';
export const ToolName = "Octo";

export interface ArgFormatter{
    (name: string, value: string, tool: ToolRunner): ToolRunner;
}

function stringOption(value?: string): Option<string> {
    return isNullOrWhitespace(value) ? none : some(value);
}

export async function getOrInstallOctoCommandRunner(command: string) : Promise<Either<string, ToolRunner>>{
    //If we can't find octo then it hasn't been added as an installer task
    //or it hasn't been added to the path.
    let octo = getOctoCommandRunner(command);
    if (octo.isSome()){
        return right(octo.value);
    }

    return resolvePublishedOctoVersion("latest")
    .then(getOrDownloadOcto)
    .then(addToolToPath)
    .then(() => getOctoCommandRunner(command))
    .then(fromOption("Unable to find or install octo."));
}

export function getOctoCommandRunner(command: string) : Option<ToolRunner> {
    const isWindows = /windows/i.test(tasks.osType());
    if(isWindows){
        return stringOption(tasks.which(`${ToolName}`, false))
        .map(tasks.tool)
        .map(x => x.arg(command));
    }

    return getPortableOctoCommandRunner(command);
}

export function getPortableOctoCommandRunner(command: string) : Option<ToolRunner>{
    const octo = stringOption(tasks.which(`${ToolName}.dll`, false));
    const tool = tasks.tool(tasks.which("dotnet", true));

    var result =  octo.map(x => tool
        .arg(`${x}`)
        .arg(command)
    );

    return result;
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